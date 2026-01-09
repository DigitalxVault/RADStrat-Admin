import type { Question } from '../types';

interface QuestionPanelProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onShuffle?: () => void;
}

function QuestionPanel({
  question,
  questionNumber,
  totalQuestions,
  onNext,
  onPrevious,
  onShuffle
}: QuestionPanelProps) {
  return (
    <div className="paper-card">
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm">
          <span className="mono text-small text-muted">
            Question {questionNumber} of {totalQuestions}
          </span>
          {question.tags && question.tags.length > 0 && (
            <div className="flex gap-xs">
              {question.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="mono text-small"
                  style={{
                    padding: '2px 8px',
                    background: 'var(--surface-paper-2)',
                    borderRadius: 'var(--radius-xs)'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-xs">
          <button
            className="btn btn-ghost text-small"
            onClick={onPrevious}
            disabled={questionNumber <= 1}
          >
            Prev
          </button>
          <button
            className="btn btn-ghost text-small"
            onClick={onNext}
            disabled={questionNumber >= totalQuestions}
          >
            Next
          </button>
          <button
            className="btn btn-ghost text-small"
            onClick={onShuffle}
          >
            Shuffle
          </button>
        </div>
      </div>

      <div className="ink-bar" style={{ marginBottom: 'var(--space-md)' }}>
        <p className="mono text-small" style={{ opacity: 0.7 }}>
          ID: {question.id}
        </p>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h4 style={{ marginBottom: 'var(--space-sm)' }}>Scenario</h4>
        <p style={{ lineHeight: 1.6 }}>{question.scenarioPrompt}</p>
      </div>

      {question.hints && question.hints.length > 0 && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h5 style={{ marginBottom: 'var(--space-sm)', color: 'var(--accent-yellow)' }}>
            Hints
          </h5>
          <ul style={{ paddingLeft: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {question.hints.map((hint: string, i: number) => (
              <li key={i} className="text-small text-muted">{hint}</li>
            ))}
          </ul>
        </div>
      )}

      <details style={{ marginTop: 'var(--space-md)' }}>
        <summary className="mono text-small" style={{ cursor: 'pointer', color: 'var(--accent-yellow)' }}>
          Show Expected Answer
        </summary>
        <div className="paper-card-2" style={{ marginTop: 'var(--space-sm)' }}>
          <p className="mono text-small">{question.expectedAnswer.text}</p>
          {question.expectedAnswer.variants && question.expectedAnswer.variants.length > 0 && (
            <div style={{ marginTop: 'var(--space-sm)' }}>
              <p className="text-small text-muted" style={{ marginBottom: 'var(--space-xs)' }}>
                Acceptable variants:
              </p>
              <ul style={{ paddingLeft: 'var(--space-md)' }}>
                {question.expectedAnswer.variants.map((variant: string, i: number) => (
                  <li key={i} className="mono text-small text-muted">{variant}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

export default QuestionPanel;
