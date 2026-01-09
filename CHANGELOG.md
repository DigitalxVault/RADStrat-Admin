# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-01-08

### Added

**Phase 1: Foundation**
- Monorepo setup with npm workspaces (`@stt-console/web`, `@stt-console/server`)
- React + Vite + TypeScript frontend scaffold
- Node + Express + TypeScript backend scaffold
- Server routes: health, openaiTranscriptionSession, evaluator
- Express server with CORS, error handling, logging utility
- Environment configuration with validation
- Complete TypeScript type definitions
- CSS design system with Paper-on-Dark theme
- React Router setup with 6 main pages
- Layout component with header, navigation tabs, footer
- Google Fonts integration (Inter, Inter Tight, IBM Plex Mono)

**Phase 2: Core STT**
- Question bank loader with upload, paste, and sample options
- Drag-and-drop file upload support
- OpenAI Realtime API integration via WebSocket
- Push-to-talk recording interface
- Real-time transcript display (interim + final)
- Audio capture with MediaStream API
- Ephemeral token minting pattern for secure API access

**Phase 3: Scoring System**
- Text normalization utilities (case, punctuation, digit/word equivalence)
- R/T number variants support (niner, tree, fife)
- Fluency metrics extraction (WPM, pause detection, filler word detection)
- LLM-driven evaluator service (`/api/evaluator/score`)
- Score display with Accuracy/Fluency/Structure breakdown
- "Why not 100%" explanations for each category
- Pass/fail benchmark with configurable thresholds

**Phase 4: Settings & Configuration**
- Profile management (Near Fetch, Far Fetch, Strict Evaluation)
- Profile selector with import/export functionality
- Parameters page with weight sliders
- Fluency settings (pause thresholds, filler penalties)
- Filler word list editor
- Normalization toggles
- Prompts page with template editors
- Model selector (GPT-4o Mini, GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo)
- Temperature control
- Payload preview functionality
- localStorage persistence for all settings

**Phase 5: Telemetry & Logs**
- Session telemetry tracking (run count, latency, errors, cost)
- Per-run telemetry (connect time, first text, final, evaluator latency)
- P95 latency calculation
- Error tracking by type
- Cost estimation per run and session
- Logs page with filtering and sorting
- Export to JSON and CSV formats
- Run detail modal with full breakdown

**Phase 6: Integration & Polish**
- Full end-to-end STT flow tested
- All pages verified via Playwright
- Responsive Paper-on-Dark design
- Yellow accent color scheme
- Loading and empty states
- Error handling throughout

### Technical Stack
- **Frontend**: React 18, TypeScript, Vite 6, React Router 7
- **Backend**: Node.js, Express, TypeScript, tsx
- **API**: OpenAI Realtime API (Whisper), GPT-4o Mini for evaluation
- **Styling**: Custom CSS with design tokens
- **Storage**: localStorage for profiles and runs

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-08 | Full MVP release with all features |
| 0.1.0 | 2026-01-08 | Project scaffold initialized |
