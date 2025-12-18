#!/bin/bash
# scripts/setup-cloudfront-errors.sh
# Configure CloudFront custom error responses for SPA routing
set -e

DISTRIBUTION_ID="E2KBQWTXR4AM7Y"

echo "=== Setting up CloudFront Error Pages ==="

# Get current config
echo "Fetching current distribution config..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > /tmp/cf-config.json

# Extract ETag for update
ETAG=$(jq -r '.ETag' /tmp/cf-config.json)
echo "Current ETag: $ETAG"

# Modify config to add custom error response
# This makes 404 errors return index.html with 200 status (SPA routing)
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
echo "Updating distribution..."
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --if-match $ETAG \
  --distribution-config file:///tmp/cf-update.json > /dev/null

echo "CloudFront error pages configured"
echo "  404 errors now return /index.html with 200 status"
echo "  Distribution: $DISTRIBUTION_ID"
echo ""
echo "Note: Changes may take a few minutes to propagate."
