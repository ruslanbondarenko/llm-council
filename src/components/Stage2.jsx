import { useState } from 'react';
import './Stage2.css';

export default function Stage2({ aggregateRankings }) {
  const [isExpanded, setIsExpanded] = useState(false);

  console.log('Stage2 component received aggregateRankings:', aggregateRankings);
  console.log('aggregateRankings is array?', Array.isArray(aggregateRankings));
  console.log('aggregateRankings length:', aggregateRankings?.length);

  if (!aggregateRankings || aggregateRankings.length === 0) {
    console.log('Stage2: No aggregate rankings, showing fallback');
    return (
      <div className="stage stage2">
        <h3 className="stage-title">Stage 2: Peer Rankings</h3>
        <p className="stage-description">Calculating aggregate rankings...</p>
      </div>
    );
  }

  return (
    <div className="stage stage2">
      <h3 className="stage-title">Stage 2: Peer Rankings</h3>

      <div className="aggregate-rankings">
        <button
          className="details-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'} Aggregate Rankings (Street Cred)
        </button>

        {isExpanded && (
          <div className="aggregate-content">
            <p className="stage-description">
              Combined results across all peer evaluations (lower score is better):
            </p>
            <div className="aggregate-list">
              {aggregateRankings.map((agg, index) => {
                const modelName = agg.model
                  ? (agg.model.split('/')[1] || agg.model)
                  : 'Unknown Model';
                return (
                  <div key={index} className="aggregate-item">
                    <span className="rank-position">#{index + 1}</span>
                    <span className="rank-model">
                      {modelName}
                    </span>
                    <span className="rank-score">
                      Avg: {agg.average_rank?.toFixed(2) || 'N/A'}
                    </span>
                    <span className="rank-count">
                      ({agg.rankings_count || 0} votes)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
