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

# Modify config:
# 1. Set DefaultRootObject to index.html (serves index.html at root path)
# 2. Add custom error response for 404 -> index.html (SPA routing)
jq '.DistributionConfig.DefaultRootObject = "index.html" | .DistributionConfig.CustomErrorResponses = {
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

echo "CloudFront configured"
echo "  DefaultRootObject: index.html"
echo "  404 errors return /index.html with 200 status (SPA routing)"
echo "  Distribution: $DISTRIBUTION_ID"
echo ""
echo "Note: Changes may take a few minutes to propagate."
