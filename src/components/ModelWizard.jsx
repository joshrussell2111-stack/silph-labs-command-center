import React, { useState, useEffect } from 'react';
import ModelCard from './ModelCard';

// Mock data for available models
const mockModels = [
  {
    modelId: 'moonshot/kimi-k2.5',
    name: 'Kimi K2.5',
    provider: 'Moonshot AI',
    pricing: { type: 'free' },
    features: { speed: 'fast', bestFor: 'Great for most tasks' }
  },
  {
    modelId: 'anthropic/claude-sonnet-4-5',
    name: 'Claude Sonnet',
    provider: 'Anthropic',
    pricing: { type: 'paid', inputPer1k: 0.03, outputPer1k: 0.015 },
    features: { speed: 'medium', bestFor: 'Best for coding & complex tasks' }
  },
  {
    modelId: 'openai/gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    pricing: { type: 'paid', inputPer1k: 0.06, outputPer1k: 0.03 },
    features: { speed: 'medium', bestFor: 'Best for writing & creativity' }
  },
  {
    modelId: 'openrouter/auto',
    name: 'OpenRouter',
    provider: 'OpenRouter',
    pricing: { type: 'variable' },
    features: { speed: 'fast', bestFor: 'Auto-selects best model for task' }
  }
];

function ModelWizard({ currentModel, onClose, onModelChange }) {
  const [step, setStep] = useState('selection'); // selection, confirm, loading, success, error
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models/available');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || mockModels);
      } else {
        setModels(mockModels);
      }
    } catch (error) {
      setModels(mockModels);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setStep('loading');
    
    try {
      const response = await fetch('/api/models/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: selectedModel.modelId })
      });

      const result = await response.json();

      if (result.success) {
        onModelChange({
          ...selectedModel,
          modelId: selectedModel.modelId
        });
        setStep('success');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(result.message || 'Failed to switch model');
      }
    } catch (error) {
      setErrorMessage(error.message || 'The API key may be missing.');
      setStep('error');
    }
  };

  const handleRetry = () => {
    setStep('selection');
    setSelectedModel(null);
    setErrorMessage('');
  };

  const getPricingText = (model) => {
    if (!model) return '';
    if (model.pricing.type === 'free') return 'Free';
    if (model.pricing.type === 'variable') return 'Variable pricing';
    if (model.pricing.inputPer1k) return `$${model.pricing.inputPer1k} per 1,000 words`;
    return '';
  };

  // Selection Step
  const renderSelection = () => (
    <div className="wizard-step">
      <div className="wizard-header">
        <h2>🤖 Change AI Assistant</h2>
      </div>
      
      <div className="current-model-preview">
        <p className="preview-label">Currently Using:</p>
        <p className="preview-name">✓ {currentModel?.name}</p>
        <p className="preview-meta">
          {currentModel?.features?.speed === 'fast' ? '⚡ Fast' : '🐢 Thorough'}
          {' • '}
          {currentModel?.pricing?.type === 'free' ? 'Free' : `$${currentModel?.pricing?.inputPer1k}/1K`}
        </p>
      </div>

      <p className="wizard-subtitle">Available Options:</p>

      {loading ? (
        <div className="loading-models">
          <div className="spinner"></div>
          <p>Loading available models...</p>
        </div>
      ) : (
        <div className="models-grid">
          {models.map((model) => (
            <ModelCard
              key={model.modelId}
              model={model}
              isCurrent={model.modelId === currentModel?.modelId}
              isSelected={selectedModel?.modelId === model.modelId}
              onSelect={handleSelectModel}
            />
          ))}
        </div>
      )}

      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );

  // Confirmation Step
  const renderConfirm = () => (
    <div className="wizard-step">
      <div className="confirm-dialog">
        <h3>🔄 Switch Model?</h3>
        
        <div className="confirm-content">
          <p className="confirm-label">You're switching from:</p>
          <p className="confirm-from">
            • {currentModel?.name} ({getPricingText(currentModel)})
          </p>
          
          <p className="confirm-label">To:</p>
          <p className="confirm-to">
            • {selectedModel?.name} ({getPricingText(selectedModel)})
          </p>
          
          <p className="confirm-note">This takes effect immediately.</p>
        </div>

        <div className="confirm-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setStep('selection')}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleConfirm}
          >
            Confirm Switch
          </button>
        </div>
      </div>
    </div>
  );

  // Loading Step
  const renderLoading = () => (
    <div className="wizard-step wizard-loading">
      <div className="spinner-large"></div>
      <h3>Switching AI model...</h3>
      <p>Updating Ash's brain</p>
      <div className="progress-bar">
        <div className="progress-fill"></div>
      </div>
    </div>
  );

  // Success Step
  const renderSuccess = () => (
    <div className="wizard-step wizard-success">
      <div className="success-icon">✅</div>
      <h3>Success!</h3>
      <p className="success-message">
        Ash is now using {selectedModel?.name}.
      </p>
      <p className="success-note">
        You'll notice the difference in the next message.
      </p>
      <button className="btn btn-primary" onClick={onClose}>
        Got it
      </button>
    </div>
  );

  // Error Step
  const renderError = () => (
    <div className="wizard-step wizard-error">
      <div className="error-icon">❌</div>
      <h3>Couldn't switch</h3>
      <p className="error-message">{errorMessage}</p>
      <div className="error-actions">
        <button className="btn btn-secondary" onClick={handleRetry}>
          Try Again
        </button>
        <button className="btn btn-primary" onClick={onClose}>
          Check Settings
        </button>
      </div>
    </div>
  );

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-container" onClick={(e) => e.stopPropagation()}>
        {step === 'selection' && renderSelection()}
        {step === 'confirm' && renderConfirm()}
        {step === 'loading' && renderLoading()}
        {step === 'success' && renderSuccess()}
        {step === 'error' && renderError()}
      </div>
    </div>
  );
}

export default ModelWizard;