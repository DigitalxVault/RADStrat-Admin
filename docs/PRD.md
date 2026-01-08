# PRD.md — OpenAI Realtime STT Tuning Console (Local, React + Node)

**Owner:** Eugene  
**Version:** 2.0 (Rewrite)  
**Last updated:** 2026-01-08  
**Run mode:** Local only (developer machine)  
**Theme:** Steampunk Level 1, Dark-only  
**Primary purpose:** Tune parameters + prompts for OpenAI Realtime speech-to-text and validate grading behavior via an integrated test console.

---

## 1) Overview

### 1.1 Problem
You need a fast, repeatable way to:
- Test **OpenAI Realtime Speech-to-Text** quality across different mic distances/noise conditions.
- Tune **grading parameters** (Accuracy / Fluency / Structure) and difficulty benchmarks without editing code.
- Use an **LLM-driven evaluator** to decide scores and generate “why not 100%” breakdowns.
- Monitor operational signals per run: **latency, errors, cost per test + total session cost**.

### 1.2 Solution
A local web app with two main areas:
1) **Parameters Console (Settings)**  
   Central source of truth for profiles, weights, thresholds, normalization rules, filler sensitivity, structure requirements, and evaluation prompts.
2) **STT Test Console**  
   MCQ-driven test loop where you select the correct answer, speak it via push-to-talk, view realtime transcript updates, and receive score breakdown + telemetry.

The Realtime API supports low-latency use cases including realtime transcription. :contentReference[oaicite:0]{index=0}

---

## 2) Goals and Non-Goals

### 2.1 Goals (MVP)
- **Local-first** (runs on localhost).
- **OpenAI Realtime STT** (English-only) with visible interim + final transcript updates.
- Settings console to tune:
  - Environment profile: **Near_Fetch** vs **Far_Fetch** (mic distance/noise presets)
  - Weights: **Accuracy 50% / Fluency 30% / Structure 20%** (configurable)
  - Fluency controls: filler list, filler sensitivity, pause thresholds
  - Structure requirements per question: Receiver / Sender / Location / Intent (Closing optional)
  - Normalization: **digits ↔ words equivalence** (no penalty)
  - LLM prompts for scoring + explanations
  - Difficulty benchmark: pass mark, min-per-section thresholds (optional)
- STT Test loop:
  - MCQ shown → admin selects the **correct** option → TALK enabled → realtime transcription → END finalizes scoring.
- Telemetry: per-run latency, errors, cost (estimate), plus total session cost.
- Presets saved to **localStorage** (profiles/difficulty configurations).
- Export logs (JSON/CSV) for offline analysis.

### 2.2 Non-Goals (MVP)
- No login/auth.
- No database or long-term retention.
- No audio storage (transcript only).
- No multi-provider STT comparison (OpenAI only).
- No public hosting.

---

## 3) Users

### 3.1 Primary User
- **Admin/Instructor (You):** tunes parameters, runs tests, validates scoring behavior, reviews telemetry/logs.

---

## 4) Tech Stack & Framework

### 4.1 Framework (Required)
- **Frontend:** React + TypeScript + Vite
- **Backend (local):** Node.js + Express
- **Realtime connection:** Browser connects using **short-lived client secrets** minted by the local server.
- **Persistence (MVP):** localStorage only (presets + optional recent runs)

### 4.2 Security Principle
Never expose a long-lived OpenAI API key in the browser; use a backend to mint short-lived secrets. :contentReference[oaicite:1]{index=1}  
Client secrets are short-lived tokens intended for client-side apps. :contentReference[oaicite:2]{index=2}

---

## 5) Product Scope & Information Architecture

### 5.1 Navigation (Tabs)
1. **STT Test**
2. **Parameters**
3. **Scoring**
4. **Prompts**
5. **Telemetry**
6. **Logs**
7. **Style Guide** (read-only reference; optional in-app)

---

## 6) Core UX Flows

### 6.1 Primary Flow — Test Loop
1. Load a question bank (upload or paste JSON).
2. Go to **STT Test**.
3. Select the correct MCQ option (required).
4. Press **TALK**:
   - mic capture starts
   - realtime transcript updates appear
