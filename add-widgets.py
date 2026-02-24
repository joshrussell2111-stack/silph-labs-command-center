#!/usr/bin/env python3
"""
Add 5 new widgets to Silph Co. Command Center
Widgets: Cron Jobs, Skills Inventory, Context Usage, Model Router, Recent Reports
"""

import re

# Read the original index.html
with open('public/index.html', 'r') as f:
    html = f.read()

# ===== 1. ADD CSS STYLES =====
css_addition = """
        /* ========== NEW WIDGET STYLES ========== */
        
        /* 1. Cron Job Monitor Widget */
        .cron-job-item {
            background: rgba(0,0,0,0.3); border: 2px solid var(--gameboy-green);
            padding: 12px; margin-bottom: 10px; display: flex; align-items: center;
            gap: 12px; transition: all 0.2s;
        }
        .cron-job-item:hover { border-color: var(--pokemon-gold); transform: translateX(4px); }
        .cron-pokeball {
            width: 32px; height: 32px; border-radius: 50%; position: relative;
            border: 3px solid var(--pokeball-black); flex-shrink: 0;
        }
        .cron-pokeball.active {
            background: linear-gradient(180deg, var(--hp-green) 0%, var(--hp-green) 48%, var(--pokeball-black) 48%, var(--pokeball-black) 52%, #fff 52%, #fff 100%);
        }
        .cron-pokeball.paused {
            background: linear-gradient(180deg, var(--hp-yellow) 0%, var(--hp-yellow) 48%, var(--pokeball-black) 48%, var(--pokeball-black) 52%, #fff 52%, #fff 100%);
        }
        .cron-pokeball.error {
            background: linear-gradient(180deg, var(--hp-red) 0%, var(--hp-red) 48%, var(--pokeball-black) 48%, var(--pokeball-black) 52%, #fff 52%, #fff 100%);
        }
        .cron-pokeball::after {
            content: ''; position: absolute; width: 10px; height: 10px; background: #fff;
            border: 2px solid var(--pokeball-black); border-radius: 50%;
            top: 50%; left: 50%; transform: translate(-50%, -50%);
        }
        .cron-job-info { flex: 1; }
        .cron-job-name { font-family: 'Press Start 2P'; font-size: 0.65rem; color: var(--pokemon-gold); margin-bottom: 4px; }
        .cron-job-schedule { font-size: 0.95rem; color: var(--gameboy-green); }
        .cron-job-times { font-size: 0.85rem; color: rgba(139,172,15,0.7); margin-top: 4px; }
        
        /* 2. Skills Inventory Widget */
        .skills-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px; max-height: 400px; overflow-y: auto;
        }
        .skill-card {
            background: linear-gradient(145deg, rgba(139,172,15,0.15) 0%, rgba(15,56,15,0.3) 100%);
            border: 3px solid var(--gameboy-green); padding: 12px; text-align: center;
            cursor: pointer; transition: all 0.2s;
        }
        .skill-card:hover {
            border-color: var(--pokemon-gold); transform: translateY(-3px);
            box-shadow: 0 4px 0 var(--pokeball-black), 0 0 15px rgba(255,215,0,0.2);
        }
        .skill-icon {
            width: 48px; height: 48px; background: var(--gameboy-dark);
            border: 2px solid var(--gameboy-green); border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.8rem; margin: 0 auto 8px;
        }
        .skill-name {
            font-family: 'Press Start 2P'; font-size: 0.6rem; color: var(--pokemon-gold);
            margin-bottom: 6px; line-height: 1.4;
        }
        .skill-category {
            font-size: 0.85rem; color: var(--gameboy-green);
            background: rgba(139,172,15,0.15); padding: 2px 6px; border-radius: 4px; display: inline-block;
        }
        .skill-agent { font-size: 0.75rem; color: rgba(139,172,15,0.6); margin-top: 6px; }
        
        /* 3. Context Usage Widget */
        .context-widget { background: rgba(0,0,0,0.2); border: 3px solid var(--pokemon-gold); padding: 15px; }
        .context-header {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;
        }
        .context-model { font-family: 'Press Start 2P'; font-size: 0.7rem; color: var(--pokemon-gold); }
        .context-model-badge {
            background: linear-gradient(135deg, var(--pokemon-red) 0%, var(--pokemon-dark-red) 100%);
            padding: 4px 10px; border-radius: 4px; border: 2px solid var(--pokemon-gold);
        }
        .context-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
        .context-stat-box { background: rgba(0,0,0,0.3); border: 2px solid var(--gameboy-green); padding: 10px; text-align: center; }
        .context-stat-value { font-family: 'Press Start 2P'; font-size: 0.9rem; color: var(--pokemon-gold); display: block; }
        .context-stat-label { font-size: 0.85rem; color: var(--gameboy-green); margin-top: 4px; }
        .token-bar-container {
            background: var(--gameboy-dark); border: 3px solid var(--pokeball-black);
            height: 24px; position: relative; margin-top: 10px;
        }
        .token-bar-fill { height: 100%; transition: width 0.5s ease; position: relative; }
        .token-bar-fill::after {
            content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.2) 8px, rgba(0,0,0,0.2) 16px);
        }
        .token-bar-fill.safe { background: linear-gradient(180deg, var(--hp-green) 0%, #5a9a30 100%); }
        .token-bar-fill.warning { background: linear-gradient(180deg, var(--hp-yellow) 0%, #d4b020 100%); }
        .token-bar-fill.critical { background: linear-gradient(180deg, var(--hp-red) 0%, #d06020 100%); }
        .token-percentage {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            font-family: 'Press Start 2P'; font-size: 0.65rem; color: var(--pokeball-white);
            text-shadow: 2px 2px 0 var(--pokeball-black); z-index: 1;
        }
        
        /* 4. Model Router Status Widget */
        .router-chain { display: flex; flex-direction: column; gap: 10px; }
        .router-item {
            display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2);
            border: 2px solid var(--gameboy-green); padding: 12px; position: relative;
        }
        .router-item.active {
            border-color: var(--pokemon-gold); background: linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0.2) 100%);
            box-shadow: 0 0 15px rgba(255,215,0,0.2);
        }
        .router-item.active::before {
            content: '▶'; position: absolute; left: -4px; color: var(--pokemon-gold);
            animation: blink 1s step-end infinite;
        }
        .router-rank { font-family: 'Press Start 2P'; font-size: 0.6rem; color: var(--gameboy-green); width: 30px; text-align: center; }
        .router-icon {
            width: 40px; height: 40px; background: var(--gameboy-dark);
            border: 2px solid var(--gameboy-green); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; font-size: 1.3rem;
        }
        .router-item.active .router-icon { border-color: var(--pokemon-gold); background: var(--pokemon-gold); }
        .router-info { flex: 1; }
        .router-name { font-family: 'Press Start 2P'; font-size: 0.65rem; color: var(--pokemon-gold); }
        .router-provider { font-size: 0.9rem; color: var(--gameboy-green); }
        .router-status {
            padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-family: 'Press Start 2P';
        }
        .router-status.online { background: var(--hp-green); color: var(--gameboy-dark); }
        .router-status.fallback { background: var(--hp-yellow); color: var(--gameboy-dark); }
        .router-status.offline { background: var(--hp-red); color: var(--pokeball-white); }
        .router-arrow { text-align: center; color: var(--gameboy-green); font-size: 1.2rem; margin: -5px 0; }
        .routing-logic {
            margin-top: 15px; padding: 10px; background: rgba(139,172,15,0.1);
            border: 2px dashed var(--gameboy-green); font-size: 0.9rem;
            color: var(--gameboy-green); text-align: center;
        }
        
        /* 5. Recent Reports Widget */
        .reports-list { display: flex; flex-direction: column; gap: 10px; max-height: 350px; overflow-y: auto; }
        .report-item {
            display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2);
            border: 2px solid var(--gameboy-green); padding: 12px; cursor: pointer; transition: all 0.2s;
        }
        .report-item:hover {
            border-color: var(--pokemon-gold); transform: translateX(5px); background: rgba(255,215,0,0.05);
        }
        .report-icon {
            width: 48px; height: 48px; background: var(--gameboy-dark);
            border: 2px solid var(--gameboy-green); display: flex; align-items: center;
            justify-content: center; font-size: 1.5rem; flex-shrink: 0;
        }
        .report-info { flex: 1; min-width: 0; }
        .report-title {
            font-family: 'Press Start 2P'; font-size: 0.65rem; color: var(--pokemon-gold);
            margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .report-meta { display: flex; gap: 12px; font-size: 0.85rem; color: var(--gameboy-green); }
        .report-agent { background: rgba(139,172,15,0.2); padding: 2px 6px; border-radius: 4px; }
        .report-actions { display: flex; gap: 6px; }
        .report-btn {
            background: var(--gameboy-green); border: 2px solid var(--pokeball-black);
            padding: 6px 10px; font-family: 'VT323'; font-size: 0.9rem;
            color: var(--gameboy-dark); cursor: pointer; transition: all 0.1s;
        }
        .report-btn:hover { background: var(--pokemon-gold); transform: translateY(-2px); }
        .report-btn.view { background: var(--pokemon-gold); }
"""

