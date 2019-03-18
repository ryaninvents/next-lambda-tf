locals {
  auth_gateway_deploy_hash_elements = [
    "${aws_lambda_function.auth_lambda.source_code_hash}",
    "${module.auth_integration.resource_id}",
  ]

  auth_redeployment_hash = "${base64sha256(join(",", local.auth_gateway_deploy_hash_elements))}"
}

module "auth_gateway" {
  source = "./modules/api-gateway"

  app_name = "${var.app_name}-auth"
  app_description = "Auth backend for ${var.app_name} (stage ${var.app_stage})"
  app_stage = "${var.app_stage}"
  api_gateway_stage = "auth"
  redeployment_hash = "${local.auth_redeployment_hash}"
}

resource "aws_lambda_function" "auth_lambda" {
  function_name = "${var.app_name}-${var.app_stage}-auth"

  filename = "${path.module}/../packages/auth.backend/pkg/dist-node.zip"
  source_code_hash = "${base64sha256(file("${path.module}/../packages/auth.backend/pkg/dist-node.zip"))}"

  handler = "index.handler"
  runtime = "nodejs8.10"

  role = "${aws_iam_role.role-auth-lambda-exec.arn}"
  publish = true

  timeout = 15

  layers = ["${aws_lambda_layer_version.auth_deps.layer_arn}"]

  environment {
    variables = {
      NODE_ENV = "production"
      LOG_LEVEL = "info"
      
      SESSIONS_SECRET_KEY = "${var.sessions_secret_key}"
      SESSIONS_TABLE = "${aws_dynamodb_table.sessions.name}"
      SESSIONS_AWS_REGION = "${data.aws_region.current.name}"

      FOREIGN_PROFILES_TABLE = "${aws_dynamodb_table.foreignProfiles.name}"
      USERS_TABLE = "${aws_dynamodb_table.users.name}"
      USER_POOL_ID = "${aws_cognito_user_pool.user_pool.id}"

      GOOGLE_CLIENT_ID = "${var.google_client_id}"
      GOOGLE_CLIENT_SECRET = "${var.google_client_secret}"

      # It would be nice to directly reference `aws_route53_record.*` here, but
      # that would lead to a circular dependency.
      FRONTEND_HOST = "${local.frontend_domain}"
      API_HOST = "${local.api_domain}"
      AUTH_HOST = "${local.auth_domain}"
    }
  }

  tags = "${local.default_tags}"
}

resource "aws_lambda_layer_version" "auth_deps" {
  layer_name = "${var.app_name}-${var.app_stage}-auth-deps"
  filename = "${path.module}/../packages/auth.backend/pkg/dist-dependencies.zip"
  source_code_hash = "${base64sha256(file("${path.module}/../packages/auth.backend/pkg/dist-dependencies.zip"))}"
  compatible_runtimes = ["nodejs8.10"]
}

resource "aws_lambda_permission" "apigw_auth" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.auth_lambda.arn}"
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${module.auth_gateway.execution_arn}/*/*/*"
}

module "auth_integration" {
  source = "./modules/api-endpoint"

  lambda_invoke_arn = "${aws_lambda_function.auth_lambda.invoke_arn}"
  rest_api_id = "${module.auth_gateway.rest_api_id}"
  rest_api_root_resource_id = "${module.auth_gateway.root_resource_id}"
  http_method = "ANY"
  resource_path_part = "{proxy+}"
}
