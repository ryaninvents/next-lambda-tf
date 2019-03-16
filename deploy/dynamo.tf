resource "aws_dynamodb_table" "sessions" {
  name = "${var.app_name}-${var.app_stage}-sessions"

  read_capacity  = 20
  write_capacity = 20

  hash_key = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  tags = "${local.default_tags}"
}

resource "aws_dynamodb_table" "users" {
  name = "${var.app_name}-${var.app_stage}-users"

  read_capacity  = 5
  write_capacity = 5

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }
  
  tags = "${local.default_tags}"
}

resource "aws_dynamodb_table" "foreignProfiles" {
  name = "${var.app_name}-${var.app_stage}-foreignProfiles"

  read_capacity  = 20
  write_capacity = 20

  hash_key = "foreignProfileKey"

  attribute {
    name = "foreignProfileKey"
    type = "S"
  }
  
  tags = "${local.default_tags}"
}
