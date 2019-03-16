locals {
  api_gateway_deploy_hash_elements = [
    "${aws_lambda_function.api_lambda.source_code_hash}",
    "${module.api_integration.resource_id}",
    "${module.playground_integration.resource_id}",
  ]

  api_redeployment_hash = "${base64sha256(join(",", local.api_gateway_deploy_hash_elements))}"
}

module "api_gateway" {
  source = "./modules/api-gateway"

  app_name = "${var.app_name}-api"
  app_description = "${var.app_description}"
  app_stage = "${var.app_stage}"
  api_gateway_stage = "api"
  redeployment_hash = "${local.api_redeployment_hash}"
}

resource "aws_lambda_function" "api_lambda" {
  function_name = "${var.app_name}-${var.app_stage}-api"

  filename = "${path.module}/../packages/api/pkg/dist-node.zip"
  source_code_hash = "${base64sha256(file("${path.module}/../packages/api/pkg/dist-node.zip"))}"

  handler = "index.api"
  runtime = "nodejs8.10"

  role = "${aws_iam_role.lambda_exec.arn}"
  publish = true

  timeout = 15

  layers = ["${aws_lambda_layer_version.api_deps.layer_arn}"]

  environment {
    variables = {
      AUTH_METHOD = "local"
      NODE_ENV = "production"
    }
  }

  tags = "${local.default_tags}"
}

resource "aws_lambda_function" "playground_lambda" {
  function_name = "${var.app_name}-${var.app_stage}-api-playground"

  filename = "${path.module}/../packages/api/pkg/dist-node.zip"
  source_code_hash = "${base64sha256(file("${path.module}/../packages/api/pkg/dist-node.zip"))}"

  handler = "index.playground"
  runtime = "nodejs8.10"

  role = "${aws_iam_role.lambda_exec.arn}"
  publish = true

  timeout = 15

  layers = ["${aws_lambda_layer_version.api_deps.layer_arn}"]

  environment {
    variables = {
      AUTH_METHOD = "local"
      NODE_ENV = "production"
    }
  }

  tags = "${local.default_tags}"
}

resource "aws_lambda_layer_version" "api_deps" {
  layer_name = "${var.app_name}-${var.app_stage}-api-deps"
  filename = "${path.module}/../packages/api/pkg/dist-dependencies.zip"
  source_code_hash = "${base64sha256(file("${path.module}/../packages/api/pkg/dist-dependencies.zip"))}"
  compatible_runtimes = ["nodejs8.10"]
}

resource "aws_lambda_permission" "apigw_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.api_lambda.arn}"
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${module.api_gateway.execution_arn}/*/*/*"
}

resource "aws_lambda_permission" "apigw_playground" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.playground_lambda.arn}"
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${module.api_gateway.execution_arn}/*/*/*"
}

module "api_integration" {
  source = "./modules/api-endpoint"

  lambda_invoke_arn = "${aws_lambda_function.api_lambda.invoke_arn}"
  rest_api_id = "${module.api_gateway.rest_api_id}"
  rest_api_root_resource_id = "${module.api_gateway.root_resource_id}"
  http_method = "POST"
  resource_path_part = "graphql"
}

module "playground_integration" {
  source = "./modules/api-endpoint"

  lambda_invoke_arn = "${aws_lambda_function.playground_lambda.invoke_arn}"
  rest_api_id = "${module.api_gateway.rest_api_id}"
  rest_api_root_resource_id = "${module.api_gateway.root_resource_id}"
  http_method = "GET"
  resource_path_part = "graphql"
  create_resource = false
}
