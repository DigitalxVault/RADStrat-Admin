interface TranscriptDisplayProps {
  interimTranscript: string;
  finalTranscript: string;
  isRecording: boolean;
  expectedAnswer?: string;
}

function TranscriptDisplay({
  interimTranscript,
  finalTranscript,
  isRecording,
  expectedAnswer
}: TranscriptDisplayProps) {
  const hasContent = interimTranscript || finalTranscript;

  return (
    <div className="paper-card">
      <h4 style={{ marginBottom: 'var(--space-md)' }}>
        Transcript
        {isRecording && (
          <span
            className="mono text-small"
            style={{
              marginLeft: 'var(--space-sm)',
              color: 'var(--accent-danger)',
              animation: 'pulse 1s infinite'
            }}
          >
            RECORDING
          </span>
        )}
      </h4>

      <div
        className="paper-card-2"
        style={{
          minHeight: '120px',
          position: 'relative'
        }}
      >
        {!hasContent ? (
          <p className="text-muted text-center" style={{ paddingTop: 'var(--space-lg)' }}>
            {isRecording
              ? 'Listening... Speak now.'
              : 'Start recording to see your transcript here.'}
          </p>
        ) : (
          <div className="mono">
            {finalTranscript && (
              <span style={{ color: 'var(--text-ink)' }}>
                {finalTranscript}
              </span>
            )}
            {interimTranscript && (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {finalTranscript ? ' ' : ''}{interimTranscript}
              </span>
            )}
          </div>
        )}
      </div>

      {expectedAnswer && finalTranscript && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <h5 style={{ marginBottom: 'var(--space-sm)' }}>Comparison</h5>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <p className="label">Your Response</p>
              <div className="paper-card-2">
                <p className="mono text-small" style={{ color: 'white' }}>{finalTranscript}</p>
              </div>
            </div>
            <div>
              <p className="label">Expected Answer</p>
              <div className="paper-card-2">
                <p className="mono text-small" style={{ color: 'white' }}>{expectedAnswer}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default TranscriptDisplay;
