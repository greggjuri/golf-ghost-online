# INITIAL-13: Infrastructure Deployment Scripts

## Overview
Create deployment scripts and configurations for the remaining AWS infrastructure. Claude Code will create the scripts; user will execute them.

**Covers:** S3 bucket policy, Lambda deployment, API Gateway setup, Route53 DNS, static site deployment

## Context

### Already Completed (manually)
- ✅ S3 bucket `golf-ghost-online` created
- ✅ ACM certificate exists (wildcard `*.jurigregg.com`)
- ✅ CloudFront distribution created and deploying
- ✅ DynamoDB table `golf-ghost-courses` created and seeded

### AWS Resource IDs
```
Account ID:           490004610151
Region:               us-east-1
S3 Bucket:            golf-ghost-online
CloudFront Dist ID:   E2KBQWTXR4AM7Y
CloudFront Domain:    d3o4hk0lf61t0c.cloudfront.net
DynamoDB Table:       golf-ghost-courses
```

## Requirements

### 1. S3 Bucket Policy Script
Create `scripts/setup-s3-policy.sh` that applies the bucket policy allowing CloudFront OAC access.

```bash
#!/bin/bash
# scripts/setup-s3-policy.sh

BUCKET_NAME="golf-ghost-online"
ACCOUNT_ID="490004610151"
DISTRIBUTION_ID="E2KBQWTXR4AM7Y"

# Create policy JSON
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DISTRIBUTION_ID}"
        }
      }
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file:///tmp/bucket-policy.json
echo "✓ S3 bucket policy applied"
```

### 2. CloudFront Error Pages Script
Create `scripts/setup-cloudfront-errors.sh` for SPA routing support.

```bash
#!/bin/bash
# scripts/setup-cloudfront-errors.sh

DISTRIBUTION_ID="E2KBQWTXR4AM7Y"

# Get current config
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > /tmp/cf-config.json

# Extract ETag for update
ETAG=$(jq -r '.ETag' /tmp/cf-config.json)

# Modify config to add custom error response
jq '.DistributionConfig.CustomErrorResponses = {
  "Quantity": 1,
  "Items": [
    {
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 10
    }
  ]
}' /tmp/cf-config.json | jq '.DistributionConfig' > /tmp/cf-update.json

# Update distribution
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --if-match $ETAG \
  --distribution-config file:///tmp/cf-update.json

echo "✓ CloudFront error pages configured"
```

### 3. Lambda Deployment Script
Create `scripts/deploy-lambdas.sh` that:
1. Creates IAM role (if not exists)
2. Builds Lambda code
3. Packages each function with dependencies
4. Creates/updates Lambda functions
5. Tests each function

```bash
#!/bin/bash
# scripts/deploy-lambdas.sh
set -e

REGION="us-east-1"
ACCOUNT_ID="490004610151"
ROLE_NAME="golf-ghost-lambda-role"
TABLE_NAME="golf-ghost-courses"

FUNCTIONS=(
  "golf-ghost-generate-score:generate-score"
  "golf-ghost-get-courses:get-courses"
  "golf-ghost-create-course:create-course"
  "golf-ghost-delete-course:delete-course"
)

echo "=== Golf Ghost Lambda Deployment ==="

# Step 1: Create IAM role if not exists
echo "Checking IAM role..."
if ! aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
  echo "Creating IAM role..."
  
  cat > /tmp/trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file:///tmp/trust-policy.json

  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

  echo "Waiting for role to propagate..."
  sleep 10
fi

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo "✓ IAM role ready: $ROLE_ARN"

# Step 2: Build Lambda code
echo "Building Lambda code..."
cd lambda
npm install
npm run build
cd ..

# Step 3: Package and deploy each function
echo "Packaging and deploying functions..."

for func_pair in "${FUNCTIONS[@]}"; do
  FUNC_NAME="${func_pair%%:*}"
  FUNC_DIR="${func_pair##*:}"
  
  echo "  Deploying $FUNC_NAME..."
  
  # Create deployment package
  rm -rf /tmp/lambda-package
  mkdir -p /tmp/lambda-package
  
  cp -r lambda/dist/$FUNC_DIR/* /tmp/lambda-package/
  cp -r lambda/dist/shared /tmp/lambda-package/
  cp -r lambda/node_modules /tmp/lambda-package/
  
  cd /tmp/lambda-package
  zip -rq /tmp/${FUNC_NAME}.zip .
  cd - > /dev/null
  
  # Check if function exists
  if aws lambda get-function --function-name $FUNC_NAME --region $REGION 2>/dev/null; then
    # Update existing function
    aws lambda update-function-code \
      --function-name $FUNC_NAME \
      --zip-file fileb:///tmp/${FUNC_NAME}.zip \
      --region $REGION > /dev/null
  else
    # Create new function
    aws lambda create-function \
      --function-name $FUNC_NAME \
      --runtime nodejs20.x \
      --role $ROLE_ARN \
      --handler index.handler \
      --zip-file fileb:///tmp/${FUNC_NAME}.zip \
      --timeout 10 \
      --memory-size 256 \
      --environment Variables="{COURSES_TABLE=$TABLE_NAME}" \
      --region $REGION > /dev/null
  fi
  
  echo "  ✓ $FUNC_NAME deployed"
done

echo "✓ All Lambda functions deployed"
```

