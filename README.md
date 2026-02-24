# 🏢 Silph Labs Command Center

**Live Mission Control for Professor 0ak's AI Team**

A real-time dashboard that monitors subagent activity, system health, and mission logs with a nostalgic Pokémon Fire Red aesthetic.

![Dashboard Preview](https://img.shields.io/badge/status-LIVE-brightgreen)
![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 🚀 Features

### Real-Time Monitoring
- **Subagent Status**: Live HP bars showing activity levels for all 5 agents (Pixel, Meridian, Scout, Aperture, Cipher)
- **System Metrics**: Gateway status, API latency, uptime, and file activity
- **Mission Log**: Recent activities pulled from skill logs and system events
- **Auto-Refresh**: Data updates every 5-10 seconds (configurable)

### Interactive Controls
- **Spawn Agent**: Create new subagents via modal
- **View Reports**: Browse recent analysis reports and presentations
- **System Check**: Run health checks on all components
- **Settings**: Configure refresh rate and API endpoint

### Data Sources
The dashboard pulls real data from:
- Agent skill logs (`pixel-skill-log.md`, `meridian-skill-log.md`, etc.)
- Memory state files (`heartbeat-state.json`, etc.)
- OpenClaw gateway status
- File system activity (recent files)

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone or navigate to the project
cd silph-command-center

# Install dependencies
npm install

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

The server will start on `http://localhost:3001`

---

## 🌐 Usage

### Local Development
1. Start the backend: `npm start`
2. Open `http://localhost:3001` in your browser
3. The dashboard will auto-connect and start fetching data

### Configuration
Click **Settings** in the dashboard to configure:
- **API Server URL**: Backend endpoint (default: `http://localhost:3001`)
- **Refresh Rate**: How often to fetch new data (5s, 10s, 30s, 60s)

Settings are saved to browser localStorage.

---

## 🔌 API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Full system status (agents, metrics, activity) |
| `/api/subagents` | GET | List all subagents with current stats |
| `/api/subagents/:id` | GET | Detailed info for specific agent |
| `/api/metrics` | GET | System metrics only |
| `/api/activity` | GET | Recent activity log |
| `/api/reports` | GET | List available reports |
| `/api/health` | GET | Health check |

### Action Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/actions/spawn` | POST | Create new subagent |
| `/api/actions/health-check` | POST | Run system health check |
| `/api/actions/settings` | POST | Update settings |

### Example Response

```json
GET /api/status
{
  "success": true,
  "timestamp": "2026-02-24T14:30:00Z",
  "responseTime": 12,
  "data": {
    "subagents": {
      "pixel": {
        "name": "PIXEL",
        "type": "WEB DESIGN",
        "icon": "🎨",
        "hp": 85,
        "status": "active",
        "lastActive": "2026-02-24"
      },
      ...
    },
    "metrics": {
      "uptime": "14:32:10",
      "gatewayStatus": "online",
      "apiLatency": 23,
      "activeAgents": 5,
      "recentFiles": 12
    },
    "activityLog": [...],
    "systemStatus": "ONLINE"
  }
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Frontend)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dashboard  │  │  API Client │  │  Real-time Updates  │  │
│  │   (HTML)    │  │   (Fetch)   │  │   (setInterval)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NODE.JS SERVER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Express   │  │  File Watch │  │   Cron Jobs         │  │
│  │    API      │  │  (Skill Log)│  │  (30s updates)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Read Files / Exec Commands
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Skill Logs  │  │Memory State │  │  OpenClaw Gateway   │  │
│  │  (*.md)     │  │  (*.json)   │  │   (CLI status)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎮 Subagent Status Meanings

| Status | HP Range | Meaning |
|--------|----------|---------|
| 🟢 Active | 70-100 | Agent has recent completed tasks |
| 🟡 Busy | 40-69 | Agent has some activity but not fully active |
| 🔴 Idle | 10-39 | Agent has minimal recent activity |
| ⚫ Offline | <10 | Agent hasn't been active for 3+ days |

---

## 🚢 Deployment

### Option 1: Self-Hosted (Local)
```bash
npm start
# Access at http://localhost:3001
```

### Option 2: Render/Railway/Vercel
1. Push code to GitHub
2. Connect to Render/Railway/Vercel
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Deploy!

### Option 3: GitHub Pages (Frontend Only)
For static hosting of just the frontend:
```bash
cd public
# Deploy contents to GitHub Pages
```

**Note**: If using GitHub Pages, you'll need to host the backend separately or use a serverless function.

---

## 🔧 Customization

### Adding New Subagents
Edit `SUBAGENTS` object in `server.js`:
```javascript
const SUBAGENTS = {
  newagent: {
    name: 'NEWAGENT',
    type: 'RESEARCH',
    icon: '🔬',
    skillLog: 'newagent-skill-log.md',
    description: 'Description here'
  }
};
```

### Changing Refresh Rate
The backend updates data every 30 seconds (cron job). Frontend refresh is configurable via Settings.

### Styling
Edit CSS variables in `public/index.html`:
```css
:root {
  --pokemon-red: #CC0000;
  --gameboy-green: #8BAC0F;
  /* ... */
}
```

---

## 📝 File Structure

```
silph-command-center/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── README.md             # This file
└── public/
    └── index.html        # Dashboard frontend
```

---

## 🤝 Credits

- **Design**: Inspired by Pokémon Fire Red/Leaf Green GBA interface
- **Fonts**: Press Start 2P, VT323 (Google Fonts)
- **Built with**: Node.js, Express, vanilla JavaScript

---

## 📄 License

MIT License - Feel free to use and modify!

---

**Made with 🔥 by Pixel @ Silph Labs**

*"Gotta monitor 'em all!"*