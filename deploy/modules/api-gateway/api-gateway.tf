locals {
  api_gateway_redeployment_hash = "${var.redeployment_hash}"
}

resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.app_name}-${var.app_stage}"
  description = "${var.app_description}"
}

resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = "${aws_api_gateway_rest_api.api.id}"

  description = "Deployment for ${var.app_name} ${var.app_stage}"
  // Next line seems odd, but required to prevent "Stage already exists" error.
  // See https://github.com/terraform-providers/terraform-provider-aws/issues/2918
  stage_name  = ""

  variables = {
    source_hash  = "${replace(local.api_gateway_redeployment_hash, "+", ".")}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "api" {
  stage_name = "${var.api_gateway_stage}"
  rest_api_id = "${aws_api_gateway_rest_api.api.id}"
  deployment_id = "${aws_api_gateway_deployment.deployment.id}"

  lifecycle {
    create_before_destroy = false
  }

  tags = "${local.default_tags}"
}

# resource "aws_api_gateway_base_path_mapping" "api" {
#   api_id      = "${aws_api_gateway_rest_api.api.id}"
#   stage_name  = "${aws_api_gateway_deployment.deployment.stage_name}"
# }
