terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# Primary backup bucket (versioning + lifecycle)
resource "aws_s3_bucket" "backup" {
  bucket = var.primary_bucket_name

  versioning {
    enabled = true
  }

  lifecycle_rule {
    id      = "archive"
    enabled = true

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# Destination bucket for cross-region replication
resource "aws_s3_bucket" "replica" {
  bucket = var.replica_bucket_name

  versioning {
    enabled = true
  }
}

resource "aws_iam_role" "replication_role" {
  name = "s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "replication_policy" {
  name = "s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ],
        Resource = [aws_s3_bucket.backup.arn]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ],
        Resource = ["${aws_s3_bucket.backup.arn}/*"]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ],
        Resource = ["${aws_s3_bucket.replica.arn}/*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication_attach" {
  role       = aws_iam_role.replication_role.name
  policy_arn = aws_iam_policy.replication_policy.arn
}

resource "aws_s3_bucket_replication_configuration" "replication" {
  bucket = aws_s3_bucket.backup.id

  role = aws_iam_role.replication_role.arn

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.replica.arn
      storage_class = "STANDARD"
    }
  }
}

output "backup_bucket" {
  value = aws_s3_bucket.backup.bucket
}

output "replica_bucket" {
  value = aws_s3_bucket.replica.bucket
}
