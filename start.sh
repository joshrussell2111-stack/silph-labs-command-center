#!/bin/bash

# Silph Labs Command Center Startup Script
# Usage: ./start.sh [port]

PORT=${1:-3001}

echo "🏢 Starting Silph Labs Command Center..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables
export PORT=$PORT
export WORKSPACE="${WORKSPACE:-$HOME/.openclaw/workspace}"

echo "🔧 Configuration:"
echo "  Port: $PORT"
echo "  Workspace: $WORKSPACE"
echo ""

# Start the server
echo "🚀 Launching server..."
echo ""
node server.js