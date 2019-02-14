variable "app_name" {}

variable "app_stage" {}
variable "app_description" {}

variable "api_gateway_stage" {}

variable "redeployment_hash" {}

locals {
  default_tags = {
    app_name = "${var.app_name}"
    app_stage = "${var.app_stage}"
  }
}

