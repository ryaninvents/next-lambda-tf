resource "aws_iam_role" "lambda_exec" {
  name = "${var.app_name}-${var.app_stage}-lambda"

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

data "aws_iam_policy_document" "cloudwatch-log-group-lambda" {
  statement {
    actions = [
      "logs:PutLogEvents",    # take care of action order
      "logs:CreateLogStream",
      "logs:CreateLogGroup",
    ]

    resources = [
      "arn:aws:logs:*:*:*",
    ]
  }
}

resource "aws_iam_policy" "lambda_cloudwatch" {
  name        = "${var.app_name}-${var.app_stage}-lambda-cloudwatch"
  description = "Give Lambdas access to Cloudwatch"
  policy      = "${data.aws_iam_policy_document.cloudwatch-log-group-lambda.json}"
}

resource "aws_iam_role_policy_attachment" "lambda_cloudwatch" {
  role       = "${aws_iam_role.lambda_exec.name}"
  policy_arn = "${aws_iam_policy.lambda_cloudwatch.arn}"
}
