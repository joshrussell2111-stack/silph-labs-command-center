# 🚀 Silph Command Center - Quick Start

## Start the Server

```bash
cd /Users/joshrussell/.openclaw/workspace/silph-command-center
npm start
```

## Access Dashboard

**URL:** http://localhost:3000

## What to Expect

### Real-Time Features (5-second updates)
- ⚡ **Live Status Updates** - Agent HP bars animate
- 📊 **Token Counter** - Increases in real-time
- 🎯 **Mission Log** - New entries slide in
- 🤖 **Model Router** - Active model highlighted
- 📡 **WebSocket** - Green "LIVE" indicator top-right

### Draggable Widgets
1. **Click & hold** any card
2. **Drag** to new position
3. **Release** to drop
4. **Auto-saves** to localStorage
5. **Persists** on page refresh

### Connection Indicators

**Top-Right (Header):**
- 🟢 LIVE = WebSocket connected
- 🔴 OFFLINE = Disconnected

**Bottom-Left (WebSocket Status):**
- 🟢 WS: LIVE = Receiving updates
- 🟡 WS: Retry X... = Reconnecting
- 🔴 WS: Disconnected = Offline

## Troubleshooting

### Port Already in Use
```bash
# Kill existing process
ps aux | grep "node server.js" | awk '{print $2}' | xargs kill -9

# Or use different port
PORT=3005 npm start
```

### Not Updating?
1. Check WebSocket indicator (bottom-left)
2. Open Browser DevTools → Console
3. Look for "[WebSocket] Connected" message
4. Check Network tab for active WS connection

## File Structure

```
silph-command-center/
├── server.js              # WebSocket + HTTP server
├── public/
│   ├── index.html         # Dashboard UI
│   └── app.js            # WebSocket client
├── backups/               # Original files
│   ├── server.js.backup
│   └── index.html.backup
├── UPGRADE_SUMMARY.md     # Full documentation
└── QUICK_START.md         # This file
```

## Key Features

✅ Real-time WebSocket updates (5s)
✅ Auto-reconnect on disconnect
✅ Draggable widget layout
✅ Persistent layout storage
✅ Pokemon Fire Red theme
✅ Smooth animations
✅ No page refreshes needed
✅ HTTP fallback if WS fails

## Made By

**Pixel** 🎨 - Web Development Specialist  
Silph Labs Command Center v3.0  
February 26, 2026
