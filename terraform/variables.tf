variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "modheshwari"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "modheshwari"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}

variable "backend_cpu" {
  description = "CPU units for backend ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Memory for backend ECS task in MB"
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "CPU units for frontend ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory for frontend ECS task in MB"
  type        = number
  default     = 512
}

variable "websocket_cpu" {
  description = "CPU units for WebSocket ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "websocket_memory" {
  description = "Memory for WebSocket ECS task in MB"
  type        = number
  default     = 512
}
