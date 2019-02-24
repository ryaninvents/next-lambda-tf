resource "aws_cognito_user_pool" "user_pool" {
  name                     = "${var.app_name}-${var.app_stage}-users"
  auto_verified_attributes = ["email"]
}
