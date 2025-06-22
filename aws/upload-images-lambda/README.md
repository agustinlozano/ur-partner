# Upload Images Lambda

Lambda function for uploading images to S3 with rate limiting using ElastiCache Serverless (Valkey).

## Prerequisites

- AWS CLI installed and configured
- ElastiCache Serverless (Valkey) cluster created
- S3 bucket created
- DynamoDB table created

## Required Environment Variables

Create a `.env` file in this directory with:

```bash
# AWS Configuration
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=your-bucket-name

# ElastiCache Serverless (Valkey)
REDIS_HOST=your-cache.xxxxx.serverless.cache.amazonaws.com

# DynamoDB
DYNAMODB_ROOMS_TABLE=Rooms

# VPC Configuration
SECURITY_GROUP_ID=sg-xxxxxxxx
SUBNET_ID_1=subnet-aaaaaaa
SUBNET_ID_2=subnet-bbbbbbb
```

## Setup Guide

### 1. Install AWS CLI

```bash
# macOS with Homebrew
brew install awscli

# Configure credentials
aws configure
```

### 2. Find ElastiCache Configuration

#### Get REDIS_HOST:

- Navigate to: `elasticache/valkey-cache/your-cache-name/configuration`
- Copy the **Endpoint** value (without port :6379)

#### Get Subnet IDs:

- Navigate to: `elasticache/valkey-cache/your-cache-name/modify/connectivity`
- Copy the **Subnet IDs** from the subnet group
- Choose 2 subnets in different Availability Zones

### 3. Create Security Group

Since Lambda needs to access ElastiCache in VPC:

1. Navigate to: `ec2/security-groups`
2. **Create security group**:
   - **Name**: `lambda-elasticache-access`
   - **Description**: `Allow Lambda to access ElastiCache`
   - **VPC**: Select the same VPC as your ElastiCache
3. **Outbound rules** → **Add rule**:
   - **Type**: `All traffic` or `Custom TCP`
   - **Port**: `6379` (if Custom TCP)
   - **Destination**: `0.0.0.0/0`

### 4. Verify VPC Configuration

```bash
# Verify subnets exist and get VPC info
aws ec2 describe-subnets \
  --region us-east-2 \
  --subnet-ids subnet-xxx subnet-yyy subnet-zzz \
  --query 'Subnets[*].[SubnetId,VpcId,AvailabilityZone]' \
  --output table
```

### 5. Configure IAM Permissions

Your IAM user needs these permissions for CLI operations:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticache:DescribeServerlessCaches",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    }
  ]
}
```

## Architecture

```
Internet → API Gateway → Lambda (in VPC) → ElastiCache Serverless (Valkey)
                      ↓
                    S3 Bucket
                      ↓
                   DynamoDB
```

### Why VPC is Required

- **ElastiCache Serverless** runs in a private VPC by default
- **Lambda without VPC** cannot access ElastiCache
- **Lambda with VPC** can access ElastiCache through security groups and subnets

## Deployment

```bash
# Install dependencies
pnpm install

# Deploy to AWS
pnpm run deploy
```

## Endpoint

After deployment, you'll get a public URL:

```
https://xxxxxxxxxx.execute-api.us-east-2.amazonaws.com/dev/upload
```

## Usage from Next.js

```typescript
const response = await fetch("https://your-lambda-url/upload", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    roomId: "ABC123",
    userRole: "girlfriend",
    images: {
      animal: "data:image/jpeg;base64,...",
      place: ["data:image/jpeg;base64,...", "data:image/jpeg;base64,..."],
    },
  }),
});

const result = await response.json();
console.log(result);
```

## Troubleshooting

### Common Issues

1. **VPC Configuration**: Lambda must be in same VPC as ElastiCache
2. **Security Groups**: Must allow outbound traffic on port 6379
3. **Subnets**: Use subnets in different Availability Zones for redundancy
4. **TLS**: ElastiCache Serverless requires TLS connections

### AWS Console Paths

- **ElastiCache**: `elasticache/valkey-cache/cache-name/configuration`
- **VPC Subnets**: `vpc/subnets`
- **Security Groups**: `ec2/security-groups`
- **IAM Users**: `iam/users`
- **Lambda Functions**: `lambda/functions`

## Rate Limiting

- **3 uploads per IP** per hour
- Uses Redis sliding window algorithm
- Configurable in `handler.ts`
