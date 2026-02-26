#!/bin/bash

# Silph Command Center - Startup Script
# Kills any existing processes and starts fresh server

echo "🏢 SILPH CO. COMMAND CENTER - STARTUP"
echo "======================================"
echo ""

# Kill any existing node processes running server.js
echo "🔍 Checking for existing processes..."
pkill -f "node server.js" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Killed existing server process"
    sleep 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Start server
echo ""
echo "🚀 Starting WebSocket Server..."
echo ""
npm start
