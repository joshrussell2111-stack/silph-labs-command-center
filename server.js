/**
 * Silph Co. Command Center - Backend API
 * Serves real-time data about subagents, system metrics, and activity
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const WebSocket = require('ws');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';  // Allow local network access
const WORKSPACE = process.env.WORKSPACE || '/Users/joshrussell/.openclaw/workspace';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory state storage
let systemState = {
  subagents: {},
  metrics: {},
  activityLog: [],
  lastUpdate: Date.now(),
  uptime: 0
};

// Subagent definitions with their skill log files
const SUBAGENTS = {
  pixel: {
    name: 'PIXEL',
    type: 'WEB DESIGN',
    icon: '🎨',
    skillLog: 'pixel-skill-log.md',
    description: 'UI/UX Design, Web Development, Visual Systems'
  },
  meridian: {
    name: 'MERIDIAN',
    type: 'FINANCE',
    icon: '📈',
    skillLog: 'meridian-skill-log.md',
    description: 'Financial Analysis, Investment Research, Market Intelligence'
  },
  scout: {
    name: 'SCOUT',
    type: 'RESEARCH',
    icon: '🕵️',
    skillLog: null, // Scout might not have a skill log yet
    description: 'Market Research, Data Gathering, Intelligence'
  },
  aperture: {
    name: 'APERTURE',
    type: 'VISUALS',
    icon: '📸',
    skillLog: 'aperture-skill-log.md',
    description: 'Image Generation, Visual Analysis, Media Processing'
  },
  cipher: {
    name: 'CIPHER',
    type: 'MODEL INTEL',
    icon: '🔐',
    skillLog: null, // Cipher might not have a skill log yet
    description: 'AI Model Intelligence, Security, Data Protection'
  }
};

// Activity log entries (persisted to memory)
const MAX_LOG_ENTRIES = 50;

/**
 * Parse skill log file to extract activities
 * Handles multiple formats: task lists, dated entries, or general content
 */
function parseSkillLog(agentKey) {
  const agent = SUBAGENTS[agentKey];
  if (!agent || !agent.skillLog) return [];
  
  const logPath = path.join(WORKSPACE, agent.skillLog);
  if (!fs.existsSync(logPath)) return [];
  
  try {
    const content = fs.readFileSync(logPath, 'utf8');
    const activities = [];
    const lines = content.split('\n');
    
    let currentEntry = null;
    const today = new Date().toISOString().split('T')[0];
    
    for (const line of lines) {
      // Look for date headers like "## 2026-02-22" or "**Date:** February 24, 2026"
      const dateMatch = line.match(/^(##\s+|\*\*Date:\*\*\s*)([A-Za-z]+ \d{1,2}, \d{4}|\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        if (currentEntry) activities.push(currentEntry);
        const parsedDate = new Date(dateMatch[2]);
        currentEntry = {
          date: isNaN(parsedDate) ? today : parsedDate.toISOString().split('T')[0],
          agent: agent.name,
          tasks: []
        };
      }
      
      // Look for task entries like "- [x] Task description"
      const taskMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
      if (taskMatch && currentEntry) {
        currentEntry.tasks.push({
          completed: taskMatch[1] === 'x',
          description: taskMatch[2].trim()
        });
      }
      
      // Look for skills added/learned
      const skillMatch = line.match(/^(\d+\.\s+)?\*\*(.+?)\*\*.*(?:Skill|skill|installed|added)/);
      if (skillMatch && currentEntry) {
        currentEntry.tasks.push({
          completed: true,
          description: `Learned skill: ${skillMatch[2].trim()}`
        });
      }
    }
    
    if (currentEntry) activities.push(currentEntry);
    
    // If no dated entries found, create one from file modification time
    if (activities.length === 0) {
      const stats = fs.statSync(logPath);
      activities.push({
        date: stats.mtime.toISOString().split('T')[0],
        agent: agent.name,
        tasks: [{ completed: true, description: 'Skill log updated' }]
      });
    }
    
    return activities;
  } catch (err) {
    console.error(`Error parsing skill log for ${agentKey}:`, err.message);
    return [];
  }
}

/**
 * Calculate agent activity level based on recent tasks and file activity
 */
function calculateActivityLevel(agentKey) {
  const agent = SUBAGENTS[agentKey];
  const activities = parseSkillLog(agentKey);
  
  // Get file modification time as fallback activity indicator
  let fileActivity = null;
  if (agent && agent.skillLog) {
    const logPath = path.join(WORKSPACE, agent.skillLog);
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      fileActivity = stats.mtime;
    }
  }
  
  // Get today's and yesterday's date
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(now - 86400000).toISOString().split('T')[0];
  
  let recentTasks = 0;
  let completedTasks = 0;
  let lastActive = fileActivity ? fileActivity.toISOString().split('T')[0] : null;
  
  for (const entry of activities) {
    if (entry.date === today || entry.date === yesterday) {
      recentTasks += entry.tasks.length;
      completedTasks += entry.tasks.filter(t => t.completed).length;
      if (!lastActive && entry.tasks.length > 0) {
        lastActive = entry.date;
      }
    }
  }
  
  // Calculate days since last activity
  const lastActiveDate = lastActive ? new Date(lastActive) : null;
  const daysSinceActive = lastActiveDate ? (now - lastActiveDate.getTime()) / 86400000 : 999;
  
  // Base activity level on file/task activity
  let level = 30; // Base level
  
  // Add points for recent tasks
  level += Math.min(40, completedTasks * 10);
  level += Math.min(20, recentTasks * 2);
  
  // Boost for very recent file activity (within 24 hours)
  if (daysSinceActive < 1) {
    level += 20;
  } else if (daysSinceActive < 2) {
    level += 10;
  }
  
  level = Math.min(100, level);
  
  // Determine status based on activity level and recency
  let status = 'idle';
  if (daysSinceActive < 1 && level >= 70) status = 'active';
  else if (daysSinceActive < 2 && level >= 40) status = 'busy';
  else if (daysSinceActive > 3) status = 'offline';
  
  // Adjust level for offline agents
  if (status === 'offline') {
    level = Math.max(10, level - 40);
  }
  
  return { level: Math.round(level), status, lastActive };
}

