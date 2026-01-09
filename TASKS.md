# Project Tasks

Task tracking for STT Tuning Console development.

---

## Legend
- [ ] Pending
- [x] Completed
- [~] In Progress
- [!] Blocked

---

## Phase 1: Foundation

### 1.1 Server Setup
- [x] Create Express server entry point (`apps/server/src/index.ts`)
- [x] Configure environment variables (`apps/server/src/env.ts`)
- [x] Implement health endpoint (`GET /api/health`)
- [x] Set up CORS for localhost
- [x] Create logger utility

### 1.2 Frontend Shell
- [x] Create main entry point (`apps/web/src/main.tsx`)
- [x] Create App component with routing
- [x] Implement tab navigation layout
- [x] Create page stubs (STTTest, Parameters, Scoring, Prompts, Telemetry, Logs)
- [x] Set up global CSS with design tokens

### 1.3 Shared Types
- [x] Define Question schema
- [x] Define Profile schema
- [x] Define scoring types
- [x] Define telemetry types
- [x] Define API response types

### 1.4 Data Files
- [x] Create `default_profiles.json` (Near_Fetch, Far_Fetch, Strict)
- [x] Update `sample_question_bank.json` with proper schema

---

## Phase 2: Core STT Features

### 2.1 Question Bank
- [x] Create question bank loader component
- [x] Implement JSON upload
- [x] Implement JSON paste
- [x] Add validation (schema validation)
- [x] Store in React state

### 2.2 Token Minting (Server)
- [x] Implement `/api/openai/transcription-session` endpoint
- [x] Call OpenAI transcription sessions API
- [x] Return client_secret to frontend
- [x] Handle errors gracefully

### 2.3 OpenAI Realtime Connection
- [x] Create WebSocket connector
- [x] Handle connection states (Connecting/Listening/Finalizing/Error)
- [x] Implement interim transcript updates
- [x] Implement final transcript handling
- [x] Handle timeout fallback

### 2.4 Audio Capture
- [x] Implement push-to-talk (RECORD button)
- [x] Create microphone capture pipeline
- [x] Stream audio to Realtime API
- [x] Handle permission errors

### 2.5 Transcript Display
- [x] Show interim transcript (live)
- [x] Show final transcript
- [x] Toggle Raw vs Normalized view

---

## Phase 3: Scoring System

### 3.1 Normalization
- [x] Implement lowercase + punctuation removal
- [x] Implement digit <-> word equivalence
- [x] Implement R/T variants (niner/tree/fife)
- [x] Create normalization toggle controls

### 3.2 Fluency Extraction
- [x] Calculate duration and WPM
- [x] Detect pauses (configurable thresholds)
- [x] Detect filler words (configurable list)
- [x] Compute penalty scores

### 3.3 LLM Evaluator
- [x] Create evaluator service (server-side)
- [x] Implement `/api/evaluator/score` endpoint
- [x] Build scoring prompt with parameters
- [x] Parse and validate response
- [x] Handle prompt injection protection

### 3.4 Score Display
- [x] Show Overall + 3 section scores
- [x] Show "why not 100%" reasons
- [x] Show evidence (counts/thresholds)
- [x] Apply pass/fail benchmark styling

---

## Phase 4: Settings & Configuration

### 4.1 Profile Management
- [x] Implement profile selector (Near_Fetch/Far_Fetch/Strict)
- [x] Load profiles from localStorage
- [x] Save profiles to localStorage
- [x] Import/Export preset JSON

### 4.2 Parameters Screen
- [x] Weight sliders (Accuracy/Fluency/Structure)
- [x] Fluency threshold inputs
- [x] Filler word list editor
- [x] Normalization toggles
- [x] Pass benchmark inputs

### 4.3 Prompts Screen
- [x] Scoring prompt template editor
- [x] Explanation prompt template editor
- [x] Validate output schema button
- [x] Prompt preview (redacted)

### 4.4 Storage Utilities
- [x] Create localStorage wrapper
- [x] Implement profile persistence
- [x] Implement recent runs toggle
- [x] Handle storage quota errors

---

## Phase 5: Telemetry & Logs

### 5.1 Telemetry Tracking
- [x] Track per-run latency (connect, first-text, final)
- [x] Track errors by type
- [x] Estimate cost per run
- [x] Calculate session totals

### 5.2 Telemetry Screen
- [x] Show run count
- [x] Show average/p95 latency
- [x] Show error counts
- [x] Show total cost estimate

### 5.3 Logs Screen
- [x] Show per-run log rows
- [x] Implement filters (questionId, timestamp, score)
- [x] Export to JSON
- [x] Export to CSV

---

## Phase 6: Polish & Testing

### 6.1 Integration Testing
- [x] Test full STT flow end-to-end
- [x] Test profile switching
- [x] Test normalization accuracy
- [x] Test scoring consistency
- [x] Test export functionality

### 6.2 Error Handling
- [x] Handle network failures
- [x] Handle API errors
- [x] Handle timeout scenarios
- [x] Show user-friendly error messages

### 6.3 UI Polish
- [x] Apply full styleguide styling
- [x] Responsive layout adjustments
- [x] Loading states
- [x] Empty states
- [ ] Keyboard shortcuts (optional - deferred)

### 6.4 Documentation
- [x] Update README with final instructions
- [x] Document API endpoints
- [x] Add inline code comments

---

## Acceptance Criteria Checklist

From PRD Section 16.1:

- [x] App runs locally (web + server)
- [x] Can load a valid question bank
- [x] RECORD button with push-to-talk functionality
- [x] Realtime transcript updates visible during recording
- [x] Finalize to stable final transcript (or timeout fallback)
- [x] Digit/word differences do not reduce Accuracy (when equivalence enabled)
- [x] Scores show Accuracy/Fluency/Structure + Overall
- [x] Fluency shows filler count + pause count + longest pause + WPM
- [x] Structure respects per-question requirements
- [x] Telemetry shows latency + cost estimate + total cost
- [x] Presets saved and restored via localStorage
- [x] Logs export works (JSON + CSV)

---

## Summary

**Status: COMPLETE**

All phases completed successfully on 2026-01-08.

| Phase | Status | Tasks |
|-------|--------|-------|
| Phase 1: Foundation | Complete | 15/15 |
| Phase 2: Core STT | Complete | 17/17 |
| Phase 3: Scoring | Complete | 14/14 |
| Phase 4: Settings | Complete | 12/12 |
| Phase 5: Telemetry | Complete | 10/10 |
| Phase 6: Polish | Complete | 12/13 |
| **Total** | **Complete** | **80/81** |

One optional task deferred: Keyboard shortcuts.

---

## Notes

**2026-01-08**: Project completed. All core features implemented and tested.
- Frontend running on http://localhost:5173
- Backend running on http://localhost:3001
- All pages verified via Playwright browser automation
- Documentation updated (CHANGELOG.md, DEBUG.md, TASKS.md)
