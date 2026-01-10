import { Router } from 'express';
import type { Request, Response as ExpressResponse } from 'express';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';

// Type for OpenAI transcription session response
interface TranscriptionSessionResponse {
  id: string;
  model: string;
  client_secret?: {
    value: string;
    expires_at: number;
  };
}

// VAD settings from client (optional, uses defaults if not provided)
interface VADSettingsRequest {
  threshold?: number;        // 0.0-1.0, default 0.3
  prefixPaddingMs?: number;  // default 500
  silenceDurationMs?: number; // default 2000
}

// Default VAD settings
const DEFAULT_VAD: Required<VADSettingsRequest> = {
  threshold: 0.3,
  prefixPaddingMs: 500,
  silenceDurationMs: 2000
};

const router: Router = Router();

/**
 * Transcription Session Endpoint - WebSocket Approach
 *
 * This endpoint creates a transcription session with OpenAI and returns
 * an ephemeral token for the browser to establish a WebSocket connection.
 *
 * Flow:
 * 1. Browser requests an ephemeral token from this endpoint
 * 2. Server calls OpenAI's /v1/realtime/transcription_sessions
 * 3. Server returns the ephemeral token (client_secret) to browser
 * 4. Browser connects via WebSocket to wss://api.openai.com/v1/realtime?intent=transcription
 *
 * This uses the transcription-specific endpoint (not realtime/sessions)
 * to get pure transcription without AI responses.
 *
 * @see https://platform.openai.com/docs/guides/speech-to-text#streaming-transcriptions
 */

// POST /api/webrtc/session - Get ephemeral token for WebSocket transcription
// Accepts optional VAD settings in request body
router.post('/', async (req: Request, res: ExpressResponse) => {
  const startTime = Date.now();

  try {
    // Extract VAD settings from request body, use defaults if not provided
    const vadRequest: VADSettingsRequest = req.body?.vad || {};
    const vad = {
      threshold: vadRequest.threshold ?? DEFAULT_VAD.threshold,
      prefixPaddingMs: vadRequest.prefixPaddingMs ?? DEFAULT_VAD.prefixPaddingMs,
      silenceDurationMs: vadRequest.silenceDurationMs ?? DEFAULT_VAD.silenceDurationMs
    };

    logger.info('Creating ephemeral token for transcription session', {
      vadSettings: vad
    });

    // Create transcription session with OpenAI
    // Uses /v1/realtime/transcription_sessions for pure transcription (no AI responses)
    // NOTE: Using the documented nested audio.input format for transcription sessions
    const fetchRes: globalThis.Response = await fetch('https://api.openai.com/v1/realtime/transcription_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // New nested format per transcription session docs
        audio: {
          input: {
            format: {
              type: 'audio/pcm',
              rate: 24000
            },
            transcription: {
              model: 'gpt-4o-transcribe',
              language: 'en'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: vad.threshold,
              prefix_padding_ms: vad.prefixPaddingMs,
              silence_duration_ms: vad.silenceDurationMs
            },
            noise_reduction: {
              type: 'near_field'
            }
          }
        }
      }),
    });

    if (!fetchRes.ok) {
      const errorText = await fetchRes.text();
      logger.error('OpenAI transcription session creation failed', {
        status: fetchRes.status,
        error: errorText
      });
      res.status(fetchRes.status).json({
        error: 'Failed to create transcription session',
        details: errorText
      });
      return;
    }

    const sessionData = await fetchRes.json() as TranscriptionSessionResponse;
    const latencyMs = Date.now() - startTime;

    logger.info('Ephemeral token created successfully', {
      latencyMs,
      sessionId: sessionData.id,
      model: sessionData.model,
      expiresAt: sessionData.client_secret?.expires_at,
      fullResponse: JSON.stringify(sessionData, null, 2)
    });

    // Return the session data including client_secret
    res.json({
      sessionId: sessionData.id,
      clientSecret: sessionData.client_secret?.value,
      expiresAt: sessionData.client_secret?.expires_at,
      model: sessionData.model
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create ephemeral token', { error: errorMessage });
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
});

export default router;