/**
 * Get system metrics (uptime, load, etc.)
 */
function getSystemMetrics() {
  try {
    // Get system uptime
    let uptime = '00:00:00';
    try {
      const uptimeSeconds = parseInt(execSync('uptime | awk \'{print $3}\' | sed \'s/,//\'', { encoding: 'utf8', timeout: 5000 }).trim()) * 3600;
      const hrs = Math.floor(uptimeSeconds / 3600).toString().padStart(2, '0');
      const mins = Math.floor((uptimeSeconds % 3600) / 60).toString().padStart(2, '0');
      const secs = Math.floor(uptimeSeconds % 60).toString().padStart(2, '0');
      uptime = `${hrs}:${mins}:${secs}`;
    } catch (e) {
      uptime = process.uptime ? 
        `${Math.floor(process.uptime() / 3600).toString().padStart(2, '0')}:${Math.floor((process.uptime() % 3600) / 60).toString().padStart(2, '0')}:${Math.floor(process.uptime() % 60).toString().padStart(2, '0')}` 
        : '00:00:00';
    }
    
    // Check OpenClaw gateway status
    let gatewayStatus = 'unknown';
    try {
      execSync('openclaw gateway status', { timeout: 3000 });
      gatewayStatus = 'online';
    } catch (e) {
      gatewayStatus = 'offline';
    }
    
    // Get memory state
    let memoryState = {};
    try {
      const heartbeatPath = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');
      if (fs.existsSync(heartbeatPath)) {
        memoryState = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Count recent files (activity indicator)
    let recentFiles = 0;
    try {
      const files = fs.readdirSync(WORKSPACE);
      const now = Date.now();
      for (const file of files.slice(0, 50)) {
        try {
          const stats = fs.statSync(path.join(WORKSPACE, file));
          if (now - stats.mtime.getTime() < 86400000) {
            recentFiles++;
          }
        } catch (e) {}
      }
    } catch (e) {}
    
    return {
      uptime,
      gatewayStatus,
      apiLatency: Math.floor(Math.random() * 50) + 10, // Simulated for now
      activeAgents: Object.keys(SUBAGENTS).length,
      recentFiles,
      lastHeartbeat: memoryState.lastHeartbeat || null,
      memoryChecks: memoryState.lastChecks || {}
    };
  } catch (err) {
    console.error('Error getting system metrics:', err.message);
    return {
      uptime: '00:00:00',
      gatewayStatus: 'unknown',
      apiLatency: 0,
      activeAgents: 0,
      recentFiles: 0,
      error: err.message
    };
  }
}

/**
 * Generate activity log from all sources
 */
function generateActivityLog() {
  const log = [];
  const now = new Date();
  
  // Add entries from skill logs
  for (const [key, agent] of Object.entries(SUBAGENTS)) {
    const activities = parseSkillLog(key);
    for (const entry of activities.slice(0, 3)) { // Last 3 days per agent
      for (const task of entry.tasks.slice(0, 5)) { // Last 5 tasks per day
        if (task.completed) {
          log.push({
            time: entry.date,
            timestamp: new Date(entry.date).getTime(),
            agent: agent.name,
            icon: agent.icon,
            text: task.description,
            type: 'task_complete'
          });
        }
      }
    }
  }
  
  // Sort by timestamp (newest first) and take top entries
  log.sort((a, b) => b.timestamp - a.timestamp);
  
  // If no activity found, add system messages
  if (log.length === 0) {
    log.push({
      time: now.toISOString().split('T')[0],
      timestamp: now.getTime(),
      agent: 'SYSTEM',
      icon: '⚙️',
      text: 'System initialized. Monitoring agents...',
      type: 'system'
    });
  }
  
  return log.slice(0, MAX_LOG_ENTRIES);
}

/**
 * Load synced data from data.json (for cloud deployment)
 */
function loadSyncedData() {
  try {
    const dataPath = path.join(__dirname, 'public', 'data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return data;
    }
  } catch (err) {
    console.error('Error loading synced data:', err.message);
  }
  return null;
}

/**
 * Check if running on Render (cloud) vs local
 */
function isCloudDeployment() {
  return process.env.RENDER === 'true' || 
         process.env.RENDER_EXTERNAL_HOSTNAME ||
         !fs.existsSync(WORKSPACE);
}

/**
 * Update system state (called periodically)
 */
function updateSystemState() {
  // If running in cloud, use synced data
  if (isCloudDeployment()) {
    const syncedData = loadSyncedData();
    if (syncedData) {
      systemState.subagents = syncedData.subagents || {};
      systemState.metrics = syncedData.metrics || {};
      systemState.activityLog = syncedData.activityLog || [];
      systemState.lastUpdate = Date.now();
      systemState.uptime += 30;
      console.log(`[${new Date().toISOString()}] System state updated from synced data`);
      return;
    }
  }
  
  // Local deployment - read from filesystem
  // Update subagent data
  for (const [key, agent] of Object.entries(SUBAGENTS)) {
    const activity = calculateActivityLevel(key);
    systemState.subagents[key] = {
      ...agent,
      activityLevel: activity.level,
      status: activity.status,
      lastActive: activity.lastActive,
      hp: activity.level, // For HP bar display
      maxHp: 100
    };
  }
  
  // Update metrics
  systemState.metrics = getSystemMetrics();
  
  // Update activity log
  systemState.activityLog = generateActivityLog();
  
  // Update timestamps
  systemState.lastUpdate = Date.now();
  systemState.uptime += 30;
  
  console.log(`[${new Date().toISOString()}] System state updated from local files`);
}

// Initial state update
updateSystemState();

// Schedule updates every 30 seconds
cron.schedule('*/30 * * * * *', updateSystemState);

// API Routes

/**
 * GET /api/status - Main status endpoint
 */
app.get('/api/status', (req, res) => {
  const startTime = Date.now();
  
  // In cloud mode, reload from data.json on each request for live updates
  let data;
  if (isCloudDeployment()) {
    const syncedData = loadSyncedData();
    if (syncedData) {
      data = {
        subagents: syncedData.subagents,
        metrics: syncedData.metrics,
        activityLog: syncedData.activityLog,
        systemStatus: syncedData.systemStatus || 'ONLINE'
      };
    } else {
      data = {
        subagents: systemState.subagents,
        metrics: systemState.metrics,
        activityLog: systemState.activityLog,
        systemStatus: systemState.metrics.gatewayStatus === 'online' ? 'ONLINE' : 'DEGRADED'
      };
    }
  } else {
    data = {
      subagents: systemState.subagents,
      metrics: systemState.metrics,
      activityLog: systemState.activityLog,
      systemStatus: systemState.metrics.gatewayStatus === 'online' ? 'ONLINE' : 'DEGRADED'
    };
  }
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    data: data
  });
});

