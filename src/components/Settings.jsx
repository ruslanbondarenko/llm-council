import { useState } from 'react';
import './Settings.css';
import { AVAILABLE_MODELS, DEFAULT_COUNCIL_MODELS, DEFAULT_CHAIRMAN_MODEL } from '../config/models.js';

export { DEFAULT_COUNCIL_MODELS, DEFAULT_CHAIRMAN_MODEL };

export default function Settings({ isOpen, onClose, councilModels, chairmanModel, onSave }) {
  const [selectedCouncil, setSelectedCouncil] = useState(councilModels);
  const [selectedChairman, setSelectedChairman] = useState(chairmanModel);
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('openrouter_api_key') || '';
  });

  if (!isOpen) return null;

  const handleCouncilToggle = (modelId) => {
    setSelectedCouncil((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      return [...prev, modelId];
    });
  };

  const handleSave = () => {
    localStorage.setItem('openrouter_api_key', apiKey);
    onSave(selectedCouncil, selectedChairman);
    onClose();
  };

  const handleReset = () => {
    setSelectedCouncil(DEFAULT_COUNCIL_MODELS);
    setSelectedChairman(DEFAULT_CHAIRMAN_MODEL);
  };

  const groupedModels = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {});

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
              Select which models participate in the council deliberation.
              At least one model must be selected.
            </p>
            <div className="model-groups">
              {Object.entries(groupedModels).map(([provider, models]) => (
                <div key={provider} className="model-group">
                  <h4>{provider}</h4>
                  {models.map((model) => (
                    <label key={model.id} className="model-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCouncil.includes(model.id)}
                        onChange={() => handleCouncilToggle(model.id)}
                      />
                      <span>{model.name}</span>
                    </label>
                  ))}
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
              disabled={selectedCouncil.length === 0}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
