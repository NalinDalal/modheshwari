# ──────────────────────────────────────────────────────────────────────────────
# Backup Monitoring — SNS Topic, CloudWatch Alarm, Slack Lambda
# ──────────────────────────────────────────────────────────────────────────────

# ── Variables ─────────────────────────────────────────────────────────────────
variable "alert_email" {
  description = "Email address for backup failure notifications"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack Incoming Webhook URL for backup alerts (stored in Lambda env)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "backup_alarm_period" {
  description = "CloudWatch evaluation period in seconds (default 86400 = 24h)"
  type        = number
  default     = 86400
}

variable "backup_alarm_missing_threshold" {
  description = "Number of consecutive periods without a successful backup before alarming"
  type        = number
  default     = 1
}

# ── SNS Topic ─────────────────────────────────────────────────────────────────
resource "aws_sns_topic" "backup_alerts" {
  name = "modheshwari-backup-alerts"
}

# Email subscription (created only when alert_email is provided)
resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.backup_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ── CloudWatch Alarm — fires when no success metric in the evaluation period ──
resource "aws_cloudwatch_metric_alarm" "backup_failure" {
  alarm_name          = "modheshwari-backup-failure"
  alarm_description   = "No successful backup recorded in the last evaluation period"
  namespace           = "Modheshwari/Backups"
  metric_name         = "BackupSuccess"
  statistic           = "Sum"
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  period              = var.backup_alarm_period
  evaluation_periods  = var.backup_alarm_missing_threshold
  treat_missing_data  = "breaching"                     # missing data = no backup ran
  actions_enabled     = true

  dimensions = {
    BackupType = "postgres"
  }

  alarm_actions = [aws_sns_topic.backup_alerts.arn]
  ok_actions    = [aws_sns_topic.backup_alerts.arn]
}

# ── Lambda: Forward SNS → Slack ──────────────────────────────────────────────
# Only created when a Slack webhook URL is provided.

data "archive_file" "slack_lambda" {
  count       = var.slack_webhook_url != "" ? 1 : 0
  type        = "zip"
  output_path = "${path.module}/lambda/slack-notifier.zip"

  source {
    content  = <<-PYTHON
import json, os, urllib.request

SLACK_WEBHOOK = os.environ["SLACK_WEBHOOK_URL"]

def handler(event, context):
    for record in event.get("Records", []):
        sns_msg = record["Sns"]
        subject = sns_msg.get("Subject", "Backup Alert")
        message = sns_msg.get("Message", "")

        # Determine colour
        color = "#36a64f" if "succeeded" in subject.lower() or "ok" in subject.lower() else "#d00000"

        payload = json.dumps({
            "attachments": [{
                "color": color,
                "title": subject,
                "text": message,
                "footer": "Modheshwari Backup Monitor"
            }]
        }).encode("utf-8")

        req = urllib.request.Request(
            SLACK_WEBHOOK,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req)

    return {"statusCode": 200}
PYTHON
    filename = "index.py"
  }
}

resource "aws_iam_role" "slack_lambda_role" {
  count = var.slack_webhook_url != "" ? 1 : 0
  name  = "modheshwari-slack-notifier-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "slack_lambda_basic" {
  count      = var.slack_webhook_url != "" ? 1 : 0
  role       = aws_iam_role.slack_lambda_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "slack_notifier" {
  count         = var.slack_webhook_url != "" ? 1 : 0
  function_name = "modheshwari-backup-slack-notifier"
  role          = aws_iam_role.slack_lambda_role[0].arn
  handler       = "index.handler"
  runtime       = "python3.12"
  timeout       = 10
  filename      = data.archive_file.slack_lambda[0].output_path

  environment {
    variables = {
      SLACK_WEBHOOK_URL = var.slack_webhook_url
    }
  }
}

resource "aws_sns_topic_subscription" "slack_lambda" {
  count     = var.slack_webhook_url != "" ? 1 : 0
  topic_arn = aws_sns_topic.backup_alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.slack_notifier[0].arn
}

resource "aws_lambda_permission" "sns_invoke" {
  count         = var.slack_webhook_url != "" ? 1 : 0
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slack_notifier[0].function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.backup_alerts.arn
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "backup_sns_topic_arn" {
  description = "SNS topic ARN — set as BACKUP_SNS_TOPIC_ARN in backup environment"
  value       = aws_sns_topic.backup_alerts.arn
}
