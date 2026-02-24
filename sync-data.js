#!/usr/bin/env node
/**
 * Silph Co. Data Sync
 * Exports local workspace data to JSON for cloud deployment
 * Run this periodically to keep the public dashboard updated
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/Users/joshrussell/.openclaw/workspace';
const OUTPUT_FILE = path.join(WORKSPACE, 'silph-command-center', 'public', 'data.json');

// Subagent definitions
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
    skillLog: 'scout-skill-log.md',
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
    skillLog: 'cipher-skill-log.md',
    description: 'AI Model Intelligence, Security, Data Protection'
  }
};

function getFileStats(filename) {
  try {
    const filepath = path.join(WORKSPACE, filename);
    const stats = fs.statSync(filepath);
    return {
      exists: true,
      mtime: stats.mtime,
      size: stats.size,
      age: Math.floor((Date.now() - stats.mtime.getTime()) / 1000) // seconds
    };
  } catch {
    return { exists: false, age: Infinity };
  }
}

function parseSkillLog(filename) {
  try {
    const filepath = path.join(WORKSPACE, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Extract recent entries (lines with dates or bullet points)
    const lines = content.split('\n').filter(l => l.trim());
    const recentEntries = lines
      .filter(l => l.match(/^[-*\d]/) || l.includes('Installed') || l.includes('Learned') || l.includes('Updated'))
      .slice(-10); // Last 10 entries
    
    return {
      entries: recentEntries,
      lineCount: lines.length
    };
  } catch {
    return { entries: [], lineCount: 0 };
  }
}

function calculateHP(stats, logData) {
  if (!stats.exists) return 10; // Offline
  
  const ageHours = stats.age / 3600;
  
  // Active in last 6 hours = 100 HP
  if (ageHours < 6) return 100;
  // Active in last 24 hours = 75 HP
  if (ageHours < 24) return 75;
  // Active in last 3 days = 50 HP
  if (ageHours < 72) return 50;
  // Active in last week = 25 HP
  if (ageHours < 168) return 25;
  // Older = 10 HP
  return 10;
}

function getStatus(hp) {
  if (hp >= 75) return 'active';
  if (hp >= 50) return 'busy';
  if (hp >= 25) return 'idle';
  return 'offline';
}

function getHeartbeatData() {
  try {
    const heartbeatPath = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');
    const data = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
    return {
      lastChecks: data.lastChecks || {},
      lastHeartbeat: data.lastHeartbeat,
      notes: data.notes
    };
  } catch {
    return { lastChecks: {} };
  }
}

function buildActivityLog(subagentsData) {
  const activities = [];
  
  Object.entries(subagentsData).forEach(([key, agent]) => {
    if (agent.lastActive && agent.skillLog && agent.skillLog.entries) {
      agent.skillLog.entries.slice(-3).forEach(entry => {
        activities.push({
          time: agent.lastActive,
          timestamp: new Date(agent.lastActive).getTime(),
          agent: agent.name,
          icon: agent.icon,
          text: entry.substring(0, 100),
          type: 'task_complete'
        });
      });
    }
  });
  
  // Sort by timestamp, most recent first
  return activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);
}

function syncData() {
  console.log('🔄 Syncing Silph Co. data...\n');
  
  const subagentsData = {};
  
  // Process each subagent
  Object.entries(SUBAGENTS).forEach(([key, config]) => {
    const stats = getFileStats(config.skillLog);
    const logData = parseSkillLog(config.skillLog);
    const hp = calculateHP(stats, logData);
    
    subagentsData[key] = {
      name: config.name,
      type: config.type,
      icon: config.icon,
      description: config.description,
      activityLevel: hp,
      status: getStatus(hp),
      lastActive: stats.exists ? stats.mtime.toISOString().split('T')[0] : null,
      hp: hp,
      maxHp: 100,
      skillLog: logData
    };
    
    console.log(`${config.icon} ${config.name}: ${hp} HP (${getStatus(hp)})`);
  });
  
  // Get heartbeat data
  const heartbeat = getHeartbeatData();
  
  // Build activity log
  const activityLog = buildActivityLog(subagentsData);
  
  // Get recent files
  let recentFiles = 0;
  try {
    const files = fs.readdirSync(WORKSPACE);
    const now = Date.now();
    recentFiles = files.filter(f => {
      try {
        const stats = fs.statSync(path.join(WORKSPACE, f));
        return (now - stats.mtime.getTime()) < 24 * 60 * 60 * 1000;
      } catch { return false; }
    }).length;
  } catch {}
  
  // Compile final data
  const data = {
    success: true,
    timestamp: new Date().toISOString(),
    lastSync: Date.now(),
    subagents: subagentsData,
    metrics: {
      uptime: "09:00:00",
      gatewayStatus: "online",
      apiLatency: 20,
      activeAgents: Object.values(subagentsData).filter(a => a.hp >= 50).length,
      recentFiles: recentFiles,
      lastHeartbeat: heartbeat.lastHeartbeat,
      memoryChecks: heartbeat.lastChecks
    },
    activityLog: activityLog,
    systemStatus: "ONLINE"
  };
  
  // Write to output file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  
  console.log(`\n✅ Data synced to: ${OUTPUT_FILE}`);
  console.log(`📊 Activity entries: ${activityLog.length}`);
  console.log(`🕐 Sync time: ${new Date().toLocaleString()}`);
  
  return data;
}

// Run sync
syncData();

// If run with --watch, sync every 5 minutes
if (process.argv.includes('--watch')) {
  console.log('\n👁️  Watch mode enabled. Syncing every 5 minutes...\n');
  setInterval(syncData, 5 * 60 * 1000);
}