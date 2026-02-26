import React from 'react';
import StatusWidget from './StatusWidget';
import ActivityWidget from './ActivityWidget';

function Dashboard({ currentModel, onChangeModel }) {
  const getSpeedIcon = (speed) => {
    switch (speed) {
      case 'fast': return '⚡';
      case 'medium': return '🐢';
      case 'slow': return '🐌';
      default: return '⚡';
    }
  };

  const getPricingText = (pricing) => {
    if (pricing.type === 'free') return 'Free';
    if (pricing.type === 'variable') return 'Variable';
    if (pricing.inputPer1k) return `$${pricing.inputPer1k}/1K`;
    return '';
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-title">
          <span className="header-icon">⚡️</span>
          <h1>OpenClaw Control Center</h1>
        </div>
        <div className="connection-status">
          <span className="status-dot online"></span>
          <span>Connected</span>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Current AI Model Card */}
        <section className="model-section">
          <div className="model-card current">
            <div className="model-card-header">
              <span className="model-icon">🤖</span>
              <h2>Current AI Assistant</h2>
            </div>
            <div className="model-card-body">
              <p className="model-label">Currently using:</p>
              <h3 className="model-name">{currentModel?.name || 'Kimi K2.5'}</h3>
              <p className="model-description">
                {getSpeedIcon(currentModel?.features?.speed)} {currentModel?.features?.speed === 'fast' ? 'Fast' : currentModel?.features?.speed === 'medium' ? 'Medium' : 'Thorough'}
                {' • '}
                {getPricingText(currentModel?.pricing || { type: 'free' })}
                {' • '}
                {currentModel?.features?.bestFor || 'Great for most tasks'}
              </p>
            </div>
            <div className="model-card-footer">
              <button 
                className="btn btn-primary btn-full"
                onClick={onChangeModel}
              >
                Change Model
              </button>
            </div>
          </div>
        </section>

        {/* Widgets Grid */}
        <section className="widgets-grid">
          <StatusWidget />
          <ActivityWidget />
        </section>
      </main>
    </div>
  );
}

export default Dashboard;