5. Press **END**:
   - transcription finalizes
   - normalization runs
   - fluency features extract (fillers/pauses/WPM)
   - evaluator LLM returns scores + reasons
6. UI shows:
   - Accuracy / Fluency / Structure + Overall
   - “Why not 100%” per section
   - Telemetry (latency/errors/cost)
7. Optionally:
   - save run to “Recent Runs” (localStorage toggle)
   - export logs

### 6.2 Secondary Flow — Tune & Retest
1. Switch profile (**Near_Fetch** / **Far_Fetch** / Custom).
2. Adjust parameters (weights/thresholds/filler list/prompts).
3. Re-run same question to compare outcomes.
4. Save as preset.

---

## 7) Functional Requirements

## 7.1 Question Bank (MCQ)
- Input methods:
  - Upload JSON
  - Paste JSON
- Validation:
  - exactly 4 options (A–D)
  - correctIndex must be 0–3
- Stored in memory (no DB).

**Question schema (MVP)**
```ts
type Question = {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;

  structure: {
    requireReceiver: boolean;
    requireSender: boolean;
    requireLocation: boolean;   // scenario-based
    requireIntent: boolean;
    closingOptional: boolean;   // true
  };

  expectedKeywords?: string[];  // optional hints for intent/info
};
```

## 7.2 OpenAI Realtime STT (English-only)

* Realtime transcript requirements:

  * Interim transcript updates during TALK
  * Final transcript on END
* Status:

  * Connecting / Listening / Finalizing / Error
* Failure handling:

  * If final transcript times out, fall back to last committed transcript and mark the run “finalization timeout”.

Realtime transcription uses dedicated transcription sessions and can be connected via WebRTC or WebSocket. ([OpenAI Platform][1])
The speech-to-text guide describes authentication using ephemeral tokens from `POST /v1/realtime/transcription_sessions`. ([OpenAI Platform][2])

## 7.3 Security: Token Minting (Required)

* Server holds the long-lived OpenAI key in `.env`.
* Browser requests an ephemeral transcription session token from local server.
* Server calls OpenAI endpoint to create a transcription session and returns only the client secret to browser.
* Browser uses the client secret to connect.

Do not deploy long-lived keys in client-side environments. ([OpenAI Help Center][3])
Client secrets are explicitly intended to be passed to client apps without leaking the main key. ([OpenAI Platform][4])

## 7.4 Profiles: Near_Fetch vs Far_Fetch (Mic Distance Presets)

Near_Fetch and Far_Fetch are **environment profiles** (not a provider STT setting):

* **Near_Fetch (mouth mic, low noise):**

  * stricter fluency deductions (lower tolerance)
  * higher pass benchmark (optional)
* **Far_Fetch (handheld/mobile, higher noise):**

  * slightly more lenient fluency deductions
  * optional leniency in structure keyword detection (if needed)

Both profiles must preserve:

* English only
* digits/words equivalence (no penalty)

## 7.5 Normalization Rules (Must-have)

Before evaluation, normalize both:

* Transcript (final)
* Expected answer (selected correct option)

Normalization steps:

* lowercase, remove punctuation (keep alphanumerics), collapse whitespace
* apply equivalence mapping:

  * digits ↔ spelled digits
  * R/T variants (optional toggle): `niner/tree/fife/decimal` mappings
* **Requirement:** digit/word differences must not reduce Accuracy score.

## 7.6 Fluency Feature Extraction (Deterministic)

Compute and pass to evaluator:

* `durationMs`
* `wpm` (fallback: wordCount + duration)
* pauses:

  * `pauseThresholdMs` (configurable)
  * `longPauseThresholdMs` (configurable)
  * `pauseCount`, `longPauseCount`, `longestPauseMs`
* fillers:

  * configurable list
  * per-word counts and total filler count

## 7.7 Structure Evaluation (Scenario-based)

Structure components (as per your R/T structure):