### 4. API Gateway Setup Script
Create `scripts/setup-api-gateway.sh` that creates HTTP API with routes.

```bash
#!/bin/bash
# scripts/setup-api-gateway.sh
set -e

REGION="us-east-1"
ACCOUNT_ID="490004610151"
API_NAME="golf-ghost-api"

echo "=== Golf Ghost API Gateway Setup ==="

# Check if API exists
EXISTING_API=$(aws apigatewayv2 get-apis --region $REGION \
  --query "Items[?Name=='$API_NAME'].ApiId" --output text)

if [ -n "$EXISTING_API" ]; then
  echo "API already exists: $EXISTING_API"
  API_ID=$EXISTING_API
else
  # Create HTTP API
  echo "Creating HTTP API..."
  API_ID=$(aws apigatewayv2 create-api \
    --name $API_NAME \
    --protocol-type HTTP \
    --cors-configuration '{
      "AllowOrigins": ["https://ghost.jurigregg.com", "http://localhost:3000"],
      "AllowMethods": ["GET", "POST", "DELETE", "OPTIONS"],
      "AllowHeaders": ["Content-Type"],
      "AllowCredentials": false
    }' \
    --region $REGION \
    --query 'ApiId' --output text)
  
  echo "✓ Created API: $API_ID"
fi

# Function to create integration and route
create_route() {
  local FUNC_NAME=$1
  local METHOD=$2
  local PATH=$3
  
  echo "  Setting up $METHOD $PATH -> $FUNC_NAME"
  
  # Create integration
  INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNC_NAME}" \
    --payload-format-version 2.0 \
    --region $REGION \
    --query 'IntegrationId' --output text)
  
  # Create route
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "$METHOD $PATH" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION > /dev/null
  
  # Grant Lambda permission
  aws lambda add-permission \
    --function-name $FUNC_NAME \
    --statement-id "apigateway-${METHOD}-${PATH//\//-}" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
    --region $REGION 2>/dev/null || true
}

# Create routes
echo "Creating routes..."
create_route "golf-ghost-generate-score" "POST" "/generate-score"
create_route "golf-ghost-get-courses" "GET" "/courses"
create_route "golf-ghost-create-course" "POST" "/courses"
create_route "golf-ghost-delete-course" "DELETE" "/courses/{id}"

# Create stage with auto-deploy
echo "Creating production stage..."
aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name prod \
  --auto-deploy \
  --region $REGION 2>/dev/null || true

# Get endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --region $REGION \
  --query 'ApiEndpoint' --output text)

echo ""
echo "✓ API Gateway configured"
echo "  API ID: $API_ID"
echo "  Endpoint: $API_ENDPOINT"
echo ""
echo "Save this for your frontend:"
echo "  NEXT_PUBLIC_API_URL=$API_ENDPOINT"
```

### 5. Route53 DNS Script
Create `scripts/setup-dns.sh` for the DNS alias record.

