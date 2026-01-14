import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage1.css';

function deAnonymizeText(text, labelToModel) {
  if (!labelToModel) return text;

  let result = text;
  Object.entries(labelToModel).forEach(([label, model]) => {
    const modelShortName = model.split('/')[1] || model;
    result = result.replace(new RegExp(label, 'g'), `**${modelShortName}**`);
  });
  return result;
}

export default function Stage1({ responses, rankings, labelToModel }) {
  const [activeTab, setActiveTab] = useState(0);
  const [showDetails, setShowDetails] = useState({});

  if (!responses || responses.length === 0) {
    return null;
  }

  const toggleDetails = (modelName) => {
    setShowDetails(prev => ({
      ...prev,
      [modelName]: !prev[modelName]
    }));
  };

  const getCurrentModelRanking = () => {
    if (!rankings) return null;
    const currentModel = responses[activeTab].model;
    return rankings.find(rank => rank.model === currentModel);
  };

  const currentRanking = getCurrentModelRanking();
  const currentModel = responses[activeTab].model;
  const isDetailsOpen = showDetails[currentModel] || false;

  return (
    <div className="stage stage1">
      <h3 className="stage-title">Stage 1: Individual Responses</h3>

      <div className="tabs">
        {responses.map((resp, index) => {
          const modelName = resp.model
            ? (resp.model.split('/')[1] || resp.model)
            : `Model ${index + 1}`;
          return (
            <button
              key={index}
              className={`tab ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {modelName}
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        <div className="model-name">{responses[activeTab].model || 'Unknown Model'}</div>
        <div className="response-text markdown-content">
          <ReactMarkdown>{responses[activeTab].response || ''}</ReactMarkdown>
        </div>

        {currentRanking && (
          <div className="details-section">
            <button
              className="details-toggle"
              onClick={() => toggleDetails(currentModel)}
            >
              {isDetailsOpen ? '▼' : '▶'} Подробнее: Как эта модель оценивала других
            </button>

            {isDetailsOpen && (
              <div className="details-content">
                <h4>Оценка других ответов</h4>
                <p className="details-description">
                  Ниже показано, как эта модель оценивала все ответы (включая свой собственный).
                  Модель получила ответы в анонимном виде (Response A, B, C и т.д.).
                </p>
                <div className="ranking-evaluation markdown-content">
                  <ReactMarkdown>
                    {deAnonymizeText(currentRanking.ranking, labelToModel)}
                  </ReactMarkdown>
                </div>

                {currentRanking.parsed_ranking && currentRanking.parsed_ranking.length > 0 && (
                  <div className="parsed-ranking">
                    <strong>Итоговое ранжирование:</strong>
                    <ol>
                      {currentRanking.parsed_ranking.map((label, i) => (
                        <li key={i}>
                          {labelToModel && labelToModel[label]
                            ? labelToModel[label].split('/')[1] || labelToModel[label]
                            : label}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
