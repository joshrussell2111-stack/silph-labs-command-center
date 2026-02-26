# OpenClaw Control Dashboard v2

A polished, user-friendly dashboard for managing OpenClaw AI settings with a focus on simplicity and clarity.

![Dashboard](https://img.shields.io/badge/Dashboard-Dark%20Theme-2196F3)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)

## 🎯 Features

### Main Dashboard
- **Connection Status** - Real-time gateway connectivity indicator
- **Current AI Model Card** - Prominent display with speed & pricing info
- **System Health Widget** - Gateway status, active assistants, scheduled tasks
- **Recent Activity Widget** - Last 5 system events

### Model Change Wizard
A 4-step wizard for changing AI models:

1. **Selection Screen** - Browse available models with clear pricing & speed indicators
2. **Confirmation** - Review changes before applying
3. **Loading State** - Visual feedback during the switch
4. **Success/Error** - Clear outcome messaging

## 🚀 Live Demo

Deploy to Render:
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/openclaw-control-v2)

Or deploy manually:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy dist/ folder to any static host
```

## 🛠️ Development

```bash
# Clone the repository
git clone <repo-url>
cd openclaw-control-v2

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
openclaw-control-v2/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── render.yaml             # Render deployment config
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Main app component
│   ├── styles.css          # Dark theme styles
│   └── components/
│       ├── Dashboard.jsx       # Main dashboard layout
│       ├── ModelWizard.jsx     # 4-step model switcher
│       ├── ModelCard.jsx       # Individual model card
│       ├── StatusWidget.jsx    # System status display
│       └── ActivityWidget.jsx  # Recent activity feed
```

## 🎨 Design Principles

1. **Icons + Text** - Never icons alone
2. **Simple Language** - "Fast" not "Low latency"
3. **Two-tap Actions** - Select → Confirm
4. **Clear Feedback** - Loading states, success messages
5. **Friendly Errors** - Helpful, not scary

## 🔌 API Integration

The dashboard expects these endpoints:

```javascript
// Get current model
GET /api/models/current

// Get available models
GET /api/models/available

// Switch model
POST /api/models/switch
Body: { modelId: string }
```

Mock data is used when endpoints are unavailable.

## 📝 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **CSS** - Styling (no framework)
- **Fetch API** - HTTP requests

## 🏗️ Build

```bash
npm run build
```

Output goes to `dist/` folder - ready for any static host.

## 📱 Responsive

Fully responsive design:
- Desktop: Multi-column layout
- Tablet: Adjusted grid
- Mobile: Stacked cards, full-width buttons

## 🎨 Colors

- Background: `#0d1117` (near-black)
- Cards: `#1c2128` (dark gray)
- Primary: `#2196F3` (blue)
- Success: `#4CAF50` (green)
- Error: `#f85149` (red)

## 📄 License

MIT