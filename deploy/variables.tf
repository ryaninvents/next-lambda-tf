variable "app_name" {
  default = "next-lambda-tf"
}
variable "app_stage" {
  default = "default"
}
variable "app_description" {
  default = "Next.js Website"
}

variable "api_gateway_stage" {
  default = "app"
}

variable "root_domain" {}

variable "app_subdomain" {
  default = ""
}

variable "ssl_cert_arn" {}

variable "google_client_id" {}
variable "google_client_secret" {}

variable "sessions_secret_key" {}

locals {
  default_tags = {
    app_name = "${var.app_name}"
    app_stage = "${var.app_stage}"
  }

  app_subdomain = "${var.app_subdomain == "" ? "${var.app_name}-${var.app_stage}" : var.app_subdomain}"
}

