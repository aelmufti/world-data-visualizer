#!/bin/bash

echo "🧹 Firebase Cleanup Script"
echo ""
echo "This will remove old Firebase-related files that are no longer needed."
echo "The DuckDB migration is complete and these files are not used anymore."
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Removing Firebase files..."

# Remove Firebase source files
rm -f src/firebase.ts
rm -f src/firebase-emulator.ts
rm -f src/worker.ts
rm -f src/rss-worker.ts
rm -f src/seed.ts
rm -f src/aggregator.ts

# Remove Firebase config files
rm -f firebase.json
rm -f firestore.indexes.json
rm -f firestore.rules
rm -f firebase-debug.log
rm -f firestore-debug.log

# Remove Firebase directory
rm -rf .firebase/

echo "✅ Firebase files removed"
echo ""
echo "Remaining files:"
echo "  ✓ src/database.ts (DuckDB)"
echo "  ✓ src/aggregator-duckdb.ts"
echo "  ✓ src/worker-duckdb.ts"
echo "  ✓ src/rss-worker-duckdb.ts"
echo "  ✓ src/seed-duckdb.ts"
echo ""
echo "✅ Cleanup complete!"
