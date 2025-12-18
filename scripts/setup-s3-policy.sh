#!/bin/bash
# scripts/setup-s3-policy.sh
# Apply S3 bucket policy allowing CloudFront OAC access
set -e

BUCKET_NAME="golf-ghost-online"
ACCOUNT_ID="490004610151"
DISTRIBUTION_ID="E2KBQWTXR4AM7Y"

echo "=== Setting up S3 Bucket Policy ==="

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

echo "S3 bucket policy applied"
echo "  Bucket: $BUCKET_NAME"
echo "  CloudFront Distribution: $DISTRIBUTION_ID"
