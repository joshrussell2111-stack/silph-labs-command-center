/**
 * Silph Co. Command Center - Frontend Application
 * WebSocket Client + Draggable Widgets + Real-time Dashboard
 */

// ============================================
// WEBSOCKET CLIENT
// ============================================

let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function connectWebSocket() {
  const wsUrl = `ws://${window.location.host}/ws`;
  
  updateConnectionStatus('connecting', 'Connecting...');
  updateWSIndicator('connecting');
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('[WebSocket] Connected');
    reconnectAttempts = 0;
    updateConnectionStatus('online', 'Live');
    updateWSIndicator('connected');
    
    // Subscribe to all channels
    ws.send(JSON.stringify({ action: 'subscribe', channels: ['all'] }));
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    } catch (e) {
      console.error('[WebSocket] Error parsing message:', e);
    }
  };
  
  ws.onclose = () => {
    console.log('[WebSocket] Disconnected');
    updateConnectionStatus('offline', 'Reconnecting...');
    updateWSIndicator('disconnected');
    
    // Attempt to reconnect
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setTimeout(() => {
        console.log(`[WebSocket] Reconnecting (attempt ${reconnectAttempts})...`);
        connectWebSocket();
      }, 3000);
    } else {
      console.log('[WebSocket] Max reconnection attempts reached, falling back to polling');
      startPolling();
    }
  };
  
  ws.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
    updateConnectionStatus('offline', 'Error');
    updateWSIndicator('disconnected');
  };
}

function handleWebSocketMessage(message) {
  switch (message.type) {
    case 'init':
    case 'update':
    case 'full':
      updateDashboard(message.data);
      break;
    case 'agent_spawned':
      showNotification(`New agent ${message.data.agent.name} spawned!`, 'success');
      break;
    case 'pong':
      // Heartbeat response
      break;
    case 'subscribed':
      console.log('[WebSocket] Subscribed to channels:', message.channels);
      break;
    default:
      console.log('[WebSocket] Unknown message type:', message.type);
  }
}

function updateConnectionStatus(status, text) {
  const dot = document.getElementById('connectionDot');
  const textEl = document.getElementById('connectionText');
  
  if (dot && textEl) {
    dot.className = `connection-dot ${status}`;
    textEl.textContent = text;
  }
}

function updateWSIndicator(status) {
  const indicator = document.getElementById('wsIndicator');
  const dot = document.getElementById('wsDot');
  const text = document.getElementById('wsText');
  
  if (indicator && dot && text) {
    indicator.className = `ws-indicator ${status}`;
    dot.className = `ws-dot ${status}`;
    text.textContent = status === 'connected' ? 'WS: Live' : 'WS: Offline';
  }
}

// ============================================
// FALLBACK POLLING (if WebSocket fails)
// ============================================

let pollingInterval = null;

