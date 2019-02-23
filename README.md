# next-lambda-tf

> Next.js app hosted on AWS Lambda and API Gateway.

## Setup

Your CircleCI job will need the following environment variables set:

- `APP_NAME`: Deployed name of your application.
- `TF_BUCKET`: Name of an AWS bucket you're using to host your Terraform state. I suggest using `tfstate.example.net`, replacing `example.net` with your domain name.

In addition, you will need a CircleCI Context called `aws-deploy` containing an `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. If you plan to use the same bucket for all your Terraform deployments, you can also move `TF_BUCKET` into the Context.

Run `npx gulp init` to set up a local secrets file, then run `npx gulp secrets.upload` to persist to S3. You will need to do this once for each environment you plan to set up; use `npx gulp stage` to switch between stages without altering the other values.

> **Heads up:** If you're switching between environments, Terraform will prompt you with "Do you want to copy existing state to the new backend?" It is important to choose `no` here, since otherwise you will end up with two copies of the same deployment.
> 
> In other words, if you set up as "dev" and then try to switch to "prod", but choose "yes" at the above prompt, when you attempt to deploy to production you'll only overwrite your dev environment instead.

If you get a "Stage Already Exists" error when deploying, you might have to go through the AWS Console and delete the stage. For this reason, it might be best to deploy each environment once manually before allowing CI to take over. There's probably a way to avoid this error, but unfortunately despite a fair bit of research I haven't found it.
