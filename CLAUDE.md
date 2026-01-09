# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

STT Tuning Console - A local web application for testing and tuning OpenAI Realtime Speech-to-Text parameters for radio telephony training scenarios. Uses a steampunk-themed UI.

## Development Commands

```bash
# Install dependencies (uses npm workspaces)
npm install

# Start both frontend and backend in development
npm run dev

# Start only frontend (Vite on port 5173)
npm run dev:web

# Start only backend (Express on port 3001)
npm run dev:server

# Build all packages
npm run build

# Lint all workspaces
npm run lint

# Type check all workspaces
npm run typecheck

# Clean all node_modules and dist
npm run clean
```

## Architecture

### Monorepo Structure
- `apps/web` - React 18 + Vite + TypeScript frontend (`@stt-console/web`)
- `apps/server` - Express + TypeScript backend (`@stt-console/server`)

### Frontend Pages (apps/web/src/pages/)
| Page | Route | Purpose |
|------|-------|---------|
| STTTest | /test | Main recording interface with real-time transcription |
| Parameters | /parameters | Adjust scoring weights (accuracy/fluency/structure) |
| Scoring | /scoring | Visual scoring algorithm explanation |
| Prompts | /prompts | Customize LLM evaluation prompts |
| Telemetry | /telemetry | Performance metrics dashboard |
| Logs | /logs | Test run history |

### Key Hooks (apps/web/src/hooks/)
- `useSTTSession` - Core STT functionality using OpenAI Realtime WebSocket API
- `useProfile` - Manages scoring profiles (weights, fluency settings, normalization)
- `useQuestionBank` - Loads and navigates question scenarios
- `useTelemetry` - Tracks latency, cost, and error metrics

### Backend Routes (apps/server/src/routes/)
| Endpoint | Purpose |
|----------|---------|
| GET /api/health | Health check |
| GET /api/webrtc/session | Get ephemeral token for WebSocket transcription session |
| POST /api/evaluator/score | AI-powered transcript evaluation using GPT-4o |

### STT Flow (WebSocket Transcription)
1. Client requests ephemeral token from `/api/webrtc/session`
2. Server calls OpenAI's `/v1/realtime/transcription_sessions` API
3. Client connects WebSocket to `wss://api.openai.com/v1/realtime?intent=transcription`
4. Wait for `transcription_session.created` event before sending audio
5. Audio captured via ScriptProcessorNode, resampled from 48kHz to 24kHz PCM16
6. Server VAD detects speech boundaries and auto-commits buffer
7. Receive `conversation.item.input_audio_transcription.completed` with transcript

### Shared Types
All TypeScript types are in `apps/web/src/types/index.ts`:
- `Question`, `QuestionBank` - Test scenarios
- `Profile`, `ProfileWeights` - Scoring configuration
- `ScoreResult`, `FluencyMetrics` - Evaluation results
- `TestRun`, `RunTelemetry` - Test execution data

## Environment Setup

Copy `.env.example` to `.env` and set:
```
OPENAI_API_KEY=sk-your-key-here
PORT=3001
NODE_ENV=development
```

## VAD Configuration

Server-side VAD settings in `apps/server/src/routes/webrtcSession.ts`:
- `threshold` (0.0-1.0) - Speech detection sensitivity
- `prefix_padding_ms` - Audio to include before speech detection
- `silence_duration_ms` - Wait time after silence before committing buffer
