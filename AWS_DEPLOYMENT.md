# AWS Deployment Guide

This guide will help you deploy the Modheshwari application to AWS using the provided Terraform infrastructure and Docker containers.

## Architecture Overview

The deployment consists of:

- **Frontend**: Next.js app running on ECS Fargate (port 3000)
- **Backend**: Bun-based API running on ECS Fargate (port 3001)
- **WebSocket**: Bun-based WebSocket service on ECS Fargate (port 3002)
- **Database**: Amazon RDS PostgreSQL
- **Load Balancer**: Application Load Balancer with path-based routing
- **Container Registry**: Amazon ECR for Docker images
- **Networking**: VPC with public and private subnets across multiple AZs

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **Terraform** >= 1.0 installed
4. **Docker** installed for building images
5. **Domain name** (optional, for custom domain and HTTPS)

## Step 1: Configure Terraform Variables

1. Navigate to the terraform directory:
   ```bash
   cd terraform
   ```

2. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Edit `terraform.tfvars` and set your values:
   ```hcl
   aws_region = "us-east-1"
   environment = "production"
   
   # Generate strong passwords
   db_password = "your-secure-db-password"
   jwt_secret = "your-jwt-secret"  # Generate with: openssl rand -hex 32
   
   # Optional: Domain and SSL
   domain_name = "app.yourdomain.com"
   certificate_arn = "arn:aws:acm:region:account:certificate/xxx"
   ```

## Step 2: Deploy Infrastructure

Run the deployment script:

```bash
./scripts/deploy-aws.sh
```

This will:
- Initialize Terraform
- Create a deployment plan
- Ask for confirmation
- Deploy all AWS resources (VPC, RDS, ECR, ECS, ALB, etc.)

**Note**: The initial deployment takes 10-15 minutes.

## Step 3: Build and Push Docker Images

After the infrastructure is deployed:

```bash
./scripts/build-and-push.sh
```

This script will:
- Build Docker images for backend, frontend, and websocket services
- Push images to ECR
- Trigger ECS service updates to use the new images

## Step 4: Run Database Migrations

Connect to the RDS instance and run migrations:

1. Get the database endpoint:
   ```bash
   cd terraform
   terraform output database_url
   ```

2. Set the DATABASE_URL environment variable:
   ```bash
   export DATABASE_URL="postgresql://username:password@endpoint/dbname"
   ```

3. Run Prisma migrations:
   ```bash
   cd ..
   npx prisma migrate deploy --schema=packages/db/schema.prisma
   ```

## Step 5: Access Your Application

1. Get the ALB DNS name:
   ```bash
   cd terraform
   terraform output alb_dns_name
   ```

2. Access your application:
   - Frontend: `http://[alb-dns-name]`
   - Backend API: `http://[alb-dns-name]/api`
   - WebSocket: `ws://[alb-dns-name]/ws`

## Step 6: Configure Custom Domain (Optional)

If you provided a domain name and SSL certificate:

1. In Route 53, create an A record pointing to your ALB
2. Wait for DNS propagation
3. Access your app at `https://yourdomain.com`

## Monitoring and Logs

View logs in CloudWatch:
```bash
aws logs tail /ecs/modheshwari --follow
```

Or use the AWS Console:
- Go to CloudWatch > Log Groups > `/ecs/modheshwari`

## Updating the Application

To deploy code changes:

1. Make your changes locally
2. Run the build and push script:
   ```bash
   ./scripts/build-and-push.sh
   ```

The script automatically triggers ECS to deploy the new images.

## Scaling

To increase capacity:

1. Edit `terraform/terraform.tfvars`:
   ```hcl
   backend_cpu = 512      # Increase CPU
   backend_memory = 1024  # Increase memory
   ```

2. Apply changes:
   ```bash
   cd terraform
   terraform apply
   ```

## Cost Optimization

**Development/Testing:**
- Use `db.t4g.micro` for RDS
- Set desired_count to 1 for each ECS service
- Use single AZ for RDS (set `multi_az = false`)

**Production:**
- Upgrade to `db.t4g.small` or larger for RDS
- Enable Multi-AZ for RDS (`multi_az = true`)
- Increase ECS task count and enable auto-scaling
- Add CloudFront for CDN

## Troubleshooting

**ECS tasks not starting:**
- Check CloudWatch logs for errors
- Verify environment variables in task definitions
- Ensure security groups allow traffic

**Database connection errors:**
- Verify DATABASE_URL is correct
- Check security group allows ECS tasks to connect to RDS
- Ensure tasks are in private subnets with NAT gateway access

**CORS errors:**
- Verify CORS_ORIGIN matches your frontend URL
- Check NEXT_PUBLIC_API_URL is set correctly

**Health check failures:**
- Ensure health check endpoints exist (`/health` for backend/ws)
- Adjust health check settings in `terraform/alb.tf` if needed

## Cleanup

To destroy all AWS resources:

```bash
cd terraform
terraform destroy
```

**Warning**: This will delete all data including the database!

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) can be extended to automatically deploy on push to main:

1. Add AWS credentials as GitHub secrets
2. Update the workflow to run `./scripts/build-and-push.sh`

## Security Best Practices

1. **Secrets Management**: Consider using AWS Secrets Manager instead of environment variables
2. **Network Security**: Review security group rules
3. **SSL/TLS**: Always use HTTPS in production (provide certificate_arn)
4. **Database**: Enable automated backups and set appropriate retention
5. **IAM**: Use minimal required permissions for ECS task roles
6. **Monitoring**: Set up CloudWatch alarms for critical metrics

## Support

For issues:
1. Check CloudWatch logs
2. Review Terraform outputs
3. Verify AWS service limits
4. Check the deploy.md file for additional guidance
