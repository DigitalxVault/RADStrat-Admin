import { Router } from 'express';
import type { Request, Response as ExpressResponse } from 'express';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';

const router: Router = Router();

// GA API response structure for /v1/realtime/client_secrets (transcription sessions)
// Note: Structure is different from conversation sessions!
interface GASessionResponse {
  value: string;        // Ephemeral token at root level
  expires_at: number;   // Token expiry at root level
  session: {
    type: string;
    object: string;
    id: string;
    expires_at: number;
    audio: object;
  };
}

// NOTE: Model selection is NOT supported for transcription sessions via /v1/realtime/client_secrets
// OpenAI error: "You must not provide a model parameter for transcription sessions."
// The transcription model is determined automatically by OpenAI.
// See: https://platform.openai.com/docs/guides/realtime

router.get('/', async (_req: Request, res: ExpressResponse) => {
  const startTime = Date.now();

  try {
    // NOTE: Model selection is NOT supported for transcription sessions via client_secrets
    // OpenAI error: "You must not provide a model parameter for transcription sessions."
    // The transcription model is determined automatically by OpenAI.
    logger.info('Creating GA transcription session...');

    // GA API: Use /v1/realtime/client_secrets endpoint with nested session structure
    const fetchRes = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        // Note: No beta header for GA API
      },
      body: JSON.stringify({
        session: {
          type: 'transcription',
          // Note: model is NOT at session level for transcription sessions
          // It's specified in audio.input.transcription.model
          audio: {
            input: {
              format: {
                type: 'audio/pcm',
                rate: 24000
              },
              transcription: {
                // NOTE: Model IS required for session creation, but cannot be changed via session.update
                // Using gpt-4o-mini-transcribe as default - OpenAI's efficient transcription model
                model: 'gpt-4o-mini-transcribe',
                language: 'en',  // HARDCODED: English only - ensures English output
                prompt: ''
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
              },
              noise_reduction: {
                type: 'near_field'  // Optimized for close microphone input
              }
            }
          }
        }
      }),
    });

    if (!fetchRes.ok) {
      const errorText = await fetchRes.text();
      logger.error('OpenAI API error', { status: fetchRes.status, error: errorText });
      res.status(fetchRes.status).json({
        error: 'Failed to create transcription session',
        details: errorText
      });
      return;
    }

    const data = await fetchRes.json() as GASessionResponse;
    const latencyMs = Date.now() - startTime;

    logger.info('GA Transcription session created', {
      sessionId: data.session?.id,
      latencyMs,
      expiresAt: data.expires_at,
      language: 'en'
      // NOTE: Model is determined by OpenAI, not selectable for transcription sessions
    });

    // Return only what the client needs (never expose the full API key)
    // GA API structure: value/expires_at at root, session.id for session ID
    // IMPORTANT: Use camelCase field names to match frontend expectations
    res.json({
      sessionId: data.session?.id,
      clientSecret: data.value,
      expiresAt: data.expires_at,
      model: 'gpt-4o-mini-transcribe',
      latencyMs
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create transcription session', { error: errorMessage });
    res.status(500).json({
      error: 'Internal server error',
      message: errorMessage
    });
  }
});

export default router;
