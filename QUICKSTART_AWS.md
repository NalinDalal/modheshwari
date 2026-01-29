# Quick Setup Guide for AWS Deployment

This is a quick reference guide for deploying Modheshwari to AWS. For detailed instructions, see [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md).

## Prerequisites Checklist

- [ ] AWS account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform >= 1.0 installed
- [ ] Docker installed
- [ ] Domain name (optional, for custom domain)
- [ ] SSL certificate in ACM (optional, for HTTPS)

## Quick Start (5 Steps)

### 1. Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `db_password` - Generate a strong password
- `jwt_secret` - Generate with: `openssl rand -hex 32`
- `domain_name` and `certificate_arn` (optional)

### 2. Deploy Infrastructure

```bash
./scripts/deploy-aws.sh
```

This creates:
- VPC with public/private subnets
- RDS PostgreSQL database
- ECR repositories
- ECS cluster
- Application Load Balancer
- Security groups and IAM roles

**Time**: ~10-15 minutes

### 3. Build and Push Images

```bash
./scripts/build-and-push.sh
```

This:
- Builds Docker images for backend, frontend, and websocket
- Pushes to ECR
- Updates ECS services

**Time**: ~5-10 minutes

### 4. Run Database Migrations

```bash
# Get database URL from Terraform
cd terraform
export DATABASE_URL=$(terraform output -raw database_url)

# Run migrations
cd ..
./scripts/migrate-db.sh
```

### 5. Access Your Application

```bash
# Get ALB DNS name
cd terraform
terraform output alb_dns_name
```

Visit: `http://[alb-dns-name]`

## Local Testing with Docker

Test the full stack locally before deploying:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- WebSocket: ws://localhost:3002

## CI/CD Setup

To enable automatic deployments on push to main:

1. Add AWS credentials to GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

2. Push to main branch - GitHub Actions will automatically:
   - Build and test
   - Push images to ECR
   - Deploy to ECS

## Monitoring

View logs:
```bash
# All services
aws logs tail /ecs/modheshwari --follow

# Specific service
aws logs tail /ecs/modheshwari --follow --filter-pattern backend
```

## Common Commands

```bash
# Update application after code changes
./scripts/build-and-push.sh

# Check ECS service status
aws ecs describe-services --cluster modheshwari-cluster \
  --services modheshwari-backend-service

# Force new deployment
aws ecs update-service --cluster modheshwari-cluster \
  --service modheshwari-backend-service --force-new-deployment

# Scale services
aws ecs update-service --cluster modheshwari-cluster \
  --service modheshwari-backend-service --desired-count 2
```

## Troubleshooting

**Services not starting:**
```bash
# Check CloudWatch logs
aws logs tail /ecs/modheshwari --follow

# Check ECS tasks
aws ecs list-tasks --cluster modheshwari-cluster
aws ecs describe-tasks --cluster modheshwari-cluster --tasks [task-id]
```

**Database connection issues:**
- Verify DATABASE_URL in task definition
- Check security groups allow ECS -> RDS
- Ensure tasks are in private subnets with NAT

**CORS errors:**
- Set CORS_ORIGIN in backend task definition
- Set NEXT_PUBLIC_API_URL in frontend task definition

## Cost Estimate

Minimal configuration (~$50-70/month):
- RDS db.t4g.micro: ~$15
- ECS Fargate (3 tasks @ 0.25 vCPU): ~$10
- NAT Gateway (2 AZs): ~$32
- ALB: ~$16
- Data transfer: varies

## Cleanup

To destroy all resources and stop charges:

```bash
cd terraform
terraform destroy
```

**WARNING**: This deletes everything including the database!

## Next Steps

After deployment:
- [ ] Set up monitoring and alarms
- [ ] Configure auto-scaling
- [ ] Enable Multi-AZ for RDS
- [ ] Set up backups
- [ ] Configure CloudFront CDN
- [ ] Implement blue-green deployments
- [ ] Set up staging environment

## Support

- Main docs: [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md)
- Terraform docs: [terraform/README.md](terraform/README.md)
- Original deployment guide: [deploy.md](deploy.md)