# Insert CSS before the media query
html = html.replace(
    '        @media (max-width: 768px)',
    css_addition + '\n        @media (max-width: 768px)'
)

# ===== 2. ADD HTML WIDGETS =====
html_widgets = """
            <!-- NEW WIDGET 1: Cron Job Monitor -->
            <div class="card">
                <h2 class="card-title">⏰ CRON JOBS</h2>
                <div id="cronJobsPanel"><div class="loading">Loading...</div></div>
            </div>

            <!-- NEW WIDGET 2: Skills Inventory -->
            <div class="card">
                <h2 class="card-title">🎒 SKILLS INVENTORY</h2>
                <div class="skills-grid" id="skillsGrid"><div class="loading">Loading...</div></div>
            </div>

            <!-- NEW WIDGET 3: Context Usage -->
            <div class="card">
                <h2 class="card-title">🧠 CONTEXT USAGE</h2>
                <div id="contextUsagePanel"><div class="loading">Loading...</div></div>
            </div>

            <!-- NEW WIDGET 4: Model Router Status -->
            <div class="card">
                <h2 class="card-title">🤖 MODEL ROUTER</h2>
                <div id="modelRouterPanel"><div class="loading">Loading...</div></div>
            </div>

            <!-- NEW WIDGET 5: Recent Reports -->
            <div class="card">
                <h2 class="card-title">📊 RECENT REPORTS</h2>
                <div class="reports-list" id="recentReportsPanel"><div class="loading">Loading...</div></div>
            </div>
"""

