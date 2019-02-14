data "aws_route53_zone" "root" {
  name = "${var.root_domain}."
}

resource "aws_api_gateway_domain_name" "app" {
  domain_name = "${local.app_subdomain}.${var.root_domain}"

  certificate_arn = "${var.ssl_cert_arn}"
}


resource "aws_route53_record" "app" {
  zone_id = "${data.aws_route53_zone.root.zone_id}"

  name = "${aws_api_gateway_domain_name.app.domain_name}"
  type = "A"

  alias {
    name                   = "${aws_api_gateway_domain_name.app.cloudfront_domain_name}"
    zone_id                = "${aws_api_gateway_domain_name.app.cloudfront_zone_id}"
    evaluate_target_health = false
  }
}

resource "aws_api_gateway_base_path_mapping" "api" {
  api_id      = "${module.api_gateway.rest_api_id}"
  stage_name  = "${module.api_gateway.api_gateway_stage_name}"
  domain_name = "${aws_api_gateway_domain_name.app.domain_name}"
}

output "app_endpoint" {
  value = "https://${aws_api_gateway_domain_name.app.domain_name}"
}
