import { useState } from 'react';
import './Settings.css';

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI' },
  { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI' },
];

export const DEFAULT_COUNCIL_MODELS = [
  'openai/gpt-4o-mini',
  'google/gemini-2.5-flash',
  'anthropic/claude-haiku-4.5',
  'x-ai/grok-4.1-fast',
];

export const DEFAULT_CHAIRMAN_MODEL = 'openai/gpt-5.1';

export default function Settings({ isOpen, onClose, councilModels, chairmanModel, onSave }) {
  const [selectedCouncil, setSelectedCouncil] = useState(councilModels);
  const [selectedChairman, setSelectedChairman] = useState(chairmanModel);

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
