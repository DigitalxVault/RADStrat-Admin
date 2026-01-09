import { useProfile } from '../hooks/useProfile';

function Scoring() {
  const { activeProfile } = useProfile();

  if (!activeProfile) {
    return (
      <div className="paper-card">
        <p>Loading profile...</p>
      </div>
    );
  }

  const weights = activeProfile.weights;

  return (
    <div className="flex flex-col gap-lg">
      {/* Overview */}
      <div className="paper-card">
        <h2 style={{ marginBottom: 'var(--space-md)' }}>Scoring Overview</h2>
        <p className="text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
          The overall score is calculated using a weighted average of three components.
          Each component is scored 0-100 by the LLM evaluator.
        </p>

        <div className="ink-bar" style={{ marginBottom: 'var(--space-lg)' }}>
          <code>
            overall = ({weights.accuracy} × accuracy) + ({weights.fluency} × fluency) + ({weights.structure} × structure)
          </code>
        </div>

        <div className="grid grid-cols-3 gap-lg">
          <div className="paper-card-2 text-center">
            <h3 style={{ color: 'var(--accent-yellow)', marginBottom: 'var(--space-xs)' }}>
              {Math.round(weights.accuracy * 100)}%
            </h3>
            <h5>Accuracy</h5>
            <p className="text-small text-muted">Content match</p>
          </div>
          <div className="paper-card-2 text-center">
            <h3 style={{ color: 'var(--accent-yellow)', marginBottom: 'var(--space-xs)' }}>
              {Math.round(weights.fluency * 100)}%
            </h3>
            <h5>Fluency</h5>
            <p className="text-small text-muted">Speech clarity</p>
          </div>
          <div className="paper-card-2 text-center">
            <h3 style={{ color: 'var(--accent-yellow)', marginBottom: 'var(--space-xs)' }}>
              {Math.round(weights.structure * 100)}%
            </h3>
            <h5>Structure</h5>
            <p className="text-small text-muted">Format compliance</p>
          </div>
        </div>
      </div>

      {/* Accuracy Details */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Accuracy Scoring</h4>
        <p style={{ marginBottom: 'var(--space-md)' }}>
          Measures how well the spoken content matches the expected answer.
          Both the transcript and expected answer are normalized before comparison.
        </p>

        <div className="paper-card-2">
          <h5 style={{ marginBottom: 'var(--space-sm)' }}>Normalization Applied</h5>
          <ul style={{ paddingLeft: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <li className={activeProfile.normalization.ignorePunctuation ? '' : 'text-muted'}>
              {activeProfile.normalization.ignorePunctuation ? '✓' : '✗'} Punctuation removal
            </li>
            <li className={activeProfile.normalization.digitWordEquivalence ? '' : 'text-muted'}>
              {activeProfile.normalization.digitWordEquivalence ? '✓' : '✗'} Digit/word equivalence (1 = one, 2 = two)
            </li>
            <li className={activeProfile.normalization.rtNumberVariants ? '' : 'text-muted'}>
              {activeProfile.normalization.rtNumberVariants ? '✓' : '✗'} R/T variants (niner = 9, tree = 3)
            </li>
          </ul>
        </div>

        <p className="text-small text-muted" style={{ marginTop: 'var(--space-md)' }}>
          Note: Digit/word differences do not reduce accuracy when equivalence is enabled.
        </p>
      </div>

      {/* Fluency Details */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Fluency Scoring</h4>
        <p style={{ marginBottom: 'var(--space-md)' }}>
          Evaluates speech clarity based on filler words, pauses, and speaking pace.
        </p>

        <div className="grid grid-cols-2 gap-md">
          <div className="paper-card-2">
            <h5 style={{ marginBottom: 'var(--space-sm)' }}>Filler Words</h5>
            <p className="text-small">
              Penalty: <strong>{activeProfile.fluency.fillerPenaltyPerWord}</strong> per word
              (capped at {activeProfile.fluency.fillerPenaltyCap})
            </p>
            <p className="mono text-small text-muted" style={{ marginTop: 'var(--space-xs)' }}>
              {activeProfile.fluency.fillerWords.slice(0, 5).join(', ')}
              {activeProfile.fluency.fillerWords.length > 5 && ` +${activeProfile.fluency.fillerWords.length - 5} more`}
            </p>
          </div>

          <div className="paper-card-2">
            <h5 style={{ marginBottom: 'var(--space-sm)' }}>Pauses</h5>
            <p className="text-small">
              Normal pause: &gt;{activeProfile.fluency.pauseThresholdMs}ms
              (penalty: {activeProfile.fluency.pausePenalty})
            </p>
            <p className="text-small">
              Long pause: &gt;{activeProfile.fluency.longPauseThresholdMs}ms
              (penalty: {activeProfile.fluency.longPausePenalty})
            </p>
          </div>
        </div>
      </div>

      {/* Structure Details */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Structure Scoring</h4>
        <p style={{ marginBottom: 'var(--space-md)' }}>
          Checks for proper radio/telephone communication format. Requirements vary per question.
        </p>

        <div className="paper-card-2">
          <h5 style={{ marginBottom: 'var(--space-sm)' }}>Structure Components</h5>
          <ul style={{ paddingLeft: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <li><strong style={{ color: 'var(--accent-yellow)' }}>[Receiver Callsign]</strong> — Who you're calling</li>
            <li><strong style={{ color: 'var(--accent-yellow)' }}>[Sender Callsign]</strong> — Your identifier</li>
            <li><strong style={{ color: 'var(--accent-yellow)' }}>[Current Location]</strong> — When scenario requires it</li>
            <li><strong style={{ color: 'var(--accent-yellow)' }}>[Intent / Information]</strong> — The message content</li>
            <li className="text-muted">[Closing] — Over/Out (optional, not scored)</li>
          </ul>
        </div>
      </div>

      {/* Pass/Fail */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Pass Criteria</h4>
        <div className="ink-bar">
          Overall score must be ≥ <strong>{activeProfile.benchmarks.passMarkOverall}%</strong> to pass
        </div>

        {activeProfile.benchmarks.minPerSection && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <p className="text-small text-muted">Minimum per section (if set):</p>
            <ul className="text-small" style={{ paddingLeft: 'var(--space-md)' }}>
              {activeProfile.benchmarks.minPerSection.accuracy && (
                <li>Accuracy: {activeProfile.benchmarks.minPerSection.accuracy}%</li>
              )}
              {activeProfile.benchmarks.minPerSection.fluency && (
                <li>Fluency: {activeProfile.benchmarks.minPerSection.fluency}%</li>
              )}
              {activeProfile.benchmarks.minPerSection.structure && (
                <li>Structure: {activeProfile.benchmarks.minPerSection.structure}%</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scoring;