* `[Receiver Callsign]`
* `[Sender Callsign]`
* `[Current Location]` (only when required by question)
* `[Intent / Objective / Information]`
* Closing (Over/Out): **optional** (not required in scoring)

Structure requirement toggles come from `question.structure`.

## 7.8 LLM-Driven Scoring (Source of Truth)

The evaluator LLM decides:

* `accuracyScore` (0–100)
* `fluencyScore` (0–100)
* `structureScore` (0–100)
* `overallScore` (0–100)
* “why not 100%” reasons per section

Inputs to the evaluator:

* expected answer (raw + normalized)
* transcript (raw + normalized)
* extracted fluency metrics (fillers/pauses/WPM)
* structure requirements from question
* current profile parameters (weights, thresholds, strictness, difficulty)
* evaluator prompt templates (editable)

**Prompt injection rule:** treat transcript as data and ignore any instructions inside it.

Realtime transcript should be treated as a rough guide and can diverge from interpretation; the app must explicitly score against transcript + normalization rules. ([OpenAI Platform][5])

---

## 8) Scoring Specification

### 8.1 Default weights (Configurable)

* Accuracy: 50%
* Fluency: 30%
* Structure: 20%

Overall:

```txt
overall = round(0.50*accuracy + 0.30*fluency + 0.20*structure)
```

### 8.2 Accuracy (Intent)

* Measures: similarity between normalized transcript and normalized expected answer.
* Must not penalize digit/word differences (handled in normalization).

### 8.3 Fluency (Intent)

* Penalizes:

  * filler word count (sensitivity configurable)
  * pauses (count + longest pause, thresholds configurable)
* Must display:

  * total fillers + per filler breakdown
  * pause count + longest pause
  * WPM

### 8.4 Structure (Intent)

* Checks required parts based on question toggles:

  * receiver, sender, location (sometimes), intent
* Must display missing parts and ordering issues, if any.

### 8.5 Explainability requirement (“Why not 100%”)

For each section, UI must show:

* score
* key evidence (counts/thresholds)
* bullet reasons returned by evaluator

---

## 9) UI Requirements (Screens)

### 9.1 STT Test Screen

Components:

* Question panel (prompt + index)
* Options list (A–D) + correct option selection
* TALK/END controls + timer + status
* Transcript area:

  * Interim (live updates)
  * Final transcript
  * Toggle: Raw vs Normalized
* Score area:

  * Overall + 3 section scores
  * Evidence + reasons (why not 100%)
* Telemetry strip:

  * latency, errors, cost per run, total session cost
* Run list (optional):

  * recent runs (in memory; optionally persisted)

### 9.2 Parameters Screen

* Profile selector: Near_Fetch / Far_Fetch / Custom
* Editable cards:

  * weights
  * fluency thresholds and penalties
  * filler list + sensitivity
  * normalization toggles
  * pass benchmark
* Buttons:

  * Save preset
  * Reset to default
  * Export/Import preset JSON

### 9.3 Prompts Screen

* Editable textareas:

  * Scoring prompt template
  * Explanation prompt template
* “Validate output schema” button (checks evaluator JSON shape)
* Prompt preview of request payload (redacted secrets)

### 9.4 Telemetry Screen

* Aggregates from current session:

  * run count
  * average/p95 latency (if enough data)
  * error count by type
  * total cost estimate
* Simple charts optional (later)

### 9.5 Logs Screen

* Per-run log rows with filters:

  * questionId, timestamp, score, latency, error
* Export:

  * JSON (required)
  * CSV (optional)

---

## 10) Data Handling & Persistence

### 10.1 What is stored

* **Transcript (text):** in memory per run
* **Scores + metrics:** in memory per run
* **No audio stored** (explicit)

### 10.2 Local persistence (localStorage)

* Presets/profiles (required)
* Last selected profile + parameters (required)
* Optional: recent runs (toggle)

### 10.3 Retention

* None required in MVP (local-only, in-memory)
* Export provides manual retention if needed

---

## 11) Cost, Latency, Errors

### 11.1 Cost per run (MVP)

