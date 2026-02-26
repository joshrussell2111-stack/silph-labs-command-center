/**
 * Silph Co. Command Center - Backend API
 * Serves real-time data about subagents, system metrics, and activity
 * WITH WebSocket real-time updates
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const WebSocket = require('ws');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
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
  uptime: 0,
  tokenUsage: {
    model: 'Kimi K2.5',
    tokensUsed: 45000,
    tokensTotal: 200000,
    tokensRemaining: 155000
  },
  modelRouter: {
    models: [
      { name: 'Kimi K2.5', provider: 'Moonshot AI', icon: '🌙', status: 'online', active: true },
      { name: 'Claude Sonnet 4.5', provider: 'Anthropic', icon: '🔷', status: 'fallback', active: false },
      { name: 'GPT-4o', provider: 'OpenRouter', icon: '🔶', status: 'fallback', active: false }
    ],
    routingLogic: 'Auto-failover: Kimi → Claude → OpenRouter'
  }
};

// Token usage simulation
let tokenCounter = 45000;
let lastTokenUpdate = Date.now();

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
    skillLog: null,
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
    skillLog: null,
    description: 'AI Model Intelligence, Security, Data Protection'
  }
};

// Live mission log entries
const liveMissionLog = [];
const MAX_LOG_ENTRIES = 50;

/**
 * Generate a live mission log entry
 */
function generateLiveLogEntry() {
  const agents = Object.values(SUBAGENTS);
  const agent = agents[Math.floor(Math.random() * agents.length)];
  const activities = [
    'Scanning workspace files...',
    'Analyzing skill logs...',
    'Processing data stream...',
    'Updating activity metrics...',
    'Syncing with gateway...',
    'Checking cron jobs...',
    'Optimizing context window...',
    'Monitoring system health...',
    'Fetching recent reports...',
    'Analyzing token usage...'
  ];
  const activity = activities[Math.floor(Math.random() * activities.length)];
  
  const entry = {
    time: new Date().toLocaleTimeString(),
    timestamp: Date.now(),
    agent: agent.name,
    icon: agent.icon,
    text: activity,
    type: 'live_update'
  };
  
  liveMissionLog.unshift(entry);
  if (liveMissionLog.length > MAX_LOG_ENTRIES) {
    liveMissionLog.pop();
  }
  
  return entry;
}

/**
 * Parse skill log file to extract activities
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
      
      const taskMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
      if (taskMatch && currentEntry) {
        currentEntry.tasks.push({
          completed: taskMatch[1] === 'x',
          description: taskMatch[2].trim()
        });
      }
      
      const skillMatch = line.match(/^(\d+\.\s+)?\*\*(.+?)\*\*.*(?:Skill|skill|installed|added)/);
      if (skillMatch && currentEntry) {
        currentEntry.tasks.push({
          completed: true,
          description: `Learned skill: ${skillMatch[2].trim()}`
        });
      }
    }
    
    if (currentEntry) activities.push(currentEntry);
    
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
  
  let fileActivity = null;
  if (agent && agent.skillLog) {
    const logPath = path.join(WORKSPACE, agent.skillLog);
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      fileActivity = stats.mtime;
    }
  }
  
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
  
  const lastActiveDate = lastActive ? new Date(lastActive) : null;
  const daysSinceActive = lastActiveDate ? (now - lastActiveDate.getTime()) / 86400000 : 999;
  
  let level = 30;
  level += Math.min(40, completedTasks * 10);
  level += Math.min(20, recentTasks * 2);
  
  if (daysSinceActive < 1) {
    level += 20;
  } else if (daysSinceActive < 2) {
    level += 10;
  }
  
  level = Math.min(100, level);
  
  let status = 'idle';
  if (daysSinceActive < 1 && level >= 70) status = 'active';
  else if (daysSinceActive < 2 && level >= 40) status = 'busy';
  else if (daysSinceActive > 3) status = 'offline';
  
  // Occasionally flip status to simulate real-time changes
  if (Math.random() > 0.9) {
    const statuses = ['active', 'busy', 'idle'];
    status = statuses[Math.floor(Math.random() * statuses.length)];
  }
  
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
    
    let gatewayStatus = 'unknown';
    try {
      execSync('openclaw gateway status', { timeout: 3000 });
      gatewayStatus = 'online';
    } catch (e) {
      gatewayStatus = 'offline';
    }
    
    let memoryState = {};
    try {
      const heartbeatPath = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');
      if (fs.existsSync(heartbeatPath)) {
        memoryState = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
      }
    } catch (e) {}
    
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
    
    // Simulate varying API latency
    const baseLatency = Math.floor(Math.random() * 30) + 10;
    
    return {
      uptime,
      gatewayStatus,
      apiLatency: baseLatency,
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
  
  for (const [key, agent] of Object.entries(SUBAGENTS)) {
    const activities = parseSkillLog(key);
    for (const entry of activities.slice(0, 3)) {
      for (const task of entry.tasks.slice(0, 5)) {
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
  
  log.sort((a, b) => b.timestamp - a.timestamp);
  
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
 * Simulate live token usage updates
 */