```bash
#!/bin/bash
# scripts/setup-dns.sh
set -e

DOMAIN="ghost.jurigregg.com"
CF_DOMAIN="d3o4hk0lf61t0c.cloudfront.net"
# CloudFront's hosted zone ID (constant for all CF distributions)
CF_HOSTED_ZONE="Z2FDTNDATAQYW2"

echo "=== Golf Ghost DNS Setup ==="

# Get hosted zone for jurigregg.com
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='jurigregg.com.'].Id" --output text | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ]; then
  echo "Error: Could not find hosted zone for jurigregg.com"
  exit 1
fi

echo "Found hosted zone: $HOSTED_ZONE_ID"

# Create change batch
cat > /tmp/dns-change.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "$CF_HOSTED_ZONE",
          "DNSName": "$CF_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

# Apply change
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file:///tmp/dns-change.json

echo "✓ DNS record created/updated"
echo "  $DOMAIN -> $CF_DOMAIN"
echo ""
echo "DNS propagation may take a few minutes."
```

### 6. Static Site Deploy Script
Create `scripts/deploy-site.sh` for building and deploying the Next.js app.

```bash
#!/bin/bash
# scripts/deploy-site.sh
set -e

BUCKET="golf-ghost-online"
DISTRIBUTION_ID="E2KBQWTXR4AM7Y"

echo "=== Golf Ghost Site Deployment ==="

# Build
echo "Building Next.js app..."
npm run build

# Sync to S3
echo "Uploading to S3..."
aws s3 sync out/ s3://$BUCKET --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" > /dev/null

echo ""
echo "✓ Site deployed!"
echo "  https://ghost.jurigregg.com"
echo ""
echo "Note: CloudFront invalidation may take 1-2 minutes."
```

### 7. Master Deploy Script
Create `scripts/deploy-all.sh` that runs everything in order.

```bash
#!/bin/bash
# scripts/deploy-all.sh
# Master deployment script for Golf Ghost Online
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  Golf Ghost Online - Full Deployment"
echo "========================================"
echo ""

# Run each script in order
echo "[1/5] Setting up S3 bucket policy..."
bash "$SCRIPT_DIR/setup-s3-policy.sh"
echo ""

echo "[2/5] Configuring CloudFront error pages..."
bash "$SCRIPT_DIR/setup-cloudfront-errors.sh"
echo ""

echo "[3/5] Deploying Lambda functions..."
bash "$SCRIPT_DIR/deploy-lambdas.sh"
echo ""

echo "[4/5] Setting up API Gateway..."
bash "$SCRIPT_DIR/setup-api-gateway.sh"
echo ""

echo "[5/5] Configuring DNS..."
bash "$SCRIPT_DIR/setup-dns.sh"
echo ""

echo "========================================"
echo "  Infrastructure deployment complete!"
echo "========================================"
echo ""
echo "Next step: Update frontend with API URL, then run:"
echo "  npm run deploy"
echo ""
```

### 8. Package.json Scripts
Add deployment script to root `package.json`:

```json
{
  "scripts": {
    "deploy": "bash scripts/deploy-site.sh",
    "deploy:infra": "bash scripts/deploy-all.sh",
    "deploy:lambdas": "bash scripts/deploy-lambdas.sh"
  }
}
```

## File Structure

```
scripts/
├── setup-s3-policy.sh       # S3 bucket policy for CloudFront
├── setup-cloudfront-errors.sh # SPA error page config
├── deploy-lambdas.sh        # Lambda packaging & deployment
├── setup-api-gateway.sh     # API Gateway HTTP API setup
├── setup-dns.sh             # Route53 DNS record
├── deploy-site.sh           # Build & deploy static site
└── deploy-all.sh            # Master deployment script
```

## Success Criteria

- [ ] All scripts created in `scripts/` directory
- [ ] Scripts are executable (`chmod +x`)
- [ ] `deploy-all.sh` runs without errors
- [ ] S3 bucket policy allows CloudFront access
- [ ] CloudFront configured for SPA routing
- [ ] All 4 Lambda functions deployed
- [ ] API Gateway HTTP API created with routes
- [ ] Route53 DNS points to CloudFront
- [ ] `npm run deploy` works

## Notes

- Scripts are idempotent (safe to run multiple times)
- All scripts use hardcoded values for this specific deployment
- API Gateway endpoint will be output by `setup-api-gateway.sh` — save it for frontend config
- DNS propagation may take a few minutes after `setup-dns.sh`