* Prefer provider usage if available in response metadata.
* Else estimate using:

  * `durationSeconds × configuredRatePerSecond`
* Total session cost is the sum of run costs.

### 11.2 Latency (MVP)

Track per run:

* connect time
* time-to-first-text
* time-to-final

### 11.3 Error handling

* Failures must not crash app:

  * show error state
  * allow retry
  * keep last-known parameters

---

## 12) API (Local Node/Express)

### 12.1 Endpoints (Required)

* `GET /api/health`

  * `{ ok: true }`

* `POST /api/openai/realtime/transcription-session`

  * Server calls OpenAI `POST /v1/realtime/transcription_sessions`
  * Returns `{ client_secret, expires_at, session_id }` (shape may be adapted from provider response)

Speech-to-text guide notes ephemeral tokens from `POST /v1/realtime/transcription_sessions`. ([OpenAI Platform][2])

### 12.2 Optional endpoints

* `POST /api/evaluator/score`

  * If you choose to keep LLM scoring server-side (recommended), browser sends normalized text + metrics, server calls model and returns scoring JSON.

---

## 13) Configuration Model

### 13.1 Files (Required)

* `apps/web/src/data/default_profiles.json` (shipped defaults)
* `apps/web/src/data/sample_question_bank.json` (sample content)

### 13.2 Profile schema (MVP)

```ts
type Profile = {
  id: string; // "near" | "far" | "custom-..."
  name: string;
  description?: string;

  weights: { accuracy: number; fluency: number; structure: number };

  benchmarks: {
    passMarkOverall: number;
    minPerSection?: { accuracy?: number; fluency?: number; structure?: number };
  };

  fluency: {
    fillerWords: string[];
    fillerPenaltyPerWord: number;   // sensitivity
    fillerPenaltyCap: number;

    pauseThresholdMs: number;
    longPauseThresholdMs: number;
    pausePenalty: number;
    longPausePenalty: number;
    pausePenaltyCap: number;
  };

  normalization: {
    digitWordEquivalence: boolean;
    rtNumberVariants: boolean;      // niner/tree/fife/decimal
    ignorePunctuation: boolean;
  };

  evaluator: {
    scoringPromptTemplate: string;
    explanationPromptTemplate: string;
    model: string;                  // configurable model name
    temperature: number;
  };
};
```

### 13.3 Preset storage (Required)

* Store profiles in localStorage under:

  * `stt_console_profiles`
  * `stt_console_active_profile_id`

---

## 14) Repository Structure (Recommended)

```
stt-tuning-console/
├─ package.json
├─ README.md
├─ .env.example
├─ apps/
│  ├─ web/
│  │  ├─ index.html
│  │  ├─ vite.config.ts
│  │  └─ src/
│  │     ├─ App.tsx
│  │     ├─ pages/
│  │     │  ├─ STTTest.tsx
│  │     │  ├─ Parameters.tsx
│  │     │  ├─ Scoring.tsx
│  │     │  ├─ Prompts.tsx
│  │     │  ├─ Telemetry.tsx
│  │     │  └─ Logs.tsx
│  │     ├─ components/
│  │     ├─ audio/
│  │     ├─ realtime/
│  │     ├─ scoring/
│  │     ├─ storage/
│  │     └─ data/
│  │        ├─ default_profiles.json
│  │        └─ sample_question_bank.json
│  └─ server/
│     └─ src/
│        ├─ index.ts
│        ├─ env.ts
│        ├─ routes/
│        │  ├─ health.ts
│        │  └─ openaiTranscriptionSession.ts
│        └─ utils/
│           ├─ logger.ts
│           └─ http.ts
```

---

## 15) Security Requirements

* Do not commit keys; store in `.env` only.
* Do not expose keys in browser; mint ephemeral secrets server-side. ([OpenAI Help Center][3])
* CORS restricted to localhost origins.
* Transcript rendered as plain text (no HTML injection).
* Logs must not include secrets; redact any token-like strings.

---

## 16) Testing & Acceptance Criteria

### 16.1 Acceptance Criteria (MVP)

