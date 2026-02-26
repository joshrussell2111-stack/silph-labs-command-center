import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ModelWizard from './components/ModelWizard';

function App() {
  const [showWizard, setShowWizard] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentModel();
  }, []);

  const loadCurrentModel = async () => {
    try {
      // Check localStorage first for instant UI
      const cached = localStorage.getItem('ash_current_model');
      if (cached) {
        setCurrentModel(JSON.parse(cached));
      }

      // Fetch from API to verify
      const response = await fetch('/api/models/current');
      if (response.ok) {
        const model = await response.json();
        setCurrentModel(model);
        localStorage.setItem('ash_current_model', JSON.stringify(model));
      } else {
        // Use mock data if API fails
        const mockModel = {
          modelId: 'moonshot/kimi-k2.5',
          name: 'Kimi K2.5',
          provider: 'Moonshot AI',
          pricing: { type: 'free' },
          features: { speed: 'fast', bestFor: 'most tasks' }
        };
        setCurrentModel(mockModel);
        localStorage.setItem('ash_current_model', JSON.stringify(mockModel));
      }
    } catch (error) {
      console.error('Failed to load current model:', error);
      // Use mock data on error
      const mockModel = {
        modelId: 'moonshot/kimi-k2.5',
        name: 'Kimi K2.5',
        provider: 'Moonshot AI',
        pricing: { type: 'free' },
        features: { speed: 'fast', bestFor: 'most tasks' }
      };
      setCurrentModel(mockModel);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (newModel) => {
    setCurrentModel(newModel);
    localStorage.setItem('ash_current_model', JSON.stringify(newModel));
  };

  return (
    <div className="app">
      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          <Dashboard 
            currentModel={currentModel} 
            onChangeModel={() => setShowWizard(true)}
          />
          {showWizard && (
            <ModelWizard 
              currentModel={currentModel}
              onClose={() => setShowWizard(false)}
              onModelChange={handleModelChange}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;