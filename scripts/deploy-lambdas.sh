#!/bin/bash
# scripts/deploy-lambdas.sh
# Build and deploy Lambda functions using esbuild bundling
set -e

REGION="us-east-1"
ACCOUNT_ID="490004610151"
ROLE_NAME="golf-ghost-lambda-role"
TABLE_NAME="golf-ghost-courses"

# Function name : source file path mapping
FUNCTIONS=(
  "golf-ghost-generate-score:generate-score/index.ts"
  "golf-ghost-get-courses:get-courses/index.ts"
  "golf-ghost-create-course:create-course/index.ts"
  "golf-ghost-delete-course:delete-course/index.ts"
)

echo "=== Golf Ghost Lambda Deployment ==="

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Step 1: Create IAM role if not exists
echo ""
echo "[1/4] Checking IAM role..."
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
echo "IAM role ready: $ROLE_ARN"

# Step 2: Install dependencies
echo ""
echo "[2/4] Installing dependencies..."
cd "$PROJECT_ROOT/lambda"
npm install
cd "$PROJECT_ROOT"

# Step 3: Bundle and deploy each function using esbuild
echo ""
echo "[3/4] Bundling and deploying functions..."

for func_pair in "${FUNCTIONS[@]}"; do
  FUNC_NAME="${func_pair%%:*}"
  FUNC_SRC="${func_pair##*:}"

  echo ""
  echo "  Deploying $FUNC_NAME..."

  # Create deployment package directory
  rm -rf /tmp/lambda-package
  mkdir -p /tmp/lambda-package

  # Bundle with esbuild
  # - ESM format for Node 20
  # - External AWS SDK (provided by Lambda runtime)
  # - Bundle all other dependencies
  echo "    Bundling with esbuild..."
  "$PROJECT_ROOT/lambda/node_modules/.bin/esbuild" \
    "$PROJECT_ROOT/lambda/$FUNC_SRC" \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=esm \
    --external:@aws-sdk/* \
    --outfile=/tmp/lambda-package/index.mjs

  # Create zip package
  cd /tmp/lambda-package
  zip -rq /tmp/${FUNC_NAME}.zip .
  cd "$PROJECT_ROOT"

  # Check if function exists
  if aws lambda get-function --function-name $FUNC_NAME --region $REGION 2>/dev/null; then
    # Update existing function
    echo "    Updating existing function..."
    aws lambda update-function-code \
      --function-name $FUNC_NAME \
      --zip-file fileb:///tmp/${FUNC_NAME}.zip \
      --region $REGION > /dev/null

    # Wait for update to complete before updating configuration
    aws lambda wait function-updated --function-name $FUNC_NAME --region $REGION 2>/dev/null || true

    # Update configuration
    aws lambda update-function-configuration \
      --function-name $FUNC_NAME \
      --handler index.handler \
      --environment "Variables={COURSES_TABLE=$TABLE_NAME}" \
      --region $REGION > /dev/null 2>&1 || true
  else
    # Create new function
    echo "    Creating new function..."
    aws lambda create-function \
      --function-name $FUNC_NAME \
      --runtime nodejs20.x \
      --role $ROLE_ARN \
      --handler index.handler \
      --zip-file fileb:///tmp/${FUNC_NAME}.zip \
      --timeout 10 \
      --memory-size 256 \
      --environment "Variables={COURSES_TABLE=$TABLE_NAME}" \
      --region $REGION > /dev/null
  fi

  echo "    $FUNC_NAME deployed"
done

# Step 4: Cleanup
echo ""
echo "[4/4] Cleaning up..."
rm -rf /tmp/lambda-package
rm -f /tmp/golf-ghost-*.zip
rm -f /tmp/trust-policy.json

echo ""
echo "All Lambda functions deployed successfully!"
echo ""
echo "Functions deployed:"
for func_pair in "${FUNCTIONS[@]}"; do
  FUNC_NAME="${func_pair%%:*}"
  echo "  - $FUNC_NAME"
done
