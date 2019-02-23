# next-lambda-tf

> Next.js app hosted on AWS Lambda and API Gateway.

## Setup

Your CircleCI job will need the following environment variables set:

- `APP_NAME`: Deployed name of your application.
- `TF_BUCKET`: Name of an AWS bucket you're using to host your Terraform state. I suggest using `tfstate.example.net`, replacing `example.net` with your domain name.

In addition, you will need a CircleCI Context called `aws-deploy` containing an `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. If you plan to use the same bucket for all your Terraform deployments, you can also move `TF_BUCKET` into the Context.

Run `npx gulp init` to set up a local secrets file and push it to S3.


