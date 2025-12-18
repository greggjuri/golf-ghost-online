#!/bin/bash
# scripts/setup-dns.sh
# Configure Route53 DNS for ghost.jurigregg.com
set -e

DOMAIN="ghost.jurigregg.com"
CF_DOMAIN="d3o4hk0lf61t0c.cloudfront.net"
# CloudFront's hosted zone ID (constant for all CloudFront distributions)
CF_HOSTED_ZONE="Z2FDTNDATAQYW2"

echo "=== Golf Ghost DNS Setup ==="

# Get hosted zone for jurigregg.com
echo "Finding hosted zone for jurigregg.com..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='jurigregg.com.'].Id" --output text | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ] || [ "$HOSTED_ZONE_ID" = "None" ]; then
  echo "Error: Could not find hosted zone for jurigregg.com"
  echo "Make sure the domain is hosted in Route53."
  exit 1
fi

echo "Found hosted zone: $HOSTED_ZONE_ID"

# Create change batch for A record alias
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
echo "Creating/updating DNS record..."
CHANGE_ID=$(aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file:///tmp/dns-change.json \
  --query 'ChangeInfo.Id' --output text)

echo ""
echo "DNS record created/updated successfully!"
echo "  $DOMAIN -> $CF_DOMAIN"
echo "  Change ID: $CHANGE_ID"
echo ""
echo "DNS propagation may take a few minutes."
echo "Test with: dig $DOMAIN"

# Cleanup
rm -f /tmp/dns-change.json
