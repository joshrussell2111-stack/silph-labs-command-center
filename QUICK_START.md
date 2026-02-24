# 🚀 Quick Start Guide

## TL;DR - Get Running in 30 Seconds

```bash
cd silph-command-center
npm install
npm start
```

Open browser to: **http://localhost:3001**

---

## What You'll See

### Dashboard Overview
- **Header**: SILPH LABS COMMAND CENTER with Pokéball logo
- **Connection Status**: Shows "LIVE" when connected to backend
- **4 Main Panels**:
  1. **System Status** - Gateway, uptime, API latency, active agents
  2. **Active Pokémon (Subagents)** - 5 agent cards with HP bars
  3. **Mission Log** - Recent activity feed
  4. **Quick Actions** - 6 functional buttons

### Subagent Cards
Each agent shows:
- **Icon & Name** (e.g., 🎨 PIXEL)
- **Type** (e.g., WEB DESIGN)
- **Status Indicator** (🟢 Active / 🟡 Busy / 🔴 Idle / ⚫ Offline)
- **HP Bar** (color changes based on activity level)
- **HP Value** (0-100)

### How HP Bars Work
- **100 HP** = File modified today, lots of tasks completed
- **70-99 HP** = Active within 24 hours
- **40-69 HP** = Active within 48 hours
- **10-39 HP** = Older activity
- **<10 HP** = Offline (3+ days without activity)

---

## Quick Actions Explained

1. **🆕 Spawn Agent**
   - Opens modal to create new subagent
   - Enter name, type, description
   - Agent appears immediately in dashboard

2. **📊 View Reports**
   - Lists all reports in workspace
   - Shows .html, .pdf, .md files
   - Click to view in new tab

3. **🏥 System Check**
   - Runs health diagnostics
   - Checks gateway, agents, resources
   - Shows alert with results

4. **⚙️ Settings**
   - Change refresh rate (5s/10s/30s/60s)
   - Update API URL
   - Saves to browser localStorage

5. **🔄 Refresh**
   - Force immediate data refresh
   - Updates all panels

6. **📡 API**
   - Opens API endpoint in new tab
   - See raw JSON data

---

## API Quick Reference

### Get Full Status
```bash
curl http://localhost:3001/api/status | jq
```

### Check Health
```bash
curl http://localhost:3001/api/health
```

### List Subagents
```bash
curl http://localhost:3001/api/subagents | jq
```

### Run Health Check
```bash
curl -X POST http://localhost:3001/api/actions/health-check | jq
```

### Spawn Agent
```bash
curl -X POST http://localhost:3001/api/actions/spawn \
  -H "Content-Type: application/json" \
  -d '{"name":"Nova","type":"RESEARCH","description":"Market research agent"}' | jq
```

---

## Configuration

### Change Port
```bash
PORT=4000 npm start
```

### Change Workspace Path
```bash
WORKSPACE=/path/to/workspace npm start
```

### Environment Variables
Create `.env` file:
```bash
PORT=3001
WORKSPACE=/Users/joshrussell/.openclaw/workspace
```

---

## Stopping the Server

```bash
# If running in terminal: Ctrl+C

# If running in background:
ps aux | grep "node server.js"
kill <PID>

# Or:
pkill -f "node server.js"
```

---

## Troubleshooting

### Port Already in Use
```bash
lsof -i :3001
kill -9 <PID>
```

### Dashboard Shows "OFFLINE"
1. Check server is running: `curl http://localhost:3001/api/health`
2. Check console for errors
3. Verify API URL in Settings

### No Agents Showing Activity
- Verify skill logs exist: `ls ~/.openclaw/workspace/*-skill-log.md`
- Touch a log file to update it: `touch ~/.openclaw/workspace/pixel-skill-log.md`
- Wait 30 seconds for server to refresh
- Click Refresh button in dashboard

### WebSocket Errors (Safe to Ignore)
- WebSocket is optional
- Dashboard works fine with polling
- Errors won't affect functionality

---

## File Locations

```
silph-command-center/
├── server.js                    # Backend API
├── public/index.html            # Frontend dashboard
├── start.sh                     # Start script
├── dev.sh                       # Dev mode (auto-reload)
├── README.md                    # Full docs
├── DEPLOYMENT.md                # Deployment guides
├── MISSION_COMPLETE.md          # Completion report
└── QUICK_START.md (this file)   # This guide
```

---

## Next Steps

1. **Test it**: Click all the buttons, spawn an agent, run health check
2. **Customize**: Edit agent names/icons in server.js
3. **Deploy**: Follow DEPLOYMENT.md to deploy to Render/Railway
4. **Extend**: Add new features (see MISSION_COMPLETE.md for ideas)

---

## Tips

- **Auto-Refresh**: Dashboard updates every 10s by default (change in Settings)
- **Server Updates**: Backend refreshes data every 30s
- **Activity Tracking**: Touch skill log files to increase agent HP
- **Persistent Settings**: API URL and refresh rate saved to localStorage
- **Mobile Friendly**: Dashboard works on phones and tablets

---

**🎮 Ready to monitor your AI team!**

Open http://localhost:3001 and watch your subagents come to life! 🔥