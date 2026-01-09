/**
 * Fluency metrics extraction and estimation utilities
 */

import { countWords, countFillers } from './textNormalization';

export interface FluencyMetrics {
  durationMs: number;
  wpm: number;
  pauseCount: number;
  longPauseCount: number;
  longestPauseMs: number;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
}

/**
 * Estimate fluency metrics from transcript and duration
 * Note: Without access to raw audio timing data, we make reasonable estimates
 */
export function estimateFluencyMetrics(
  transcript: string,
  durationMs: number
): FluencyMetrics {
  // Count words (excluding fillers for WPM calculation)
  const wordCount = countWords(transcript, true);

  // Calculate words per minute
  const minutes = durationMs / 60000;
  const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;

  // Count fillers
  const { total: fillerCount, breakdown: fillerBreakdown } = countFillers(transcript);

  // Estimate pauses based on duration and word count
  // Average speaking rate is ~150 WPM, so we can estimate expected duration
  const expectedDurationMs = (wordCount / 150) * 60000;
  const excessTime = Math.max(0, durationMs - expectedDurationMs);

  // Estimate pause count (rough: every 500ms excess = 1 pause)
  const pauseCount = Math.floor(excessTime / 500);

  // Estimate long pauses (>1s: every 1500ms excess beyond short pauses)
  const longPauseCount = Math.floor(excessTime / 1500);

  // Estimate longest pause
  const longestPauseMs = excessTime > 0 ? Math.min(excessTime, 3000) : 0;

  return {
    durationMs,
    wpm,
    pauseCount,
    longPauseCount,
    longestPauseMs,
    fillerCount,
    fillerBreakdown
  };
}

/**
 * Calculate fluency score based on metrics and profile parameters
 */
export function calculateFluencyScore(
  metrics: FluencyMetrics,
  params: {
    fillerPenaltyPerWord: number;
    fillerPenaltyCap: number;
    pausePenalty: number;
    longPausePenalty: number;
    pausePenaltyCap: number;
  }
): { score: number; deductions: string[] } {
  let score = 100;
  const deductions: string[] = [];

  // Apply filler word penalties
  const fillerPenalty = Math.min(
    metrics.fillerCount * params.fillerPenaltyPerWord,
    params.fillerPenaltyCap
  );
  if (fillerPenalty > 0) {
    score -= fillerPenalty;
    deductions.push(`Filler words detected: ${metrics.fillerCount} (-${fillerPenalty})`);
  }

  // Apply pause penalties
  const pausePenalty = Math.min(
    metrics.pauseCount * params.pausePenalty +
    metrics.longPauseCount * params.longPausePenalty,
    params.pausePenaltyCap
  );
  if (pausePenalty > 0) {
    score -= pausePenalty;
    deductions.push(`Pauses detected: ${metrics.pauseCount} short, ${metrics.longPauseCount} long (-${pausePenalty})`);
  }

  // Apply WPM penalty (too slow or too fast)
  // Ideal range: 120-180 WPM for radio communications
  if (metrics.wpm < 100) {
    const slowPenalty = Math.min((100 - metrics.wpm) / 2, 15);
    score -= slowPenalty;
    deductions.push(`Speaking too slowly: ${metrics.wpm} WPM (-${Math.round(slowPenalty)})`);
  } else if (metrics.wpm > 200) {
    const fastPenalty = Math.min((metrics.wpm - 200) / 3, 10);
    score -= fastPenalty;
    deductions.push(`Speaking too quickly: ${metrics.wpm} WPM (-${Math.round(fastPenalty)})`);
  }

  return {
    score: Math.max(0, Math.round(score)),
    deductions
  };
}

/**
 * Get WPM rating description
 */
export function getWPMRating(wpm: number): string {
  if (wpm < 80) return 'Very Slow';
  if (wpm < 120) return 'Slow';
  if (wpm < 150) return 'Normal';
  if (wpm < 180) return 'Quick';
  if (wpm < 220) return 'Fast';
  return 'Very Fast';
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}
