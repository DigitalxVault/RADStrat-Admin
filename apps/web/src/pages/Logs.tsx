import { useState, useMemo } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import type { TestRun } from '../types';

function Logs() {
  const { runs, clearTelemetry } = useTelemetry();
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'score' | 'latency'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  const filteredAndSortedRuns = useMemo(() => {
    let result = [...runs];

    // Filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(run =>
        run.questionId.toLowerCase().includes(lowerFilter) ||
        run.transcript.raw.toLowerCase().includes(lowerFilter) ||
        run.status.toLowerCase().includes(lowerFilter)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'score':
          comparison = a.score.overallScore - b.score.overallScore;
          break;
        case 'latency':
          comparison = a.telemetry.totalLatencyMs - b.telemetry.totalLatencyMs;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [runs, filter, sortBy, sortOrder]);

  const handleExportJSON = () => {
    const data = runs.map(run => ({
      ...run,
      // Redact any sensitive data
      telemetry: {
        ...run.telemetry,
        // Remove any internal IDs if present
      }
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stt-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID', 'Question ID', 'Timestamp', 'Status',
      'Accuracy', 'Fluency', 'Structure', 'Overall',
      'Passed', 'Latency (ms)', 'Cost'
    ];
    const rows = runs.map(run => [
      run.id,
      run.questionId,
      run.timestamp,
      run.status,
      run.score.accuracyScore,
      run.score.fluencyScore,
      run.score.structureScore,
      run.score.overallScore,
      run.score.passed ? 'Yes' : 'No',
      run.telemetry.totalLatencyMs,
      run.telemetry.estimatedCost.toFixed(4)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stt-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Controls */}
      <div className="paper-card">
        <div className="flex justify-between items-center gap-md">
          <div className="flex gap-md items-center" style={{ flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="Filter by question ID, transcript, or status..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ maxWidth: '400px' }}
            />

            <select
              className="input select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{ width: 'auto' }}
            >
              <option value="timestamp">Sort by Time</option>
              <option value="score">Sort by Score</option>
              <option value="latency">Sort by Latency</option>
            </select>

            <button
              className="btn btn-ghost"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>

          <div className="flex gap-sm">
            <button className="btn btn-secondary" onClick={handleExportJSON}>
              Export JSON
            </button>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              Export CSV
            </button>
            <button className="btn btn-danger" onClick={clearTelemetry}>
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="paper-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredAndSortedRuns.length === 0 ? (
          <div style={{ padding: 'var(--space-lg)' }}>
            <p className="text-muted text-center">
              {runs.length === 0
                ? 'No test runs recorded yet. Complete some STT tests to see logs.'
                : 'No runs match your filter.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-paper-2)' }}>
                  <th className="mono text-small" style={{ padding: 'var(--space-sm)', textAlign: 'left', color: 'var(--accent-yellow)' }}>Time</th>
                  <th className="mono text-small" style={{ padding: 'var(--space-sm)', textAlign: 'left', color: 'var(--accent-yellow)' }}>Question</th>
                  <th className="mono text-small" style={{ padding: 'var(--space-sm)', textAlign: 'center', color: 'var(--accent-yellow)' }}>Status</th>
                  <th className="mono text-small" style={{ padding: 'var(--space-sm)', textAlign: 'center', color: 'var(--accent-yellow)' }}>Score</th>
                  <th className="mono text-small" style={{ padding: 'var(--space-sm)', textAlign: 'right', color: 'var(--accent-yellow)' }}>Latency</th>
                  <th className="mono text-small" style={{ padding: 'var(--space-sm)', textAlign: 'right', color: 'var(--accent-yellow)' }}>Cost</th>
                  <th style={{ padding: 'var(--space-sm)', width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRuns.map((run) => (
                  <tr
                    key={run.id}
                    style={{
                      borderTop: '1px solid var(--stroke)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedRun(run)}
                  >
                    <td className="mono text-small" style={{ padding: 'var(--space-sm)' }}>
                      {formatTimestamp(run.timestamp)}
                    </td>
                    <td className="mono text-small" style={{ padding: 'var(--space-sm)' }}>
                      {run.questionId.slice(0, 8)}...
                    </td>
                    <td style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                      <span
                        className="mono text-small"
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          background: run.status === 'success'
                            ? 'var(--accent-success)'
                            : run.status === 'timeout'
                              ? 'var(--accent-yellow)'
                              : 'var(--accent-danger)',
                          color: run.status === 'timeout' ? 'var(--text-ink)' : 'white'
                        }}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: run.score.passed ? 'var(--accent-success)' : 'var(--accent-danger)'
                        }}
                      >
                        {run.score.overallScore}
                      </span>
                    </td>
                    <td className="mono text-small" style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>
                      {run.telemetry.totalLatencyMs}ms
                    </td>
                    <td className="mono text-small" style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>
                      ${run.telemetry.estimatedCost.toFixed(4)}
                    </td>
                    <td style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                      <button className="btn btn-ghost text-small">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Run Detail Modal */}
      {selectedRun && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-lg)'
          }}
          onClick={() => setSelectedRun(null)}
        >
          <div
            className="paper-card"
            style={{ maxWidth: '800px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
              <h4>Run Details</h4>
              <button className="btn btn-ghost" onClick={() => setSelectedRun(null)}>
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-md" style={{ marginBottom: 'var(--space-md)' }}>
              <div>
                <p className="label">Question ID</p>
                <p className="mono text-small">{selectedRun.questionId}</p>
              </div>
              <div>
                <p className="label">Timestamp</p>
                <p className="mono text-small">{formatTimestamp(selectedRun.timestamp)}</p>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <p className="label">Transcript (Raw)</p>
              <div className="paper-card-2">
                <p className="mono text-small">{selectedRun.transcript.raw || '(empty)'}</p>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <p className="label">Expected Answer</p>
              <div className="paper-card-2">
                <p className="mono text-small">{selectedRun.expectedAnswer.raw}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
              <div className="paper-card-2 text-center">
                <h5>{selectedRun.score.accuracyScore}</h5>
                <p className="text-small text-muted">Accuracy</p>
              </div>
              <div className="paper-card-2 text-center">
                <h5>{selectedRun.score.fluencyScore}</h5>
                <p className="text-small text-muted">Fluency</p>
              </div>
              <div className="paper-card-2 text-center">
                <h5>{selectedRun.score.structureScore}</h5>
                <p className="text-small text-muted">Structure</p>
              </div>
              <div className="paper-card-2 text-center">
                <h5 style={{ color: selectedRun.score.passed ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {selectedRun.score.overallScore}
                </h5>
                <p className="text-small text-muted">Overall</p>
              </div>
            </div>

            <div>
              <p className="label">Reasons (Why not 100%)</p>
              <div className="paper-card-2">
                {Object.entries(selectedRun.score.reasons).map(([key, reasons]) => (
                  reasons.length > 0 && (
                    <div key={key} style={{ marginBottom: 'var(--space-sm)' }}>
                      <p className="mono text-small" style={{ fontWeight: 'bold' }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </p>
                      <ul style={{ paddingLeft: 'var(--space-md)', margin: 0 }}>
                        {reasons.map((reason: string, i: number) => (
                          <li key={i} className="text-small">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Logs;
