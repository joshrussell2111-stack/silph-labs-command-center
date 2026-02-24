# 🚀 Deployment Guide

## Local Deployment (Recommended for Private Use)

### Quick Start
```bash
cd silph-command-center
./start.sh
# Server runs on http://localhost:3001
```

### Development Mode (Auto-reload)
```bash
./dev.sh
# Or: npm run dev
```

---

## Production Deployment Options

### Option 1: Render.com (Free Tier Available)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Silph Labs Command Center"
   git remote add origin https://github.com/YOUR_USERNAME/silph-command-center.git
   git push -u origin main
   ```

2. **Deploy to Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name**: silph-command-center
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       - `WORKSPACE`: `/opt/render/project/src` (or leave default)
       - `PORT`: `3001` (Render provides this automatically)
   - Click "Create Web Service"
   - Your dashboard will be live at: `https://silph-command-center.onrender.com`

3. **Update Frontend API URL**
   - After deployment, update the frontend to point to your Render URL
   - Go to Settings in the dashboard and change API URL to your Render URL

---

### Option 2: Railway.app

1. **Install Railway CLI** (optional)
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy**
   ```bash
   railway init
   railway up
   ```

3. **Or use the web UI**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository
   - Railway auto-detects Node.js and deploys

---

### Option 3: Vercel (Frontend + Serverless Functions)

Vercel is better suited for static sites. For this full Node.js app, use Render or Railway.

However, you can split the deployment:
- **Frontend**: Deploy `public/` to Vercel/GitHub Pages/Netlify
- **Backend**: Deploy server to Render/Railway

---

### Option 4: Self-Hosted (VPS/Cloud)

If you have a VPS (DigitalOcean, Linode, AWS EC2):

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone and Setup**
   ```bash
   git clone https://github.com/YOUR_USERNAME/silph-command-center.git
   cd silph-command-center
   npm install
   ```

3. **Run with PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name silph-command-center
   pm2 save
   pm2 startup
   ```

4. **Set up Nginx reverse proxy** (optional but recommended)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env file (optional - defaults work for local)
PORT=3001
WORKSPACE=/path/to/.openclaw/workspace
```

### For Production
- Set `WORKSPACE` to the path where your OpenClaw workspace is accessible
- If deploying remotely, you may need to sync skill logs to the server

---

## Accessing the Dashboard

### Local
- Dashboard: http://localhost:3001
- API: http://localhost:3001/api/status

### Production
- Dashboard: https://your-app.onrender.com
- API: https://your-app.onrender.com/api/status

---

## Monitoring & Maintenance

### Health Check
```bash
curl http://localhost:3001/api/health
```

### View Logs
```bash
# Local
npm start # shows logs in terminal

# PM2
pm2 logs silph-command-center

# Render/Railway
Check the web dashboard for logs
```

### Update Data Refresh Rate
- Click **Settings** in the dashboard
- Change refresh rate (5s, 10s, 30s, 60s)
- Server updates every 30 seconds (configured in server.js)

---

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3001
# Kill the process if needed
kill -9 <PID>
```

### API returns empty data
- Verify `WORKSPACE` path is correct
- Check that skill logs exist: `ls ~/.openclaw/workspace/*-skill-log.md`
- Check server logs for parsing errors

### Frontend shows "OFFLINE"
- Verify server is running: `curl http://localhost:3001/api/health`
- Check browser console for CORS errors
- Verify API URL in Settings matches your server URL

### WebSocket connection fails
- WebSocket is optional - the dashboard works fine with polling
- If behind a reverse proxy, ensure WebSocket headers are forwarded

---

## Security Considerations

### For Public Deployment
If deploying publicly, consider:
- **Authentication**: Add basic auth or OAuth
- **Rate Limiting**: Prevent API abuse
- **HTTPS**: Use SSL certificates (Render/Railway provide this automatically)
- **Environment Variables**: Never commit sensitive data

### For Private Use
- Keep it on localhost or behind a VPN
- No authentication needed for personal use

---

## Customization

### Change Port
```bash
PORT=4000 npm start
# Or edit package.json
```

### Add New Subagents
Edit `SUBAGENTS` in `server.js`:
```javascript
myagent: {
  name: 'MYAGENT',
  type: 'CUSTOM',
  icon: '🤖',
  skillLog: 'myagent-skill-log.md',
  description: 'My custom agent'
}
```

### Change Theme Colors
Edit CSS variables in `public/index.html`:
```css
:root {
  --pokemon-red: #CC0000;
  --gameboy-green: #8BAC0F;
  /* ... */
}
```

---

## Need Help?

- Check the [README.md](README.md) for API documentation
- Open an issue on GitHub
- Contact Pixel @ Silph Labs 🎨