import React from 'react';

function ModelCard({ model, isCurrent, isSelected, onSelect }) {
  const getSpeedIcon = (speed) => {
    switch (speed) {
      case 'fast': return '⚡';
      case 'medium': return '🐢';
      case 'slow': return '🐌';
      default: return '⚡';
    }
  };

  const getSpeedText = (speed) => {
    switch (speed) {
      case 'fast': return 'Fast';
      case 'medium': return 'Medium';
      case 'slow': return 'Thorough';
      default: return 'Fast';
    }
  };

  const getPricingText = () => {
    const { pricing } = model;
    if (pricing.type === 'free') return 'Free';
    if (pricing.type === 'variable') return 'Variable';
    if (pricing.inputPer1k) return `$${pricing.inputPer1k}/1K`;
    return '';
  };

  const getCardClass = () => {
    if (isCurrent) return 'model-select-card current';
    if (isSelected) return 'model-select-card selected';
    return 'model-select-card';
  };

  return (
    <div className={getCardClass()}>
      {isCurrent && (
        <div className="current-badge">
          <span>✓ Currently Active</span>
        </div>
      )}
      
      <div className="model-select-header">
        <h4 className="model-select-name">{model.name}</h4>
        {isCurrent && <span className="checkmark">✓</span>}
      </div>
      
      <div className="model-select-meta">
        <span className="speed-badge">
          {getSpeedIcon(model.features.speed)} {getSpeedText(model.features.speed)}
        </span>
        <span className="pricing-badge">{getPricingText()}</span>
      </div>
      
      <p className="model-select-description">
        {model.features.bestFor}
      </p>
      
      {!isCurrent && (
        <button 
          className="btn btn-select"
          onClick={() => onSelect(model)}
        >
          Select
        </button>
      )}
    </div>
  );
}

export default ModelCard;