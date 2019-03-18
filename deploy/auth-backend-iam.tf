
data "aws_iam_policy_document" "iam-doc-auth-dynamo-rw" {
  statement {
    actions = ["dynamodb:*"]
    resources = [
      "${aws_dynamodb_table.sessions.arn}",
      "${aws_dynamodb_table.users.arn}",
      "${aws_dynamodb_table.foreignProfiles.arn}",
    ]
  }
}

resource "aws_iam_policy" "iam-auth-dynamo-rw" {
  name        = "${var.app_name}-${var.app_stage}-auth-dynamo-rw"
  description = "Permit read from and write to auth-related tables"
  policy      = "${data.aws_iam_policy_document.iam-doc-auth-dynamo-rw.json}"
}

data "aws_iam_policy_document" "iam-doc-cognito-admin" {
  statement {
    actions = ["cognito-idp:*"]
    resources = [
      "${aws_cognito_user_pool.user_pool.arn}"
    ]
  }
}

resource "aws_iam_policy" "iam-cognito-admin" {
  name = "${var.app_name}-${var.app_stage}-cognito-admin"
  description = "Permit admin management of Cognito users"
  policy = "${data.aws_iam_policy_document.iam-doc-cognito-admin.json}"
}

resource "aws_iam_role" "role-auth-lambda-exec" {
  name = "${var.app_name}-${var.app_stage}-auth-lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "auth-lambda-cloudwatch" {
  role       = "${aws_iam_role.role-auth-lambda-exec.name}"
  policy_arn = "${aws_iam_policy.lambda_cloudwatch.arn}"
}


resource "aws_iam_role_policy_attachment" "auth-lambda-dynamo" {
  role       = "${aws_iam_role.role-auth-lambda-exec.name}"
  policy_arn = "${aws_iam_policy.iam-auth-dynamo-rw.arn}"
}

resource "aws_iam_role_policy_attachment" "auth-lambda-cognito" {
  role       = "${aws_iam_role.role-auth-lambda-exec.name}"
  policy_arn = "${aws_iam_policy.iam-cognito-admin.arn}"
}
