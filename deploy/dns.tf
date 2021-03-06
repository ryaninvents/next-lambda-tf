data "aws_route53_zone" "root" {
  name = "${var.root_domain}."
}

locals {
  frontend_domain = "${local.app_subdomain}.${var.root_domain}"
  api_domain = "api-${local.app_subdomain}.${var.root_domain}"
  auth_domain = "auth-${local.app_subdomain}.${var.root_domain}"
}

resource "aws_api_gateway_domain_name" "app" {
  domain_name = "${local.frontend_domain}"

  certificate_arn = "${var.ssl_cert_arn}"
}

resource "aws_api_gateway_domain_name" "api" {
  domain_name = "${local.api_domain}"

  certificate_arn = "${var.ssl_cert_arn}"
}

resource "aws_api_gateway_domain_name" "auth" {
  domain_name = "${local.auth_domain}"

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

resource "aws_route53_record" "api" {
  zone_id = "${data.aws_route53_zone.root.zone_id}"

  name = "${aws_api_gateway_domain_name.api.domain_name}"
  type = "A"

  alias {
    name                   = "${aws_api_gateway_domain_name.api.cloudfront_domain_name}"
    zone_id                = "${aws_api_gateway_domain_name.api.cloudfront_zone_id}"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "auth" {
  zone_id = "${data.aws_route53_zone.root.zone_id}"

  name = "${aws_api_gateway_domain_name.auth.domain_name}"
  type = "A"

  alias {
    name                   = "${aws_api_gateway_domain_name.auth.cloudfront_domain_name}"
    zone_id                = "${aws_api_gateway_domain_name.auth.cloudfront_zone_id}"
    evaluate_target_health = false
  }
}

resource "aws_api_gateway_base_path_mapping" "site" {
  api_id      = "${module.site_gateway.rest_api_id}"
  stage_name  = "${module.site_gateway.api_gateway_stage_name}"
  domain_name = "${aws_api_gateway_domain_name.app.domain_name}"
}


resource "aws_api_gateway_base_path_mapping" "api" {
  api_id      = "${module.api_gateway.rest_api_id}"
  stage_name  = "${module.api_gateway.api_gateway_stage_name}"
  domain_name = "${aws_api_gateway_domain_name.api.domain_name}"
}


resource "aws_api_gateway_base_path_mapping" "auth" {
  api_id      = "${module.auth_gateway.rest_api_id}"
  stage_name  = "${module.auth_gateway.api_gateway_stage_name}"
  domain_name = "${aws_api_gateway_domain_name.auth.domain_name}"
}


output "app_endpoint" {
  value = "https://${aws_api_gateway_domain_name.app.domain_name}"
}

output "graphql_playground" {
  value = "https://${aws_api_gateway_domain_name.api.domain_name}/graphql"
}

output "auth_endpoint" {
  value = "https://${aws_api_gateway_domain_name.auth.domain_name}"
}
