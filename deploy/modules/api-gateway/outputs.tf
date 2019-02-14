output "api_invoke_url" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}"
}

output "rest_api_id" {
  value = "${aws_api_gateway_rest_api.api.id}"
}

output "root_resource_id" {
  value = "${aws_api_gateway_rest_api.api.root_resource_id}"
}

output "execution_arn" {
  value = "${aws_api_gateway_rest_api.api.execution_arn}"
}

output "api_gateway_stage_name" {
  value = "${aws_api_gateway_deployment.deployment.stage_name}"
}