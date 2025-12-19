#!/bin/bash
# scripts/setup-cognito.sh
# Create Cognito User Pool and App Client for Golf Ghost authentication
set -e

REGION="us-east-1"
POOL_NAME="golf-ghost-users"
CLIENT_NAME="golf-ghost-web"

echo "=== Golf Ghost Cognito Setup ==="
echo ""

# Check if User Pool already exists
echo "Checking for existing User Pool..."
EXISTING_POOL=$(aws cognito-idp list-user-pools --max-results 60 --region $REGION \
  --query "UserPools[?Name=='$POOL_NAME'].Id" --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_POOL" ] && [ "$EXISTING_POOL" != "None" ]; then
  echo "User Pool already exists: $EXISTING_POOL"
  USER_POOL_ID=$EXISTING_POOL
else
  # Create User Pool with settings
  echo "Creating User Pool: $POOL_NAME..."
  USER_POOL_ID=$(aws cognito-idp create-user-pool \
    --pool-name $POOL_NAME \
    --policies '{
      "PasswordPolicy": {
        "MinimumLength": 8,
        "RequireUppercase": true,
        "RequireLowercase": true,
        "RequireNumbers": true,
        "RequireSymbols": true,
        "TemporaryPasswordValidityDays": 7
      }
    }' \
    --auto-verified-attributes email \
    --username-attributes email \
    --admin-create-user-config '{
      "AllowAdminCreateUserOnly": true,
      "InviteMessageTemplate": {
        "EmailSubject": "Golf Ghost Admin Invite",
        "EmailMessage": "Your username is {username} and temporary password is {####}."
      }
    }' \
    --schema '[
      {
        "Name": "email",
        "AttributeDataType": "String",
        "Required": true,
        "Mutable": true
      }
    ]' \
    --user-attribute-update-settings '{
      "AttributesRequireVerificationBeforeUpdate": []
    }' \
    --account-recovery-setting '{
      "RecoveryMechanisms": [
        {
          "Priority": 1,
          "Name": "verified_email"
        }
      ]
    }' \
    --region $REGION \
    --query 'UserPool.Id' --output text)

  echo "Created User Pool: $USER_POOL_ID"
fi

# Check if App Client already exists
echo ""
echo "Checking for existing App Client..."
EXISTING_CLIENT=$(aws cognito-idp list-user-pool-clients \
  --user-pool-id $USER_POOL_ID \
  --region $REGION \
  --query "UserPoolClients[?ClientName=='$CLIENT_NAME'].ClientId" --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_CLIENT" ] && [ "$EXISTING_CLIENT" != "None" ]; then
  echo "App Client already exists: $EXISTING_CLIENT"
  CLIENT_ID=$EXISTING_CLIENT
else
  # Create App Client
  echo "Creating App Client: $CLIENT_NAME..."
  CLIENT_ID=$(aws cognito-idp create-user-pool-client \
    --user-pool-id $USER_POOL_ID \
    --client-name $CLIENT_NAME \
    --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --generate-secret false \
    --access-token-validity 60 \
    --id-token-validity 60 \
    --refresh-token-validity 43200 \
    --token-validity-units '{
      "AccessToken": "minutes",
      "IdToken": "minutes",
      "RefreshToken": "minutes"
    }' \
    --prevent-user-existence-errors ENABLED \
    --region $REGION \
    --query 'UserPoolClient.ClientId' --output text)

  echo "Created App Client: $CLIENT_ID"
fi

echo ""
echo "============================================"
echo "Cognito Setup Complete!"
echo ""
echo "User Pool ID: $USER_POOL_ID"
echo "App Client ID: $CLIENT_ID"
echo ""
echo "============================================"
echo "Add these to your .env.local:"
echo ""
echo "NEXT_PUBLIC_COGNITO_REGION=$REGION"
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID"
echo ""
echo "============================================"
echo ""
echo "Next: Run scripts/create-admin-user.sh to create an admin user"
