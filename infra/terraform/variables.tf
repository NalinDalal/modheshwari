variable "region" {
  description = "AWS region for primary resources"
  type        = string
  default     = "us-east-1"
}

variable "primary_bucket_name" {
  description = "Name of primary backup S3 bucket"
  type        = string
}

variable "replica_bucket_name" {
  description = "Name of replica S3 bucket (cross-region)"
  type        = string
}
