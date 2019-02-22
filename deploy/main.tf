locals {
  api_deploy_hash_elements = [
    "${aws_lambda_function.nextjs_lambda.source_code_hash}",
    "${module.nextjs_proxy_integration.resource_id}",
    "${module.nextjs_root_integration.resource_id}",
  ]

  redeployment_hash = "${base64sha256(join(",", local.api_deploy_hash_elements))}"
}

module "api_gateway" {
  source = "./modules/api-gateway"

  app_name = "${var.app_name}"
  app_description = "${var.app_description}"
  app_stage = "${var.app_stage}"
  api_gateway_stage = "${var.api_gateway_stage}"
  redeployment_hash = "${local.redeployment_hash}"
}

resource "aws_lambda_function" "nextjs_lambda" {
  function_name = "${var.app_name}-${var.app_stage}-nextjs"

  filename = "${path.module}/../packages/site/pkg/dist-next.zip"
  source_code_hash = "${base64sha256(file("${path.module}/../packages/site/pkg/dist-next.zip"))}"

  handler = "index.handler"
  runtime = "nodejs8.10"

  role = "${aws_iam_role.lambda_exec.arn}"
  publish = true

  timeout = 15

  layers = ["${aws_lambda_layer_version.nextjs_deps.layer_arn}"]

  environment {
    variables = {
      AUTH_METHOD = "local"
      NODE_ENV = "production"
    }
  }

  tags = "${local.default_tags}"
}

resource "aws_lambda_layer_version" "nextjs_deps" {
  layer_name = "${var.app_name}-${var.app_stage}-nextjs-deps"
  filename = "${path.module}/../packages/site/pkg/dist-dependencies.zip"
  source_code_hash = "${base64sha256(file("${path.module}/../packages/site/pkg/dist-dependencies.zip"))}"
  compatible_runtimes = ["nodejs8.10"]
}

module "nextjs_proxy_integration" {
  source = "./modules/api-endpoint"

  lambda_invoke_arn = "${aws_lambda_function.nextjs_lambda.invoke_arn}"
  rest_api_id = "${module.api_gateway.rest_api_id}"
  rest_api_root_resource_id = "${module.api_gateway.root_resource_id}"
  http_method = "ANY"
  resource_path_part = "{proxy+}"
}

module "nextjs_root_integration" {
  source = "./modules/api-endpoint"

  lambda_invoke_arn = "${aws_lambda_function.nextjs_lambda.invoke_arn}"
  rest_api_id = "${module.api_gateway.rest_api_id}"
  rest_api_root_resource_id = "${module.api_gateway.root_resource_id}"
  http_method = "ANY"
  create_resource = false
  resource_path_part = ""
}

resource "aws_lambda_permission" "apigw_nextjs" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.nextjs_lambda.arn}"
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${module.api_gateway.execution_arn}/*/*/*"
}
