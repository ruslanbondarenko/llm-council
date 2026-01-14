import ReactMarkdown from 'react-markdown';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  const isString = typeof finalResponse === 'string';
  const modelName = !isString && finalResponse.model
    ? (finalResponse.model.split('/')[1] || finalResponse.model)
    : 'Unknown';
  const responseText = isString ? finalResponse : (finalResponse.response || '');

  return (
    <div className="stage stage3">
      <h3 className="stage-title">Stage 3: Final Council Answer</h3>
      <div className="final-response">
        {!isString && (
          <div className="chairman-label">
            Chairman: {modelName}
          </div>
        )}
        <div className="final-text markdown-content">
          <ReactMarkdown>{responseText}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
