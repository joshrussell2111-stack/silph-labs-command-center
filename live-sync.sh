#!/bin/bash
# Silph Co. Live Sync - Runs continuously, syncing every 2 minutes

cd /Users/joshrussell/.openclaw/workspace/silph-command-center

echo "🔄 Silph Co. Live Sync started at $(date)"
echo "📡 Syncing every 2 minutes..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
    echo "[$(date '+%H:%M:%S')] Syncing data..."
    
    # Sync data
    node sync-data.js > /dev/null 2>&1
    
    # Commit and push if there are changes
    if git diff --quiet public/data.json; then
        echo "[$(date '+%H:%M:%S')] No changes to sync"
    else
        echo "[$(date '+%H:%M:%S')] Changes detected, pushing to cloud..."
        git add public/data.json
        git commit -m "Live sync: $(date '+%H:%M:%S')" > /dev/null 2>&1
        git push > /dev/null 2>&1
        echo "[$(date '+%H:%M:%S')] ✅ Synced to cloud"
    fi
    
    echo ""
    sleep 120  # 2 minutes
done