* [ ] App runs locally (web + server).
* [ ] Can load a valid MCQ bank.
* [ ] TALK disabled until correct answer is selected.
* [ ] Realtime transcript updates visible during TALK.
* [ ] END finalizes to a stable final transcript (or timeout fallback).
* [ ] Digit/word differences do not reduce Accuracy.
* [ ] Scores show Accuracy/Fluency/Structure + Overall.
* [ ] Fluency shows filler count + pause count + longest pause + WPM.
* [ ] Structure respects per-question requirements (location only when required).
* [ ] Telemetry shows latency + cost estimate + total cost.
* [ ] Presets saved and restored via localStorage.
* [ ] Logs export works (JSON required).

### 16.2 Test Strategy

* Unit tests:

  * normalization (digit/word mapping)
  * filler detection
  * pause computation
* Integration tests:

  * `/api/openai/realtime/transcription-session` returns token
* Manual test checklist:

  * near vs far profile changes scoring behavior as expected

---

## 17) UI Style Guide (Embedded)

> Source of truth should also exist as `styleguide.md` in repo. This section mirrors it for PRD completeness.

### 17.1 Design Principles

* Dark-only, steampunk Level 1: “industrial console” feel with a restrained palette.
* Use neutrals for 90–95% of UI; accents only for meaning.
* Prefer clarity via spacing and hierarchy over extra color.

### 17.2 Color Tokens (CSS Variables)

```css
:root{
  --bg-app:#141414;
  --bg-stars:#1A1A1A;

  /* parchment-on-dark (admin console surface) */
  --surface-paper:#F2F2F0;
  --surface-paper-2:#E9E9E6;
  --surface-ink:#111111;

  --text-ink:#111111;
  --text-muted:#3A3A3A;
  --stroke:#D3D3CF;

  --accent-yellow:#FFD400;
  --accent-yellow-ink:#1A1A1A;

  /* alerts / recording */
  --accent-danger:#FF2D55;

  --shadow-lg:0 16px 40px rgba(0,0,0,.25);

  --radius-xl:24px;
  --radius-lg:16px;
  --radius-md:12px;
}
```

### 17.3 Typography

* Base body: 16px, line-height 150%
* Scale ratio: 1.25 (Major Third)
* Fonts:

  * Display/Headings: Inter Tight (fallback Inter/system-ui)
  * Body: Inter (system-ui fallback)
  * Mono: IBM Plex Mono (labels/logs)

```css
html{ font-size:16px; }

body{
  font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  line-height:1.5;
}

h1,h2,h3,h4,h5{
  font-family:"Inter Tight",Inter,system-ui,sans-serif;
  text-transform:uppercase;
  font-weight:900;
  margin:0;
}

/* display feel (use italic only for page titles if desired) */
.pageTitle{ font-style:italic; letter-spacing:-0.02em; }

h1{ font-size:3.0625rem; line-height:1.05; letter-spacing:-0.02em; }
h2{ font-size:2.4375rem; line-height:1.10; letter-spacing:-0.015em; }
h3{ font-size:1.9375rem; line-height:1.20; letter-spacing:-0.015em; }
h4{ font-size:1.5625rem; line-height:1.30; letter-spacing:-0.005em; }
h5{ font-size:1.25rem;   line-height:1.35; letter-spacing:-0.005em; }

.small{ font-size:.8125rem; line-height:1.4; }
.mono{ font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; }
```

### 17.4 Spacing

* 8-point grid: 8/16/24/32/40/48/64/96/128
* Default gaps:

  * card padding: 24–32
  * section spacing: 32–64

### 17.5 UI Patterns

* Primary CTA: yellow background + dark text.
* Callout bar: ink background + yellow text.
* Logs: mono font, tight rows, clear separators.

---

## 18) Future Enhancements (Later)

* Golden test suite + regression runner across presets
* Compare two presets against the same transcript (“parameter A/B”)
* Mic calibration widget (input level, clipping detection)
* Optional persistence/export to file system
* Multi-model evaluation profiles for scoring LLM