/**
 * GET /api/subagents - List all subagents
 */
app.get('/api/subagents', (req, res) => {
  res.json({
    success: true,
    data: systemState.subagents
  });
});

/**
 * GET /api/subagents/:id - Get specific subagent details
 */
app.get('/api/subagents/:id', (req, res) => {
  const agent = systemState.subagents[req.params.id.toLowerCase()];
  if (!agent) {
    return res.status(404).json({ success: false, error: 'Subagent not found' });
  }
  
  // Get detailed activity history
  const activities = parseSkillLog(req.params.id.toLowerCase());
  
  res.json({
    success: true,
    data: {
      ...agent,
      history: activities
    }
  });
});

/**
 * GET /api/metrics - System metrics only
 */
app.get('/api/metrics', (req, res) => {
  res.json({
    success: true,
    data: systemState.metrics
  });
});

/**
 * GET /api/activity - Activity log
 */
app.get('/api/activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json({
    success: true,
    data: systemState.activityLog.slice(0, limit)
  });
});

/**
 * POST /api/actions/spawn - Spawn a new subagent
 */
app.post('/api/actions/spawn', (req, res) => {
  const { name, type, description } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'Name and type required' });
  }
  
  // In a real implementation, this would actually spawn a subagent
  // For now, we just add it to the state
  const key = name.toLowerCase().replace(/\s+/g, '_');
  
  const newAgent = {
    name: name.toUpperCase(),
    type: type.toUpperCase(),
    icon: '🆕',
    description: description || 'New subagent',
    activityLevel: 0,
    status: 'idle',
    hp: 0,
    maxHp: 100,
    createdAt: new Date().toISOString()
  };
  
  systemState.subagents[key] = newAgent;
  
  // Add to activity log
  systemState.activityLog.unshift({
    time: new Date().toISOString(),
    timestamp: Date.now(),
    agent: 'SYSTEM',
    icon: '🆕',
    text: `New subagent ${name.toUpperCase()} spawned!`,
    type: 'agent_spawned'
  });
  
  res.json({
    success: true,
    message: `Subagent ${name.toUpperCase()} spawned successfully`,
    data: newAgent
  });
});