function startPolling() {
  if (pollingInterval) return;
  
  console.log('[Dashboard] Starting fallback polling');
  fetchDashboardData();
  
  pollingInterval = setInterval(fetchDashboardData, 5000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

async function fetchDashboardData() {
  try {
    const response = await fetch('/api/status');
    const result = await response.json();
    
    if (result.success) {
      updateDashboard(result.data);
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching data:', error);
  }
}

// ============================================
// DASHBOARD UPDATE FUNCTION
// ============================================

function updateDashboard(data) {
  // Update System Status
  const systemPanel = document.getElementById('systemPanel');
  if (systemPanel) {
    systemPanel.innerHTML = renderSystemStatus(data);
  }
  
  // Update Pokemon/Agents
  const pokemonGrid = document.getElementById('pokemonGrid');
  if (pokemonGrid && data.subagents) {
    pokemonGrid.innerHTML = renderAgents(data.subagents);
  }
  
  // Update Mission Log
  const missionLog = document.getElementById('missionLog');
  if (missionLog && data.activityLog) {
    missionLog.innerHTML = renderMissionLog(data.activityLog);
  }
  
  // Update Context Usage
  const contextPanel = document.getElementById('contextUsagePanel');
  if (contextPanel && data.tokenUsage) {
    contextPanel.innerHTML = renderContextUsage(data.tokenUsage);
  }
  
  // Update Model Router
  const routerPanel = document.getElementById('modelRouterPanel');
  if (routerPanel && data.modelRouter) {
    routerPanel.innerHTML = renderModelRouter(data.modelRouter);
  }
  
  // Update Last Updated
  const lastUpdated = document.getElementById('lastUpdated');
  if (lastUpdated) {
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderSystemStatus(data) {
  const metrics = data.metrics || {};
  const uptime = metrics.uptime || '00:00:00';
  const gatewayStatus = metrics.gatewayStatus || 'unknown';
  const apiLatency = metrics.apiLatency || 0;
  const activeAgents = metrics.activeAgents || 0;
  const recentFiles = metrics.recentFiles || 0;
  
  const statusClass = gatewayStatus === 'online' ? 'online' : 'offline';
  
  return `
    <div class="stat-row">
      <span class="stat-label">System Status</span>
      <span class="stat-value ${statusClass}">${gatewayStatus.toUpperCase()}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Uptime</span>
      <span class="stat-value">${uptime}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">API Latency</span>
      <span class="stat-value">${apiLatency}ms</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Active Agents</span>
      <span class="stat-value">${activeAgents}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Recent Files</span>
      <span class="stat-value">${recentFiles}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">WebSocket</span>
      <span class="stat-value ${ws && ws.readyState === WebSocket.OPEN ? 'online' : 'offline'}">
        ${ws && ws.readyState === WebSocket.OPEN ? 'CONNECTED' : 'DISCONNECTED'}
      </span>
    </div>
  `;
}

function renderAgents(subagents) {
  if (!subagents || Object.keys(subagents).length === 0) {
    return '<div class="error-message">No agents found</div>';
  }
  
  return Object.entries(subagents).map(([key, agent]) => {
    const hpClass = agent.hp >= 70 ? 'hp-high' : agent.hp >= 40 ? 'hp-medium' : 'hp-low';
    const statusClass = `status-${agent.status || 'idle'}`;
    const offlineClass = agent.status === 'offline' ? 'offline' : '';
    
    return `
      <div class="pokemon-card ${offlineClass}" data-agent-id="${key}">
        <div class="pokemon-header">
          <div class="pokemon-icon">${agent.icon}</div>
          <div>
            <div class="pokemon-name">${agent.name}</div>
            <div class="pokemon-type">${agent.type}</div>
          </div>
          <div class="status-indicator ${statusClass}"></div>
        </div>
        <div class="hp-container">
          <div class="hp-label">
            <span>HP</span>
            <span>${agent.hp}/${agent.maxHp}</span>
          </div>
          <div class="hp-bar-bg">
            <div class="hp-bar-fill ${hpClass}" style="width: ${(agent.hp / agent.maxHp) * 100}%"></div>
          </div>
        </div>
        <div style="margin-top:8px;font-size:0.9rem;color:var(--gameboy-green)">
          ${agent.description}
        </div>
      </div>
    `;
  }).join('');
}

function renderMissionLog(log) {
  if (!log || log.length === 0) {
    return '<div class="error-message">No activity logged</div>';
  }
  
  return log.slice(0, 20).map((entry, index) => {
    const time = entry.time || new Date(entry.timestamp).toLocaleTimeString();
    const isNew = index < 3 ? 'new' : '';
    
    return `
      <div class="log-entry ${isNew}">
        <span class="log-time">${time}</span>
        <span class="log-agent">${entry.icon} ${entry.agent}</span>
        <div class="log-text">${entry.text}</div>
      </div>
    `;
  }).join('');
}

function renderContextUsage(tokenUsage) {
  const percentage = tokenUsage.percentage || 0;
  const statusClass = tokenUsage.status || 'safe';
  const tokensUsed = tokenUsage.tokensUsed?.toLocaleString() || '0';
  const tokensTotal = tokenUsage.tokensTotal?.toLocaleString() || '0';
  const tokensRemaining = tokenUsage.tokensRemaining?.toLocaleString() || '0';
  
  return `
    <div class="context-widget">
      <div class="context-header">
        <span class="context-model">Current Model</span>
        <span class="context-model-badge">${tokenUsage.model}</span>
      </div>
      <div class="context-stats">
        <div class="context-stat-box">
          <span class="context-stat-value">${tokensUsed}</span>
          <span class="context-stat-label">Used</span>
        </div>
        <div class="context-stat-box">
          <span class="context-stat-value">${tokensTotal}</span>
          <span class="context-stat-label">Total</span>
        </div>
        <div class="context-stat-box">
          <span class="context-stat-value">${tokensRemaining}</span>
          <span class="context-stat-label">Remaining</span>
        </div>
      </div>
      <div class="token-bar-container">
        <div class="token-bar-fill ${statusClass}" style="width: ${percentage}%"></div>
        <span class="token-percentage">${percentage}%</span>
      </div>
    </div>
  `;
}

function renderModelRouter(router) {
  if (!router || !router.models) {
    return '<div class="error-message">Model router unavailable</div>';
  }
  
  const models = router.models.map((model, index) => {
    const isActive = model.active;
    const statusClass = model.status;
    
    return `
      <div class="router-item ${isActive ? 'active' : ''}">
        <span class="router-rank">${index + 1}</span>
        <div class="router-icon">${model.icon}</div>
        <div class="router-info">
          <div class="router-name">${model.name}</div>
          <div class="router-provider">${model.provider}</div>
        </div>
        <span class="router-status ${statusClass}">${model.status.toUpperCase()}</span>
      </div>
      ${index < router.models.length - 1 ? '<div class="router-arrow">↓</div>' : ''}
    `;
  }).join('');
  
  return `
    <div class="router-chain">
      ${models}
      <div class="routing-logic">
        ${router.routingLogic}
      </div>
    </div>
  `;
}

function renderSkills(skills) {
  if (!skills || skills.length === 0) {
    return '<div class="error-message">No skills found</div>';
  }
  
  return skills.map(skill => `
    <div class="skill-card" title="${skill.description}">
      <div class="skill-icon">${skill.icon}</div>
      <div class="skill-name">${skill.name}</div>
      <span class="skill-category">${skill.category}</span>
    </div>
  `).join('');
}

function renderCronJobs(jobs) {
  if (!jobs || jobs.length === 0) {
    return '<div class="error-message">No cron jobs configured</div>';
  }
  
  return jobs.map(job => `
    <div class="cron-job-item">
      <div class="cron-pokeball ${job.status}"></div>
      <div class="cron-job-info">
        <div class="cron-job-name">${job.name}</div>
        <div class="cron-job-schedule">${job.schedule}</div>
        <div class="cron-job-times">Last: ${job.lastRun} | Next: ${job.nextRun}</div>
      </div>
    </div>
  `).join('');
}

function renderReports(reports) {
  if (!reports || reports.length === 0) {
    return '<div class="error-message">No reports available</div>';
  }
  
  return reports.map(report => `
    <div class="report-item" onclick="window.open('${report.url}', '_blank')">
      <div class="report-icon">${report.icon}</div>
      <div class="report-info">
        <div class="report-title">${report.title}</div>
        <div class="report-meta">
          <span>${report.date}</span>
          <span class="report-agent">${report.agent}</span>
        </div>
      </div>
      <button class="report-btn">VIEW</button>
    </div>
  `).join('');
}

// ============================================
// DRAGGABLE WIDGETS
// ============================================

function initDraggableWidgets() {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;
  
  // Use native HTML5 Drag and Drop API
  let draggedItem = null;
  
  grid.querySelectorAll('.card').forEach(card => {
    card.draggable = true;
    
    card.addEventListener('dragstart', (e) => {
      draggedItem = card;
      card.style.opacity = '0.5';
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    card.addEventListener('dragend', (e) => {
      card.style.opacity = '1';
      card.classList.remove('dragging');
      draggedItem = null;
      saveLayout();
    });
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (draggedItem && draggedItem !== card) {
        const allCards = [...grid.children];
        const draggedIdx = allCards.indexOf(draggedItem);
        const targetIdx = allCards.indexOf(card);
        
        if (draggedIdx < targetIdx) {
          grid.insertBefore(draggedItem, card.nextSibling);
        } else {
          grid.insertBefore(draggedItem, card);
        }
      }
    });
  });
  
  // Restore layout on load
  restoreLayout();
}

function saveLayout() {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;
  
  const order = [...grid.children].map(card => card.dataset.cardId).filter(id => id);
  localStorage.setItem('silphLayout', JSON.stringify(order));
  console.log('[Dashboard] Layout saved');
}

function restoreLayout() {
  const grid = document.getElementById('dashboardGrid');
  if (!grid) return;
  
  const saved = localStorage.getItem('silphLayout');
  if (!saved) {
    console.log('[Dashboard] No saved layout found');
    return;
  }
  
  try {
    const order = JSON.parse(saved);
    order.forEach(id => {
      const card = document.querySelector(`[data-card-id="${id}"]`);
      if (card) {
        grid.appendChild(card);
      }
    });
    console.log('[Dashboard] Layout restored');
  } catch (e) {
    console.error('[Dashboard] Error restoring layout:', e);
  }
}

// ============================================
// LOAD STATIC WIDGET DATA (Skills, Cron, Reports)
// ============================================

async function loadStaticWidgets() {
  try {
    // Load skills
    const skillsResponse = await fetch('/api/skills');
    const skillsResult = await skillsResponse.json();
    if (skillsResult.success) {
      const skillsGrid = document.getElementById('skillsGrid');
      if (skillsGrid) {
        skillsGrid.innerHTML = renderSkills(skillsResult.data);
      }
    }
    
    // Load cron jobs
    const cronResponse = await fetch('/api/cron-jobs');
    const cronResult = await cronResponse.json();
    if (cronResult.success) {
      const cronPanel = document.getElementById('cronJobsPanel');
      if (cronPanel) {
        cronPanel.innerHTML = renderCronJobs(cronResult.data);
      }
    }
    
    // Load reports
    const reportsResponse = await fetch('/api/recent-reports');
    const reportsResult = await reportsResponse.json();
    if (reportsResult.success) {
      const reportsPanel = document.getElementById('recentReportsPanel');
      if (reportsPanel) {
        reportsPanel.innerHTML = renderReports(reportsResult.data);
      }
    }
  } catch (error) {
    console.error('[Dashboard] Error loading static widgets:', error);
  }
}

// ============================================
// UI ACTIONS
// ============================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function viewReports() {
  openModal('reportsModal');
  loadAllReports();
}

async function loadAllReports() {
  const reportsList = document.getElementById('reportsList');
  if (reportsList) {
    reportsList.innerHTML = '<div class="loading">Loading reports...</div>';
  }
  
  try {
    const response = await fetch('/api/recent-reports');
    const result = await response.json();
    
    if (result.success && reportsList) {
      reportsList.innerHTML = renderReports(result.data);
    }
  } catch (error) {
    if (reportsList) {
      reportsList.innerHTML = '<div class="error-message">Failed to load reports</div>';
    }
  }
}

async function runHealthCheck() {
  showNotification('Running health check...', 'info');
  
  try {
    const response = await fetch('/api/actions/health-check', { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      showNotification(`Health check: ${result.healthy ? 'HEALTHY' : 'ISSUES DETECTED'}`, result.healthy ? 'success' : 'warning');
    }
  } catch (error) {
    showNotification('Health check failed', 'error');
  }
}

function forceRefresh() {
  showNotification('Refreshing...', 'info');
  fetchDashboardData();
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'var(--hp-green)' : type === 'error' ? 'var(--hp-red)' : type === 'warning' ? 'var(--hp-yellow)' : 'var(--gameboy-green)'};
    color: ${type === 'warning' ? 'var(--gameboy-dark)' : 'var(--pokeball-white)'};
    padding: 15px 20px;
    border: 3px solid var(--pokeball-black);
    font-family: 'Press Start 2P', cursive;
    font-size: 0.7rem;
    z-index: 3000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================
// FORM HANDLERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Spawn form handler
  const spawnForm = document.getElementById('spawnForm');
  if (spawnForm) {
    spawnForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('agentName').value;
      const type = document.getElementById('agentType').value;
      const description = document.getElementById('agentDesc').value;
      
      try {
        const response = await fetch('/api/actions/spawn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, description })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showNotification(`Agent ${name.toUpperCase()} spawned!`, 'success');
          closeModal('spawnModal');
          spawnForm.reset();
        } else {
          showNotification(result.error || 'Failed to spawn agent', 'error');
        }
      } catch (error) {
        showNotification('Error spawning agent', 'error');
      }
    });
  }
  
  // Settings form handler
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showNotification('Settings saved!', 'success');
      closeModal('settingsModal');
    });
  }
  
  // Close modals on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
  
  // Initialize everything
  initDraggableWidgets();
  connectWebSocket();
  loadStaticWidgets();
  
  console.log('[Dashboard] Silph Command Center initialized');
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
  // ESC to close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
  }
  
  // R to refresh
  if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const activeElement = document.activeElement;
    if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
      forceRefresh();
    }
  }
});
