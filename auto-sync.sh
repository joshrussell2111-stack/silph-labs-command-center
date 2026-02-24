#!/bin/bash
# Silph Co. Data Sync Automation
# Run this script periodically to sync local data to cloud

cd /Users/joshrussell/.openclaw/workspace/silph-command-center

echo "🔄 Syncing data..."
node sync-data.js

echo "📤 Committing to GitHub..."
git add public/data.json
git commit -m "Auto-sync: $(date '+%Y-%m-%d %H:%M')" || echo "No changes to commit"
git push

echo "✅ Sync complete at $(date)"