# Insert widgets before Quick Actions
html = html.replace(
    '            <div class="card">\n                <h2 class="card-title">QUICK ACTIONS</h2>',
    html_widgets + '            <div class="card">\n                <h2 class="card-title">QUICK ACTIONS</h2>'
)

# ===== 3. ADD JAVASCRIPT FUNCTIONS =====
js_addition = """
        // ========== NEW WIDGET DATA FETCHING ==========
        
        async function fetchAllWidgets() {
            await Promise.all([
                fetchCronJobs(),
                fetchSkillsInventory(),
                fetchContextUsage(),
                fetchModelRouter(),
                fetchRecentReports()
            ]);
        }

        async function fetchCronJobs() {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/api/cron-jobs`);
                const result = await response.json();
                if (result.success) {
                    renderCronJobs(result.data);
                }
            } catch (error) {
                console.error('Cron jobs fetch error:', error);
                document.getElementById('cronJobsPanel').innerHTML = '<div class="error-message">Failed to load cron jobs</div>';
            }
        }

        async function fetchSkillsInventory() {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/api/skills`);
                const result = await response.json();
                if (result.success) {
                    renderSkillsInventory(result.data);
                }
            } catch (error) {
                console.error('Skills fetch error:', error);
                document.getElementById('skillsGrid').innerHTML = '<div class="error-message">Failed to load skills</div>';
            }
        }

        async function fetchContextUsage() {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/api/context-usage`);
                const result = await response.json();
                if (result.success) {
                    renderContextUsage(result.data);
                }
            } catch (error) {
                console.error('Context usage fetch error:', error);
                document.getElementById('contextUsagePanel').innerHTML = '<div class="error-message">Failed to load context usage</div>';
            }
        }

        async function fetchModelRouter() {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/api/model-router`);
                const result = await response.json();
                if (result.success) {
                    renderModelRouter(result.data);
                }
            } catch (error) {
                console.error('Model router fetch error:', error);
                document.getElementById('modelRouterPanel').innerHTML = '<div class="error-message">Failed to load model router</div>';
            }
        }

        async function fetchRecentReports() {
            try {
                const response = await fetch(`${CONFIG.apiUrl}/api/recent-reports`);
                const result = await response.json();
                if (result.success) {
                    renderRecentReports(result.data);
                }
            } catch (error) {
                console.error('Recent reports fetch error:', error);
                document.getElementById('recentReportsPanel').innerHTML = '<div class="error-message">Failed to load reports</div>';
            }
        }

        // ========== WIDGET RENDER FUNCTIONS ==========

        function renderCronJobs(jobs) {
            const panel = document.getElementById('cronJobsPanel');
            if (!jobs || jobs.length === 0) {
                panel.innerHTML = '<div style="padding:20px;text-align:center;color:var(--gameboy-green)">No cron jobs active</div>';
                return;
            }
            panel.innerHTML = jobs.map(job => `
                <div class="cron-job-item">
                    <div class="cron-pokeball ${job.status}"></div>
                    <div class="cron-job-info">
                        <div class="cron-job-name">${job.name}</div>
                        <div class="cron-job-schedule">Schedule: ${job.schedule}</div>
                        <div class="cron-job-times">Last: ${job.lastRun || 'Never'} | Next: ${job.nextRun || 'Calculating...'}</div>
                    </div>
                </div>
            `).join('');
        }

        function renderSkillsInventory(skills) {
            const grid = document.getElementById('skillsGrid');
            if (!skills || skills.length === 0) {
                grid.innerHTML = '<div style="padding:20px;text-align:center;color:var(--gameboy-green);grid-column:1/-1;">No skills installed</div>';
                return;
            }
            grid.innerHTML = skills.map(skill => `
                <div class="skill-card" title="${skill.description || ''}">
                    <div class="skill-icon">${skill.icon}</div>
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-category">${skill.category}</div>
                    <div class="skill-agent">${skill.agent}</div>
                </div>
            `).join('');
        }

        function renderContextUsage(data) {
            const panel = document.getElementById('contextUsagePanel');
            const percentage = Math.round((data.tokensUsed / data.tokensTotal) * 100);
            const barClass = percentage < 60 ? 'safe' : percentage < 85 ? 'warning' : 'critical';
            
            panel.innerHTML = `
                <div class="context-widget">
                    <div class="context-header">
                        <span class="context-model">MODEL:</span>
                        <span class="context-model-badge">${data.model}</span>
                    </div>
                    <div class="context-stats">
                        <div class="context-stat-box">
                            <span class="context-stat-value">${data.tokensUsed.toLocaleString()}</span>
                            <div class="context-stat-label">USED</div>
                        </div>
                        <div class="context-stat-box">
                            <span class="context-stat-value">${data.tokensRemaining.toLocaleString()}</span>
                            <div class="context-stat-label">LEFT</div>
                        </div>
                        <div class="context-stat-box">
                            <span class="context-stat-value">${data.tokensTotal.toLocaleString()}</span>
                            <div class="context-stat-label">TOTAL</div>
                        </div>
                    </div>
                    <div class="token-bar-container">
                        <div class="token-bar-fill ${barClass}" style="width:${percentage}%"></div>
                        <span class="token-percentage">${percentage}%</span>
                    </div>
                </div>
            `;
        }

        function renderModelRouter(data) {
            const panel = document.getElementById('modelRouterPanel');
            panel.innerHTML = `
                <div class="router-chain">
                    ${data.models.map((model, index) => `
                        <div class="router-item ${model.active ? 'active' : ''}">
                            <span class="router-rank">#${index + 1}</span>
                            <div class="router-icon">${model.icon}</div>
                            <div class="router-info">
                                <div class="router-name">${model.name}</div>
                                <div class="router-provider">${model.provider}</div>
                            </div>
                            <span class="router-status ${model.status}">${model.status.toUpperCase()}</span>
                        </div>
                        ${index < data.models.length - 1 ? '<div class="router-arrow">↓</div>' : ''}
                    `).join('')}
                </div>
                <div class="routing-logic">${data.routingLogic}</div>
            `;
        }

        function renderRecentReports(reports) {
            const panel = document.getElementById('recentReportsPanel');
            if (!reports || reports.length === 0) {
                panel.innerHTML = '<div style="padding:20px;text-align:center;color:var(--gameboy-green)">No reports found</div>';
                return;
            }
            panel.innerHTML = reports.map(report => `
                <div class="report-item" onclick="window.open('${report.url}', '_blank')">
                    <div class="report-icon">${report.icon}</div>
                    <div class="report-info">
                        <div class="report-title">${report.title}</div>
                        <div class="report-meta">
                            <span>${report.date}</span>
                            <span class="report-agent">${report.agent}</span>
                        </div>
                    </div>
                    <div class="report-actions">
                        <button class="report-btn view" onclick="event.stopPropagation(); window.open('${report.url}', '_blank')">VIEW</button>
                    </div>
                </div>
            `).join('');
        }
"""

# Insert JavaScript before the closing script tag
html = html.replace(
    '        function forceRefresh() {',
    js_addition + '\n        function forceRefresh() {'
)

# Update fetchData() to include new widgets
html = html.replace(
    '                    renderSystemPanel(result.data.metrics);\n                    renderPokemonGrid(result.data.subagents);\n                    renderMissionLog(result.data.activityLog);',
    '''                    renderSystemPanel(result.data.metrics);
                    renderPokemonGrid(result.data.subagents);
                    renderMissionLog(result.data.activityLog);
                    fetchAllWidgets();'''
)

# Update version number
html = html.replace('Mission Control v2.0 - LIVE DATA', 'Mission Control v3.0 - LIVE DATA + NEW WIDGETS')

# Write the updated file
with open('public/index.html', 'w') as f:
    f.write(html)

print("✅ index.html updated with 5 new widgets!")
print("📊 Widgets added:")
print("  1. Cron Job Monitor")
print("  2. Skills Inventory")
print("  3. Context Usage")
print("  4. Model Router Status")
print("  5. Recent Reports")
