import type { RunTelemetry } from '../types';

interface TelemetryStripProps {
  telemetry: Partial<RunTelemetry>;
  isRecording?: boolean;
}

function TelemetryStrip({ telemetry, isRecording }: TelemetryStripProps) {
  const formatMs = (ms: number | undefined) => {
    if (ms === undefined) return '--';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCost = (cost: number | undefined) => {
    if (cost === undefined) return '--';
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div
      className="ink-bar"
      style={{
        display: 'flex',
        gap: 'var(--space-lg)',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}
    >
      <TelemetryItem
        label="Connect"
        value={formatMs(telemetry.connectTimeMs)}
        highlight={isRecording && !telemetry.connectTimeMs}
      />
      <TelemetryItem
        label="First Text"
        value={formatMs(telemetry.timeToFirstTextMs)}
        highlight={isRecording && !!telemetry.connectTimeMs && !telemetry.timeToFirstTextMs}
      />
      <TelemetryItem
        label="Final"
        value={formatMs(telemetry.timeToFinalMs)}
      />
      <TelemetryItem
        label="Evaluator"
        value={formatMs(telemetry.evaluatorLatencyMs)}
      />
      <TelemetryItem
        label="Total"
        value={formatMs(telemetry.totalLatencyMs)}
        accent
      />
      <TelemetryItem
        label="Cost"
        value={formatCost(telemetry.estimatedCost)}
      />
    </div>
  );
}

function TelemetryItem({
  label,
  value,
  highlight,
  accent
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
      <span className="mono text-small text-muted">{label}:</span>
      <span
        className="mono text-small"
        style={{
          color: accent ? 'var(--accent-yellow)' : highlight ? 'var(--accent-danger)' : 'inherit',
          fontWeight: accent ? 'bold' : 'normal',
          animation: highlight ? 'pulse 1s infinite' : 'none'
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default TelemetryStrip;
