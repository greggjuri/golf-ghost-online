#!/bin/bash
# scripts/setup-api-gateway.sh
# Create HTTP API with routes and CORS configuration
set -e

REGION="us-east-1"
ACCOUNT_ID="490004610151"
API_NAME="golf-ghost-api"

echo "=== Golf Ghost API Gateway Setup ==="

# Check if API exists
EXISTING_API=$(aws apigatewayv2 get-apis --region $REGION \
  --query "Items[?Name=='$API_NAME'].ApiId" --output text)

if [ -n "$EXISTING_API" ] && [ "$EXISTING_API" != "None" ]; then
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
      "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      "AllowHeaders": ["Content-Type", "Authorization"],
      "AllowCredentials": false
    }' \
    --region $REGION \
    --query 'ApiId' --output text)

  echo "Created API: $API_ID"
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
    --query 'IntegrationId' --output text 2>/dev/null) || {
    echo "    Integration may already exist, continuing..."
    return 0
  }

  # Create route
  aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "$METHOD $PATH" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION > /dev/null 2>&1 || {
    echo "    Route may already exist, continuing..."
  }

  # Create sanitized statement ID (replace special chars with dashes)
  SANITIZED_PATH=$(echo "$PATH" | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
  STATEMENT_ID="apigateway-${METHOD}-${SANITIZED_PATH}"

  # Grant Lambda permission to be invoked by API Gateway
  aws lambda add-permission \
    --function-name $FUNC_NAME \
    --statement-id "$STATEMENT_ID" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
    --region $REGION 2>/dev/null || {
    echo "    Permission may already exist, continuing..."
  }
}

# Create routes
echo ""
echo "Creating routes..."
create_route "golf-ghost-generate-score" "POST" "/generate-score"
create_route "golf-ghost-get-courses" "GET" "/courses"
create_route "golf-ghost-create-course" "POST" "/courses"
create_route "golf-ghost-update-course" "PUT" "/courses/{id}"
create_route "golf-ghost-delete-course" "DELETE" "/courses/{id}"

# Create or update production stage with auto-deploy
echo ""
echo "Setting up production stage..."
aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name prod \
  --auto-deploy \
  --region $REGION 2>/dev/null || {
  echo "Stage may already exist, updating..."
  aws apigatewayv2 update-stage \
    --api-id $API_ID \
    --stage-name prod \
    --auto-deploy \
    --region $REGION > /dev/null 2>&1 || true
}

# Get endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --region $REGION \
  --query 'ApiEndpoint' --output text)

echo ""
echo "API Gateway configured successfully!"
echo ""
echo "  API ID: $API_ID"
echo "  Endpoint: $API_ENDPOINT"
echo ""
echo "============================================"
echo "IMPORTANT: Save this for your frontend config:"
echo ""
echo "  NEXT_PUBLIC_API_URL=${API_ENDPOINT}/prod"
echo ""
echo "============================================"
echo ""
echo "Test the API:"
echo "  curl ${API_ENDPOINT}/prod/courses"
