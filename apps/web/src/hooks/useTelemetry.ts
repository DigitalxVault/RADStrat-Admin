import { useState, useCallback, useMemo } from 'react';
import type { TestRun, SessionTelemetry } from '../types';

const STORAGE_KEY = 'stt-console-runs';

interface UseTelemetryReturn {
  runs: TestRun[];
  telemetry: SessionTelemetry;
  addRun: (run: TestRun) => void;
  clearTelemetry: () => void;
  getRunById: (id: string) => TestRun | undefined;
  exportRuns: () => TestRun[];
}

export function useTelemetry(): UseTelemetryReturn {
  const [runs, setRuns] = useState<TestRun[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as TestRun[];
      } catch {
        return [];
      }
    }
    return [];
  });

  const telemetry = useMemo((): SessionTelemetry => {
    if (runs.length === 0) {
      return {
        runCount: 0,
        averageLatencyMs: 0,
        p95LatencyMs: 0,
        errorCount: 0,
        errorsByType: {},
        totalCost: 0
      };
    }

    const latencies = runs.map(r => r.telemetry.totalLatencyMs).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;

    // P95 calculation
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[Math.min(p95Index, latencies.length - 1)];

    // Error counting
    const errorRuns = runs.filter(r => r.status === 'error' || r.status === 'timeout');
    const errorsByType: Record<string, number> = {};
    errorRuns.forEach(r => {
      const type = r.status === 'timeout' ? 'timeout' : 'error';
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    });

    // Total cost
    const totalCost = runs.reduce((sum, r) => sum + r.telemetry.estimatedCost, 0);

    return {
      runCount: runs.length,
      averageLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      errorCount: errorRuns.length,
      errorsByType,
      totalCost
    };
  }, [runs]);

  const addRun = useCallback((run: TestRun) => {
    setRuns(prev => {
      const updated = [run, ...prev]; // Most recent first
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearTelemetry = useCallback(() => {
    setRuns([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getRunById = useCallback((id: string): TestRun | undefined => {
    return runs.find(r => r.id === id);
  }, [runs]);

  const exportRuns = useCallback((): TestRun[] => {
    return [...runs];
  }, [runs]);

  return {
    runs,
    telemetry,
    addRun,
    clearTelemetry,
    getRunById,
    exportRuns
  };
}