/**
 * POST /api/actions/health-check - Run system health check
 */
app.post('/api/actions/health-check', (req, res) => {
  const checks = {
    gateway: systemState.metrics.gatewayStatus === 'online',
    agents: Object.values(systemState.subagents).filter(a => a.status !== 'offline').length,
    diskSpace: true, // Would check actual disk space in production
    memory: true
  };
  
  const allHealthy = Object.values(checks).every(v => v === true || typeof v === 'number');
  
  // Add to activity log
  systemState.activityLog.unshift({
    time: new Date().toISOString(),
    timestamp: Date.now(),
    agent: 'SYSTEM',
    icon: '🏥',
    text: `Health check completed. Status: ${allHealthy ? 'HEALTHY' : 'ISSUES DETECTED'}`,
    type: 'health_check'
  });
  
  res.json({
    success: true,
    healthy: allHealthy,
    checks,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/actions/settings - Update settings
 */
app.post('/api/actions/settings', (req, res) => {
  const { refreshRate, notifications, theme } = req.body;
  
  // In production, this would persist settings
  res.json({
    success: true,
    message: 'Settings updated',
    settings: { refreshRate, notifications, theme }
  });
});

/**
 * GET /api/reports - List available reports
 */
app.get('/api/reports', (req, res) => {
  try {
    const files = fs.readdirSync(WORKSPACE);
    const reports = files
      .filter(f => f.endsWith('.html') || f.endsWith('.pdf') || f.endsWith('.md'))
      .filter(f => f.includes('report') || f.includes('analysis') || f.includes('presentation'))
      .map(f => {
        const stats = fs.statSync(path.join(WORKSPACE, f));
        return {
          name: f,
          size: stats.size,
          modified: stats.mtime,
          type: path.extname(f)
        };
      })
      .sort((a, b) => b.modified - a.modified)
      .slice(0, 10);
    
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🏢 SILPH CO. COMMAND CENTER v1.0                    ║
║                                                          ║
║     Mission Control Server Running!                      ║
║                                                          ║
║     📊 Local Dashboard: http://localhost:${PORT}            ║
║     🌐 Network Dashboard: http://${HOST}:${PORT}            ║
║     🔌 API Endpoint: http://${HOST}:${PORT}/api/status      ║
║                                                          ║
║     Subagents monitored: ${Object.keys(SUBAGENTS).length}                              ║
║     Workspace: ${WORKSPACE}    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// WebSocket server for real-time updates (optional)
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'state',
    data: systemState
  }));
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {
      // Ignore malformed messages
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Broadcast updates to all connected clients
function broadcastUpdate() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'update',
        data: systemState,
        timestamp: Date.now()
      }));
    }
  });
}

// Schedule broadcasts
setInterval(broadcastUpdate, 10000); // Every 10 seconds

module.exports = { app, server };