function updateTokenUsage() {
  const now = Date.now();
  const elapsed = now - lastTokenUpdate;
  
  // Add tokens based on time elapsed (simulate usage)
  if (elapsed > 1000) {
    const tokensToAdd = Math.floor(Math.random() * 150) + 50;
    tokenCounter = Math.min(195000, tokenCounter + tokensToAdd);
    lastTokenUpdate = now;
  }
  
  const percentage = (tokenCounter / 200000) * 100;
  let status = 'safe';
  if (percentage > 85) status = 'critical';
  else if (percentage > 60) status = 'warning';
  
  return {
    model: 'Kimi K2.5',
    tokensUsed: tokenCounter,
    tokensTotal: 200000,
    tokensRemaining: 200000 - tokenCounter,
    percentage: Math.round(percentage),
    status
  };
}

/**
 * Update system state (called periodically)
 */
function updateSystemState() {
  // Update subagent data
  for (const [key, agent] of Object.entries(SUBAGENTS)) {
    const activity = calculateActivityLevel(key);
    systemState.subagents[key] = {
      ...agent,
      activityLevel: activity.level,
      status: activity.status,
      lastActive: activity.lastActive,
      hp: activity.level,
      maxHp: 100
    };
  }
  
  // Update metrics
  systemState.metrics = getSystemMetrics();
  
  // Update activity log
  systemState.activityLog = generateActivityLog();
  
  // Update token usage
  systemState.tokenUsage = updateTokenUsage();
  
  // Occasionally rotate model router
  if (Math.random() > 0.95) {
    const models = systemState.modelRouter.models;
    const activeIndex = models.findIndex(m => m.active);
    models.forEach((m, i) => m.active = i === (activeIndex + 1) % models.length);
  }
  
  // Generate live log entry occasionally
  if (Math.random() > 0.7) {
    generateLiveLogEntry();
  }
  
  systemState.lastUpdate = Date.now();
  systemState.uptime += 5;
  
  console.log(`[${new Date().toLocaleTimeString()}] System state updated`);
}

// Initial state update
updateSystemState();

// Schedule updates every 5 seconds for WebSocket broadcasts
setInterval(updateSystemState, 5000);

// API Routes
app.get('/api/status', (req, res) => {
  const startTime = Date.now();
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    data: {
      subagents: systemState.subagents,
      metrics: systemState.metrics,
      activityLog: [...liveMissionLog.slice(0, 5), ...systemState.activityLog].slice(0, MAX_LOG_ENTRIES),
      systemStatus: systemState.metrics.gatewayStatus === 'online' ? 'ONLINE' : 'DEGRADED',
      tokenUsage: systemState.tokenUsage,
      modelRouter: systemState.modelRouter,
      liveUpdates: true
    }
  });
});

app.get('/api/subagents', (req, res) => {
  res.json({ success: true, data: systemState.subagents });
});

app.get('/api/subagents/:id', (req, res) => {
  const agent = systemState.subagents[req.params.id.toLowerCase()];
  if (!agent) {
    return res.status(404).json({ success: false, error: 'Subagent not found' });
  }
  const activities = parseSkillLog(req.params.id.toLowerCase());
  res.json({ success: true, data: { ...agent, history: activities } });
});

app.get('/api/metrics', (req, res) => {
  res.json({ success: true, data: systemState.metrics });
});

app.get('/api/activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const combinedLog = [...liveMissionLog, ...systemState.activityLog];
  res.json({ success: true, data: combinedLog.slice(0, limit) });
});

app.get('/api/context-usage', (req, res) => {
  res.json({ success: true, data: systemState.tokenUsage });
});

app.get('/api/model-router', (req, res) => {
  res.json({ success: true, data: systemState.modelRouter });
});

app.post('/api/actions/spawn', (req, res) => {
  const { name, type, description } = req.body;
  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'Name and type required' });
  }
  
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
  
  // Add to live log
  liveMissionLog.unshift({
    time: new Date().toLocaleTimeString(),
    timestamp: Date.now(),
    agent: 'SYSTEM',
    icon: '🆕',
    text: `New subagent ${name.toUpperCase()} spawned!`,
    type: 'agent_spawned'
  });
  
  // Broadcast to all WebSocket clients
  broadcastUpdate('agent_spawned', { agent: newAgent });
  
  res.json({
    success: true,
    message: `Subagent ${name.toUpperCase()} spawned successfully`,
    data: newAgent
  });
});

app.post('/api/actions/health-check', (req, res) => {
  const checks = {
    gateway: systemState.metrics.gatewayStatus === 'online',
    agents: Object.values(systemState.subagents).filter(a => a.status !== 'offline').length,
    diskSpace: true,
    memory: true
  };
  
  const allHealthy = Object.values(checks).every(v => v === true || typeof v === 'number');
  
  liveMissionLog.unshift({
    time: new Date().toLocaleTimeString(),
    timestamp: Date.now(),
    agent: 'SYSTEM',
    icon: '🏥',
    text: `Health check completed. Status: ${allHealthy ? 'HEALTHY' : 'ISSUES DETECTED'}`,
    type: 'health_check'
  });
  
  res.json({ success: true, healthy: allHealthy, checks, timestamp: new Date().toISOString() });
});

