// Question Bank Types
export interface QuestionStructure {
  requireReceiver: boolean;
  requireSender: boolean;
  requireLocation: boolean;
  requireIntent: boolean;
  closingOptional: boolean;
}

export interface ExpectedAnswer {
  text: string;
  variants?: string[];
  structure?: QuestionStructure;
}

export interface Question {
  id: string;
  scenarioPrompt: string;
  expectedAnswer: ExpectedAnswer;
  tags?: string[];
  hints?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuestionBankMeta {
  version: string;
  title: string;
  description?: string;
  author?: string;
  createdAt?: string;
}

export interface QuestionBank {
  meta: QuestionBankMeta;
  questions: Question[];
}

// Profile Types
export interface ProfileWeights {
  accuracy: number;
  fluency: number;
  structure: number;
}

export interface ProfileBenchmarks {
  passMarkOverall: number;
  minPerSection?: {
    accuracy?: number;
    fluency?: number;
    structure?: number;
  };
}

export interface ProfileFluency {
  fillerWords: string[];
  fillerPenaltyPerWord: number;
  fillerPenaltyCap: number;
  pauseThresholdMs: number;
  longPauseThresholdMs: number;
  pausePenalty: number;
  longPausePenalty: number;
}

export interface ProfileNormalization {
  digitWordEquivalence: boolean;
  rtNumberVariants: boolean;
  ignorePunctuation: boolean;
}

export interface ProfileEvaluator {
  scoringPromptTemplate: string;
  explanationPromptTemplate: string;
  model: string;
  temperature: number;
}

// NOTE: STT model selection is NOT supported by OpenAI Realtime API for transcription sessions.
// The transcription model is determined automatically by OpenAI.

export interface Profile {
  id: string;
  name: string;
  description?: string;
  weights: ProfileWeights;
  benchmarks: ProfileBenchmarks;
  fluency: ProfileFluency;
  normalization: ProfileNormalization;
  evaluator: ProfileEvaluator;
}

// Scoring Types
export interface FluencyMetrics {
  durationMs: number;
  wpm: number;
  pauseCount: number;
  longPauseCount: number;
  longestPauseMs: number;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
}

export interface ScoreReasons {
  accuracy: string[];
  fluency: string[];
  structure: string[];
}

export interface ScoreResult {
  accuracyScore: number;
  fluencyScore: number;
  structureScore: number;
  overallScore: number;
  reasons: ScoreReasons;
  passed: boolean;
}

// Telemetry Types
export interface RunTelemetry {
  connectTimeMs: number;
  timeToFirstTextMs: number;
  timeToFinalMs: number;
  evaluatorLatencyMs: number;
  totalLatencyMs: number;
  audioDurationMs?: number;
  estimatedCost: number;
}

export interface SessionTelemetry {
  runCount: number;
  totalCost: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  errorCount: number;
  errorsByType: Record<string, number>;
}

// Test Run Types
export type TranscriptionStatus = 'idle' | 'connecting' | 'connected' | 'recording' | 'processing' | 'error';

export interface TestRun {
  id: string;
  questionId: string;
  timestamp: string;
  transcript: {
    raw: string;
    normalized: string;
  };
  expectedAnswer: {
    raw: string;
    normalized: string;
  };
  fluencyMetrics?: FluencyMetrics;
  score: ScoreResult;
  telemetry: RunTelemetry;
  profileId: string;
  status: 'success' | 'timeout' | 'error';
  errorMessage?: string;
}

// API Response Types
export interface TranscriptionSessionResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
  session_id: string;
  latency_ms?: number;
}

export interface EvaluatorScoreResponse extends ScoreResult {
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
}

// Storage Keys
export const STORAGE_KEYS = {
  PROFILES: 'stt_console_profiles',
  ACTIVE_PROFILE_ID: 'stt_console_active_profile_id',
  RECENT_RUNS: 'stt_console_recent_runs',
  SAVE_RUNS_ENABLED: 'stt_console_save_runs_enabled',
} as const;
