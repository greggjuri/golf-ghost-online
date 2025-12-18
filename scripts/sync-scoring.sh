#!/bin/bash
# Sync scoring code from src/lib/scoring to lambda/shared/scoring
# Run this whenever scoring logic changes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

SRC_DIR="$PROJECT_ROOT/src/lib/scoring"
DEST_DIR="$PROJECT_ROOT/lambda/shared/scoring"

echo "Syncing scoring code..."
echo "  From: $SRC_DIR"
echo "  To:   $DEST_DIR"

# Copy files
cp "$SRC_DIR/gaussian.ts" "$DEST_DIR/gaussian.ts"
cp "$SRC_DIR/handicap.ts" "$DEST_DIR/handicap.ts"
cp "$SRC_DIR/validation.ts" "$DEST_DIR/validation.ts"
cp "$SRC_DIR/index.ts" "$DEST_DIR/index.ts"

# Add .js extensions to imports in copied files for ESM compatibility
sed -i "s/from '\.\/gaussian'/from '.\/gaussian.js'/g" "$DEST_DIR/index.ts"
sed -i "s/from '\.\/handicap'/from '.\/handicap.js'/g" "$DEST_DIR/index.ts"
sed -i "s/from '\.\/validation'/from '.\/validation.js'/g" "$DEST_DIR/index.ts"
sed -i "s/from '\.\/generator'/from '.\/generator.js'/g" "$DEST_DIR/index.ts"

echo ""
echo "Note: generator.ts has Lambda-specific imports (inline types, .js extensions)."
echo "      Update manually if the core algorithm changes."
echo ""
echo "Done! Files synced to lambda/shared/scoring/"
