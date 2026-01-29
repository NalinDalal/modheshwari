# Terraform AWS Infrastructure

This directory contains Terraform configuration files for deploying the Modheshwari application to AWS.

## Files

- `main.tf` - Main Terraform configuration and provider setup
- `variables.tf` - Input variables for the infrastructure
- `outputs.tf` - Output values after deployment
- `vpc.tf` - VPC, subnets, NAT gateways, and routing
- `security_groups.tf` - Security groups for ALB, ECS, and RDS
- `rds.tf` - RDS PostgreSQL database configuration
- `ecr.tf` - Elastic Container Registry repositories
- `alb.tf` - Application Load Balancer and target groups
- `ecs.tf` - ECS cluster, task definitions, and services
- `terraform.tfvars.example` - Example variables file

## Quick Start

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Plan the deployment:
   ```bash
   terraform plan
   ```

5. Apply the configuration:
   ```bash
   terraform apply
   ```

## Required Variables

You must set these variables in `terraform.tfvars`:

- `db_password` - Strong password for PostgreSQL
- `jwt_secret` - Secret for JWT token signing

## Optional Variables

- `domain_name` - Your custom domain
- `certificate_arn` - ACM certificate ARN for HTTPS
- `aws_region` - AWS region (default: us-east-1)
- `environment` - Environment name (default: production)

## Outputs

After deployment, Terraform will output:

- `alb_dns_name` - Load balancer DNS name
- `database_url` - Database connection string
- `ecr_*_repository_url` - ECR repository URLs

## State Management

For production use, configure remote state in `main.tf`:

```hcl
backend "s3" {
  bucket = "your-terraform-state-bucket"
  key    = "terraform.tfstate"
  region = "us-east-1"
}
```

## Cost Considerations

The default configuration uses minimal resources:

- db.t4g.micro for RDS (~$15/month)
- 0.25 vCPU, 512MB memory for ECS tasks
- NAT Gateways (~$32/month each)

For production, consider:
- Upgrading RDS instance class
- Enabling Multi-AZ for RDS
- Increasing ECS task resources
- Adding auto-scaling

## Security

The infrastructure follows AWS best practices:

- Private subnets for ECS tasks and RDS
- Security groups with minimal required access
- Encrypted RDS storage
- VPC isolation
- IAM roles with minimal permissions

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all data!
