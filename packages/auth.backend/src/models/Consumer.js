import eyed from 'eyed';
import Dynamo from 'aws-sdk/clients/dynamodb';
import Cognito from 'aws-sdk/clients/cognitoidentityserviceprovider';
import get from 'lodash/get';
import logger from '@~/log';

import Config from '../config';

const userDb = new Dynamo.DocumentClient({
  params: {
    TableName: Config.tables.users
  }
});
const foreignProfileDb = new Dynamo.DocumentClient({
  params: {
    TableName: Config.tables.foreignProfiles
  }
});

const userPool = new Cognito({
  params: {
    UserPoolId: Config.cognito.userPoolId
  }
});

export default class Consumer {
  static generateId () {
    return eyed.uuid();
  }

  static async getById (id) {
    const { Item: data } = await userDb.get({
      Key: { id }
    }).promise();
    return data;
  }

  static async ensureFromForeignProfile (providerName, profile) {
    const maybeExistingUser = await this.getFromForeignId(providerName, profile.id);
    if (maybeExistingUser) {
      return maybeExistingUser;
    }
    const user = await this.createFromForeignProfile(providerName, profile);
    return user;
  }

  static async createFromForeignProfile (providerName, profile) {
    const user = {
      id: this.generateId(),
      displayName: profile.displayName,
      foreignProfiles: [{
        provider: providerName,
        id: profile.id
      }]
    };
    await userDb.put({
      Item: user
    }).promise();
    await foreignProfileDb.put({
      Item: {
        foreignProfileKey: `${providerName}:${profile.id}`,
        userId: user.id
      }
    }).promise();

    const attributes = [];
    const addAttribute = (key, value) => {
      if (!value) return;
      attributes.push({
        Name: key,
        Value: value
      });
    };

    addAttribute('name', profile.displayName);
    addAttribute('email', get(profile, 'emails.0.value'));
    addAttribute('given_name', get(profile, 'name.givenName'));
    addAttribute('family_name', get(profile, 'name.familyName'));
    addAttribute('middle_name', get(profile, 'name.middle_name'));
    addAttribute('picture', get(profile, 'photos.0.value'));
    addAttribute('locale', get(profile, '_json.locale'));
    logger.info({
      event: 'Consumer.createFromForeignProfile',
      providerName,
      profile,
      attributes,
      user
    });

    await userPool.adminCreateUser({
      Username: user.id,
      UserAttributes: attributes,
      MessageAction: 'SUPPRESS'
    }).promise();
    return user;
  }

  static async getFromForeignId (providerName, id) {
    const { Item: data } = await foreignProfileDb.get({
      Key: { foreignProfileKey: `${providerName}:${id}` }
    }).promise();
    if (!data) return null;
    const userData = await this.getById(data.userId);
    return userData;
  }
}
