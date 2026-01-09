import { useTelemetry } from '../hooks/useTelemetry';

function Telemetry() {
  const { telemetry, runs, clearTelemetry } = useTelemetry();

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Session Overview */}
      <div className="paper-card">
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
          <h2>Session Telemetry</h2>
          <button className="btn btn-secondary" onClick={clearTelemetry}>
            Clear Session
          </button>
        </div>

        <div className="grid grid-cols-4 gap-md">
          <div className="paper-card-2 text-center">
            <h3 style={{ marginBottom: 'var(--space-xs)' }}>
              {telemetry.runCount}
            </h3>
            <p className="mono text-small text-muted">Total Runs</p>
          </div>

          <div className="paper-card-2 text-center">
            <h3 style={{ marginBottom: 'var(--space-xs)' }}>
              {formatMs(telemetry.averageLatencyMs)}
            </h3>
            <p className="mono text-small text-muted">Avg Latency</p>
          </div>

          <div className="paper-card-2 text-center">
            <h3 style={{ marginBottom: 'var(--space-xs)' }}>
              {telemetry.errorCount}
            </h3>
            <p className="mono text-small text-muted">Errors</p>
          </div>

          <div className="paper-card-2 text-center">
            <h3 style={{ marginBottom: 'var(--space-xs)', color: 'var(--accent-yellow)' }}>
              {formatCost(telemetry.totalCost)}
            </h3>
            <p className="mono text-small text-muted">Est. Cost</p>
          </div>
        </div>
      </div>

      {/* Latency Breakdown */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Latency Analysis</h4>

        {runs.length === 0 ? (
          <p className="text-muted">No runs recorded yet. Complete some STT tests to see latency data.</p>
        ) : (
          <div className="grid grid-cols-2 gap-lg">
            <div>
              <h5 style={{ marginBottom: 'var(--space-sm)' }}>Distribution</h5>
              <div className="paper-card-2">
                <div className="flex justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                  <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>Min</span>
                  <span className="mono text-small">
                    {formatMs(Math.min(...runs.map(r => r.telemetry.totalLatencyMs)))}
                  </span>
                </div>
                <div className="flex justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                  <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>Avg</span>
                  <span className="mono text-small">
                    {formatMs(telemetry.averageLatencyMs)}
                  </span>
                </div>
                <div className="flex justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                  <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>P95</span>
                  <span className="mono text-small">
                    {formatMs(telemetry.p95LatencyMs)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>Max</span>
                  <span className="mono text-small">
                    {formatMs(Math.max(...runs.map(r => r.telemetry.totalLatencyMs)))}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 style={{ marginBottom: 'var(--space-sm)' }}>Average Breakdown</h5>
              <div className="paper-card-2">
                {runs.length > 0 && (
                  <>
                    <div className="flex justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                      <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>Connect</span>
                      <span className="mono text-small">
                        {formatMs(runs.reduce((sum, r) => sum + r.telemetry.connectTimeMs, 0) / runs.length)}
                      </span>
                    </div>
                    <div className="flex justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                      <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>First Text</span>
                      <span className="mono text-small">
                        {formatMs(runs.reduce((sum, r) => sum + r.telemetry.timeToFirstTextMs, 0) / runs.length)}
                      </span>
                    </div>
                    <div className="flex justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                      <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>Final</span>
                      <span className="mono text-small">
                        {formatMs(runs.reduce((sum, r) => sum + r.telemetry.timeToFinalMs, 0) / runs.length)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>Evaluator</span>
                      <span className="mono text-small">
                        {formatMs(runs.reduce((sum, r) => sum + r.telemetry.evaluatorLatencyMs, 0) / runs.length)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Errors */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Errors by Type</h4>

        {Object.keys(telemetry.errorsByType).length === 0 ? (
          <p className="text-muted">No errors recorded.</p>
        ) : (
          <div className="paper-card-2">
            {Object.entries(telemetry.errorsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
                <span className="mono text-small">{type}</span>
                <span className="mono text-small" style={{ color: 'var(--accent-danger)' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="paper-card">
        <h4 style={{ marginBottom: 'var(--space-md)' }}>Cost Estimate</h4>

        <div className="ink-bar" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="text-small">
            Total session cost: <strong>{formatCost(telemetry.totalCost)}</strong>
          </span>
        </div>

        {runs.length > 0 && (
          <div className="paper-card-2">
            <div className="flex justify-between" style={{ marginBottom: 'var(--space-xs)' }}>
              <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>Per Run (Avg)</span>
              <span className="mono text-small">
                {formatCost(telemetry.totalCost / runs.length)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="mono text-small" style={{ color: 'var(--accent-yellow)' }}>Runs</span>
              <span className="mono text-small">{runs.length}</span>
            </div>
          </div>
        )}

        <p className="text-small text-muted" style={{ marginTop: 'var(--space-sm)' }}>
          Cost estimated based on audio duration and evaluator tokens.
          Actual billing may vary.
        </p>
      </div>
    </div>
  );
}

export default Telemetry;