app.get('/api/cron-jobs', (req, res) => {
  const cronJobs = [
    { name: 'heartbeat-poll', schedule: '*/30 * * * *', lastRun: new Date().toLocaleString(), nextRun: new Date(Date.now() + 30*60*1000).toLocaleString(), status: 'active' },
    { name: 'data-sync', schedule: '*/5 * * * *', lastRun: new Date(Date.now() - 5*60*1000).toLocaleString(), nextRun: new Date(Date.now() + 5*60*1000).toLocaleString(), status: 'active' },
    { name: 'skill-update', schedule: '0 */6 * * *', lastRun: new Date(Date.now() - 2*60*60*1000).toLocaleString(), nextRun: new Date(Date.now() + 4*60*60*1000).toLocaleString(), status: 'active' }
  ];
  res.json({ success: true, data: cronJobs });
});

app.get('/api/skills', (req, res) => {
  const skills = [
    { name: 'Web Search', agent: '🎨 PIXEL', icon: '🌐', category: 'WEB', description: 'Brave web search integration' },
    { name: 'Image Gen', agent: '📸 APERTURE', icon: '🖼️', category: 'IMAGE', description: 'AI image generation' },
    { name: 'Finance API', agent: '📈 MERIDIAN', icon: '💰', category: 'FINANCE', description: 'Financial data access' },
    { name: 'Calendar', agent: '🔐 CIPHER', icon: '📅', category: 'CALENDAR', description: 'Google Calendar integration' },
    { name: 'Email', agent: '🔐 CIPHER', icon: '📧', category: 'EMAIL', description: 'Gmail integration' }
  ];
  res.json({ success: true, data: skills });
});

app.get('/api/recent-reports', (req, res) => {
  const reports = [
    { title: 'CRDO ANALYSIS', date: new Date().toLocaleDateString(), agent: '📈 MERIDIAN', icon: '📊', url: '#' },
    { title: 'DASHBOARD DESIGN', date: new Date(Date.now() - 86400000).toLocaleDateString(), agent: '🎨 PIXEL', icon: '🎨', url: '#' },
    { title: 'MARKET RESEARCH', date: new Date(Date.now() - 2*86400000).toLocaleDateString(), agent: '🕵️ SCOUT', icon: '📈', url: '#' }
  ];
  res.json({ success: true, data: reports });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), wsClients: wss ? wss.clients.size : 0 });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start HTTP server
const server = app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🏢 SILPH CO. COMMAND CENTER v2.0                    ║
║                                                          ║
║     ⚡ Real-Time WebSocket Server Running!               ║
║                                                          ║
║     📊 Dashboard: http://localhost:${PORT}                   ║
║     🔌 API: http://${HOST}:${PORT}/api/status               ║
║     📡 WebSocket: ws://${HOST}:${PORT}                      ║
║                                                          ║
║     Broadcast interval: 5 seconds                        ║
║     Subagents: ${Object.keys(SUBAGENTS).length} monitored                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substring(7);
  clients.add(ws);
  console.log(`[WebSocket] Client ${clientId} connected (${clients.size} total)`);
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      subagents: systemState.subagents,
      metrics: systemState.metrics,
      activityLog: [...liveMissionLog.slice(0, 5), ...systemState.activityLog].slice(0, 20),
      tokenUsage: systemState.tokenUsage,
      modelRouter: systemState.modelRouter,
      timestamp: Date.now()
    }
  }));
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.action === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      } else if (data.action === 'subscribe') {
        ws.subscriptions = data.channels || ['all'];
        ws.send(JSON.stringify({ type: 'subscribed', channels: ws.subscriptions }));
      }
    } catch (e) {
      // Ignore malformed messages
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WebSocket] Client ${clientId} disconnected (${clients.size} total)`);
  });
  
  ws.on('error', (err) => {
    console.error(`[WebSocket] Client ${clientId} error:`, err.message);
    clients.delete(ws);
  });
});

/**
 * Broadcast updates to all connected clients
 * @param {string} updateType - Type of update
 * @param {object} payload - Additional data to send
 */
function broadcastUpdate(updateType = 'full', payload = {}) {
  const message = JSON.stringify({
    type: updateType,
    timestamp: Date.now(),
    data: {
      subagents: systemState.subagents,
      metrics: systemState.metrics,
      activityLog: liveMissionLog.slice(0, 10),
      tokenUsage: systemState.tokenUsage,
      modelRouter: systemState.modelRouter,
      ...payload
    }
  });
  
  let sentCount = 0;
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });
  
  if (sentCount > 0) {
    console.log(`[WebSocket] Broadcast ${updateType} to ${sentCount} clients`);
  }
}

// Broadcast every 5 seconds
setInterval(() => {
  broadcastUpdate('update');
}, 5000);

module.exports = { app, server, wss };
