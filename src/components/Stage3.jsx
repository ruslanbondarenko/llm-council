import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  let data = finalResponse;

  if (typeof finalResponse === 'string') {
    try {
      const parsed = JSON.parse(finalResponse);
      if (parsed && typeof parsed === 'object' && 'response' in parsed) {
        data = parsed;
      }
    } catch (e) {
      data = finalResponse;
    }
  }

  const isObject = typeof data === 'object' && data !== null;
  const modelName = isObject && data.model
    ? (data.model.split('/')[1] || data.model)
    : 'Unknown';
  const responseText = isObject ? (data.response || '') : data;

  return (
    <div className="stage stage3">
      <h3 className="stage-title">Stage 3: Final Council Answer</h3>
      <div className="final-response">
        {isObject && data.model && (
          <div className="chairman-label">
            Chairman: {modelName}
          </div>
        )}
        <div className="final-text markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{responseText}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
