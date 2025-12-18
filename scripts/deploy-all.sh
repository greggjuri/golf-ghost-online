#!/bin/bash
# scripts/deploy-all.sh
# Master deployment script for Golf Ghost Online infrastructure
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
echo "Next steps:"
echo "  1. Note the API endpoint URL from step [4/5] above"
echo "  2. Update your frontend with NEXT_PUBLIC_API_URL"
echo "  3. Deploy the site: npm run deploy"
echo ""
