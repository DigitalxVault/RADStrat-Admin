# STT Tuning Console

OpenAI Realtime Speech-to-Text tuning console for parameter optimization and grading validation.

## Overview

Local web application for:
- Testing OpenAI Realtime STT quality across different mic conditions
- Tuning grading parameters (Accuracy / Fluency / Structure)
- LLM-driven evaluation with score breakdowns
- Monitoring latency, errors, and cost per test

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Realtime:** OpenAI Realtime API with ephemeral client secrets

## Project Structure

```
├── apps/
│   ├── web/              # React frontend
│   │   └── src/
│   │       ├── pages/        # Route components
│   │       ├── components/   # Shared UI components
│   │       ├── audio/        # Audio capture utilities
│   │       ├── realtime/     # OpenAI Realtime connection
│   │       ├── scoring/      # Evaluation logic
│   │       ├── storage/      # localStorage utilities
│   │       ├── hooks/        # Custom React hooks
│   │       ├── types/        # TypeScript definitions
│   │       └── data/         # Default profiles & sample data
│   └── server/           # Express backend
│       └── src/
│           ├── routes/       # API endpoints
│           └── utils/        # Helper utilities
└── docs/                 # Documentation
    ├── PRD.md
    └── styleguide.md
```

## Setup

1. Copy `.env.example` to `.env` and add your OpenAI API key
2. Install dependencies: `npm install`
3. Start development: `npm run dev`

## Documentation

- [PRD](./docs/PRD.md) - Product Requirements Document
- [Style Guide](./docs/styleguide.md) - UI Design System
