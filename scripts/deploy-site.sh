#!/bin/bash
# scripts/deploy-site.sh
# Build and deploy Next.js static site to S3
set -e

BUCKET="golf-ghost-online"
DISTRIBUTION_ID="E2KBQWTXR4AM7Y"

echo "=== Golf Ghost Site Deployment ==="

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Build
echo ""
echo "[1/3] Building Next.js app..."
npm run build

# Check that out/ directory exists
if [ ! -d "out" ]; then
  echo "Error: Build output directory 'out/' not found"
  echo "Make sure next.config.mjs has output: 'export'"
  exit 1
fi

# Sync to S3
echo ""
echo "[2/3] Uploading to S3..."
aws s3 sync out/ s3://$BUCKET --delete

# Invalidate CloudFront cache
echo ""
echo "[3/3] Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --query 'Invalidation.Id' --output text)

echo ""
echo "Site deployed successfully!"
echo ""
echo "  S3 Bucket: $BUCKET"
echo "  CloudFront: $DISTRIBUTION_ID"
echo "  Invalidation: $INVALIDATION_ID"
echo ""
echo "Your site will be available at:"
echo "  https://ghost.jurigregg.com"
echo ""
echo "Note: CloudFront invalidation may take 1-2 minutes to complete."
