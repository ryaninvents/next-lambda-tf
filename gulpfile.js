const { prompt } = require('inquirer');
const rc = require('rc');
const ini = require('ini');
const fs = require('fs');
const get = require('lodash/get');
const AWS = require('aws-sdk/global');
const S3 = require('aws-sdk/clients/s3');
const { name } = require('./package.json');

const INI_FILENAME = `${__dirname}/.siterc`;

function configAws () {
  const siterc = rc('site');
  const profile = get(siterc, 'aws.profile');
  if (profile) {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
  }
}

async function uploadSecrets () {
  const siterc = rc('site');
  configAws();
  const s3 = new S3();
  const bucket = get(siterc, 'terraform.bucket');
  const secretPrefix = get(siterc, 'secrets.prefix');
  await Promise.all([
    s3.putObject({
      Body: fs.readFileSync(`${__dirname}/deploy/backend.tf`),
      Bucket: bucket,
      Key: `${secretPrefix}/backend.tf`
    }).promise()
      .then(() => console.log('Uploaded backend.tf')),
    s3.putObject({
      Body: fs.readFileSync(`${__dirname}/deploy/terraform.tfvars.json`),
      Bucket: bucket,
      Key: `${secretPrefix}/terraform.tfvars.json`
    }).promise()
      .then(() => console.log('Uploaded terraform.tfvars.json'))
  ]);
}

async function downloadOneSecret (filename, s3) {
  const siterc = rc('site');
  const bucketObj = await s3.getObject({
    Bucket: siterc.terraform.bucket,
    Key: `${siterc.secrets.prefix}/${filename}`
  }).promise();
  fs.writeFileSync(`${__dirname}/deploy/${filename}`, bucketObj.Body);
  console.log(`Downloaded "${filename}"`);
}

async function downloadSecrets () {
  configAws();
  const s3 = new S3();
  await Promise.all([
    downloadOneSecret('backend.tf', s3),
    downloadOneSecret('terraform.tfvars.json', s3)
  ]);
}

function deployStageQuestions (siterc) {
  return [{
    name: 'deployState',
    message: 'Deployment state?',
    type: 'list',
    choices: ['dev', 'test', 'prod', 'default', 'other'],
    default: get(siterc, 'app.deployState', 'dev')
  },
  {
    name: 'deployStateOther',
    default: null,
    when: ({ deployState }) => deployState === 'other',
    message: 'Name of custom deployment state'
  }];
}

function writeSiteRc (siterc) {
  // Discard extra info that `rc` attaches
  const { _, configs, config, ...restRc } = siterc;
  fs.writeFileSync(INI_FILENAME, ini.stringify(restRc));
}

async function init () {
  const siterc = rc('site');
  const { profile, bucket, region, appName, deployState, deployStateOther, rootDomain, certArn } = await prompt([
    {
      name: 'appName',
      message: 'Name of website?',
      default: get(siterc, 'app.name', name.split('/').slice(-1)[0])
    },
    {
      name: 'profile',
      message: 'Use an AWS profile?',
      default: get(siterc, 'aws.profile', 'default')
    },
    {
      name: 'region',
      message: 'Default AWS region',
      default: get(siterc, 'aws.region', 'us-east-2')
    },
    {
      name: 'bucket',
      message: 'Name of AWS secrets bucket?',
      default: get(siterc, 'terraform.bucket', 'tfstate.example.net')
    },
    ...deployStageQuestions(siterc),
    {
      name: 'rootDomain',
      message: 'Website root domain?',
      default: get(siterc, 'app.rootDomain', 'example.net')
    },
    {
      name: 'certArn',
      message: 'Website certificate ARN from AWS Certificate Manager?',
      default: get(siterc, 'app.certArn')
    }
  ]);

  Object.assign(siterc, {
    app: {
      name: appName,
      deployState: deployStateOther || deployState,
      rootDomain,
      certArn
    },
    aws: {
      ...(profile ? { profile } : {}),
      region
    },
    secrets: {
      prefix: `apps/${appName}/${deployState}/secrets`
    },
    terraform: {
      bucket,
      key: `apps/${appName}/${deployState}/terraform.tfstate`
    }
  });

  writeSiteRc(siterc);
  await writeDeployFiles();
}

async function stage () {
  const siterc = rc('site');
  if (!siterc.app) {
    console.log('Looks like you\'re not set up; beginning full init.');
    await init();
    return;
  }
  const { deployState, deployStateOther } = await prompt(deployStageQuestions(siterc));
  siterc.app.deployState = deployStateOther || deployState;
  writeSiteRc(siterc);
  await writeDeployFiles();
}

async function initCi () {
  const {
    DEPLOY_STATE: deployState = 'default',
    TF_BUCKET: bucket,
    APP_NAME: appName,
    AWS_REGION: awsRegion = 'us-east-2'
  } = process.env;

  const siterc = {
    app: {
      name: appName
    },
    secrets: {
      prefix: `apps/${appName}/${deployState}/secrets`
    },
    terraform: {
      bucket,
      key: `apps/${appName}/${deployState}/terraform.tfstate`
    },
    aws: {
      region: awsRegion
    }
  };

  fs.writeFileSync(INI_FILENAME, ini.stringify(siterc));

  await downloadSecrets();
}

async function writeDeployFiles () {
  const siterc = rc('site');
  const profile = get(siterc, 'aws.profile');
  const bucket = get(siterc, 'terraform.bucket');
  const backend = `# Backend configuration

terraform {
  backend "s3" {${profile ? `
    profile = ${JSON.stringify(profile)}` : ''}
    bucket = ${JSON.stringify(bucket)}
    key = ${JSON.stringify(siterc.terraform.key)}
    region = ${JSON.stringify(siterc.aws.region)}
  }
}

provider "aws" {${profile ? `
  profile = ${JSON.stringify(profile)}` : ''}
  region = ${JSON.stringify(siterc.aws.region)}
}  
`;

  console.log(backend);

  if ((await prompt([{
    name: 'confirmed',
    type: 'confirm',
    message: 'Write to deploy/backend.tf?',
    default: false
  }])).confirmed) {
    fs.writeFileSync(`${__dirname}/deploy/backend.tf`, backend);
  }

  const deployState = get(siterc, 'app.deployState');
  const tfvars = JSON.stringify({
    root_domain: get(siterc, 'app.rootDomain'),
    ssl_cert_arn: get(siterc, 'app.certArn'),
    app_name: get(siterc, 'app.name'),
    app_stage: deployState,
    ...(deployState === 'prod' ? {
      app_subdomain: get(siterc, 'app.name')
    } : {})
  }, null, 2);

  console.log(tfvars);

  if ((await prompt([{
    name: 'confirmed',
    type: 'confirm',
    message: 'Write to deploy/terraform.tfvars.json?',
    default: false
  }])).confirmed) {
    fs.writeFileSync(`${__dirname}/deploy/terraform.tfvars.json`, tfvars);
  }
}

Object.assign(exports, {
  init,
  'init:ci': initCi,
  stage,
  'deployment-files.write': writeDeployFiles,
  'secrets.upload': uploadSecrets,
  'secrets.download': downloadSecrets
});
