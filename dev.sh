#!/bin/bash

# Dev startup with auto-reload
PORT=${1:-3001}

echo "🏢 Starting Silph Labs Command Center (Dev Mode)..."

if [ ! -d "node_modules" ]; then
    npm install
fi

export PORT=$PORT
export WORKSPACE="${WORKSPACE:-$HOME/.openclaw/workspace}"

npx nodemon server.js