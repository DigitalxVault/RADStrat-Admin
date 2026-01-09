import type { ScoreResult } from '../types';

// Warning Icon Component
const WarningIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}
  >
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>
);

interface ScoreDisplayProps {
  score: ScoreResult | null;
  isLoading?: boolean;
}

function ScoreDisplay({ score, isLoading }: ScoreDisplayProps) {
  if (isLoading) {
    return (
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Score</h4>
        <div className="text-center" style={{ padding: 'var(--space-lg)' }}>
          <p className="text-muted">Evaluating your response...</p>
        </div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Score</h4>
        <div className="text-center" style={{ padding: 'var(--space-lg)' }}>
          <p className="text-muted">Complete a recording to see your score.</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'var(--accent-success)';
    if (value >= 60) return 'var(--accent-yellow)';
    return 'var(--accent-danger)';
  };

  return (
    <div className="paper-card">
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
        <h4>Score</h4>
        <span
          className="mono"
          style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-sm)',
            background: score.passed ? 'var(--accent-success)' : 'var(--accent-danger)',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {score.passed ? 'PASS' : <><WarningIcon />FAILED</>}
        </span>
      </div>

      {/* Overall Score */}
      <div
        className="text-center"
        style={{
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-md)',
          background: 'var(--surface-paper-2)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <h1
          style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            color: getScoreColor(score.overallScore),
            lineHeight: 1
          }}
        >
          {score.overallScore}
        </h1>
        <p className="mono text-small text-muted">Overall Score</p>
      </div>

      {/* Component Scores */}
      <div className="grid grid-cols-3 gap-md" style={{ marginBottom: 'var(--space-md)' }}>
        <ScoreCard
          label="Accuracy"
          value={score.accuracyScore}
          color={getScoreColor(score.accuracyScore)}
        />
        <ScoreCard
          label="Fluency"
          value={score.fluencyScore}
          color={getScoreColor(score.fluencyScore)}
        />
        <ScoreCard
          label="Structure"
          value={score.structureScore}
          color={getScoreColor(score.structureScore)}
        />
      </div>

      {/* Reasons */}
      {score.reasons && Object.keys(score.reasons).length > 0 && (
        <div>
          <h5 style={{ marginBottom: 'var(--space-sm)' }}>Why not 100%?</h5>
          <div className="paper-card-2">
            {Object.entries(score.reasons).map(([category, reasons]) => (
              reasons.length > 0 && (
                <div key={category} style={{ marginBottom: 'var(--space-sm)' }}>
                  <p className="mono text-small" style={{ fontWeight: 'bold', marginBottom: '4px', color: 'white' }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}:
                  </p>
                  <ul style={{ paddingLeft: 'var(--space-md)', margin: 0 }}>
                    {reasons.map((reason: string, i: number) => (
                      <li key={i} className="text-small" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="paper-card-2 text-center">
      <h3 style={{ color, marginBottom: 'var(--space-xs)' }}>{value}</h3>
      <p className="mono text-small" style={{ color: 'white' }}>{label}</p>
    </div>
  );
}

export default ScoreDisplay;
