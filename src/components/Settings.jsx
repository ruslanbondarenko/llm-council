import { useState } from 'react';
import './Settings.css';
import { AVAILABLE_MODELS, DEFAULT_COUNCIL_MODELS, DEFAULT_CHAIRMAN_MODEL } from '../config/models.js';

export { DEFAULT_COUNCIL_MODELS, DEFAULT_CHAIRMAN_MODEL };

export default function Settings({ isOpen, onClose, councilModels, chairmanModel, onSave }) {
  const initializeSlots = (models) => {
    return models.map(modelId => {
      const model = AVAILABLE_MODELS.find(m => m.id === modelId);
      return {
        provider: model?.provider || '',
        modelId: modelId
      };
    });
  };

  const [councilSlots, setCouncilSlots] = useState(() => initializeSlots(councilModels));
  const [selectedChairman, setSelectedChairman] = useState(chairmanModel);
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('openrouter_api_key') || '';
  });

  if (!isOpen) return null;

  const providers = [...new Set(AVAILABLE_MODELS.map(m => m.provider))];

  const getAvailableProviders = (slotIndex) => {
    const usedProviders = councilSlots
      .map((slot, idx) => idx !== slotIndex ? slot.provider : null)
      .filter(p => p);
    return providers.filter(p => !usedProviders.includes(p));
  };

  const getModelsForProvider = (provider) => {
    return AVAILABLE_MODELS.filter(m => m.provider === provider);
  };

  const handleProviderChange = (slotIndex, newProvider) => {
    setCouncilSlots(prev => {
      const newSlots = [...prev];
      const modelsForProvider = getModelsForProvider(newProvider);
      newSlots[slotIndex] = {
        provider: newProvider,
        modelId: modelsForProvider[0]?.id || ''
      };
      return newSlots;
    });
  };

  const handleModelChange = (slotIndex, newModelId) => {
    setCouncilSlots(prev => {
      const newSlots = [...prev];
      newSlots[slotIndex] = {
        ...newSlots[slotIndex],
        modelId: newModelId
      };
      return newSlots;
    });
  };

  const handleSave = () => {
    localStorage.setItem('openrouter_api_key', apiKey);
    const selectedModels = councilSlots.map(slot => slot.modelId);
    onSave(selectedModels, selectedChairman);
    onClose();
  };

  const handleReset = () => {
    setCouncilSlots(initializeSlots(DEFAULT_COUNCIL_MODELS));
    setSelectedChairman(DEFAULT_CHAIRMAN_MODEL);
  };

  const isValidSelection = councilSlots.every(slot => slot.provider && slot.modelId);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Model Settings</h2>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>OpenRouter API Key</h3>
            <p className="settings-description">
              Enter your OpenRouter API key. Get one at{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                openrouter.ai/keys
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="api-key-input"
            />
          </section>

          <section className="settings-section">
            <h3>Council Models (Stage 1 & 2)</h3>
            <p className="settings-description">
              Select one model from each provider. Exactly 4 models must be selected.
            </p>
            <div className="council-slots">
              {councilSlots.map((slot, index) => (
                <div key={index} className="council-slot">
                  <span className="slot-number">{index + 1}.</span>
                  <select
                    value={slot.provider}
                    onChange={(e) => handleProviderChange(index, e.target.value)}
                    className="provider-select"
                  >
                    <option value="">Select Provider</option>
                    {slot.provider && !getAvailableProviders(index).includes(slot.provider) && (
                      <option value={slot.provider}>{slot.provider}</option>
                    )}
                    {getAvailableProviders(index).map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                  <select
                    value={slot.modelId}
                    onChange={(e) => handleModelChange(index, e.target.value)}
                    className="model-select"
                    disabled={!slot.provider}
                  >
                    <option value="">Select Model</option>
                    {slot.provider && getModelsForProvider(slot.provider).map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3>Chairman Model (Stage 3)</h3>
            <p className="settings-description">
              Select which model synthesizes the final answer.
            </p>
            <select
              value={selectedChairman}
              onChange={(e) => setSelectedChairman(e.target.value)}
              className="chairman-select"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.provider}: {model.name}
                </option>
              ))}
            </select>
          </section>
        </div>

        <div className="settings-footer">
          <button className="reset-btn" onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className="footer-right">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={!isValidSelection}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
