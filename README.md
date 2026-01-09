# 🎙️ STT Tuning Console

<div align="center">

**OpenAI Realtime Speech-to-Text Tuning Console**

*Parameter optimization and grading validation for radio telephony training*

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Realtime_API-412991?style=flat-square&logo=openai&logoColor=white)](https://platform.openai.com/)

</div>

---

## 📋 Overview

A local web application designed for tuning and validating speech-to-text grading parameters. Perfect for:

| Feature | Description |
|---------|-------------|
| 🎯 **STT Quality Testing** | Test OpenAI Realtime STT quality across different microphone conditions |
| ⚖️ **Parameter Tuning** | Fine-tune grading weights for Accuracy, Fluency, and Structure |
| 🤖 **LLM Evaluation** | AI-driven evaluation with detailed score breakdowns |
| 📊 **Performance Monitoring** | Track latency, errors, and cost per test run |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| ⚛️ **React 18** | Modern UI with hooks and functional components |
| 📘 **TypeScript** | Type-safe development |
| ⚡ **Vite** | Lightning-fast HMR and build tooling |
| 🎨 **CSS Variables** | Steampunk-themed design system |

### Backend
| Technology | Purpose |
|------------|---------|
| 🟢 **Node.js** | JavaScript runtime |
| 🚂 **Express** | Lightweight web framework |
| 🔑 **Ephemeral Tokens** | Secure OpenAI API integration |

### APIs
| Service | Purpose |
|---------|---------|
| 🎙️ **OpenAI Realtime API** | Real-time speech transcription |
| 🧠 **OpenAI GPT-4o** | Intelligent response evaluation |

---

## 📁 Project Structure

```
📦 stt-tuning-console/
├── 📂 apps/
│   ├── 📂 web/                  # React frontend
│   │   └── 📂 src/
│   │       ├── 📂 pages/        # Route components (STT Test, Parameters, etc.)
│   │       ├── 📂 components/   # Reusable UI components
│   │       ├── 📂 hooks/        # Custom React hooks
│   │       ├── 📂 types/        # TypeScript definitions
│   │       ├── 📂 utils/        # Utility functions
│   │       └── 📂 data/         # Default profiles & sample questions
│   │
│   └── 📂 server/               # Express backend
│       └── 📂 src/
│           ├── 📂 routes/       # API endpoints
│           └── 📂 utils/        # Server utilities
│
├── 📂 docs/                     # Documentation
│   ├── 📄 PRD.md               # Product Requirements
│   └── 📄 styleguide.md        # UI Design System
│
├── 📄 DEBUG.md                  # Debug log & troubleshooting
└── 📄 package.json              # Monorepo configuration
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **OpenAI API Key** with Realtime API access

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd stt-tuning-console

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Start development servers
npm run dev
```

### Access

- 🌐 **Frontend:** http://localhost:5173
- 🔌 **Backend API:** http://localhost:3001

---

## 📖 Features

### 🎙️ STT Test Page
- One-click recording with visual feedback
- Real-time transcription display
- Automatic scoring and evaluation
- Question navigation with shuffle

### ⚙️ Parameters Page
- Weight adjustment (Accuracy/Fluency/Structure)
- Fluency settings (pause thresholds, filler penalties)
- Normalization options (digit/word equivalence)
- Profile import/export

### 📝 Prompts Page
- Customizable scoring prompts
- Model selection (GPT-4o, GPT-4o-mini)
- Temperature control
- Payload preview

### 📊 Scoring Page
- Visual explanation of scoring algorithm
- Real-time weight display
- Pass/fail criteria

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| 📋 [PRD](./docs/PRD.md) | Product Requirements Document |
| 🎨 [Style Guide](./docs/styleguide.md) | UI Design System (Steampunk Theme) |
| 🐛 [Debug Log](./DEBUG.md) | Issue tracking and troubleshooting |

---

## 🎨 Design

The application features a unique **Steampunk** aesthetic:

- 🟤 **Brass & Copper** color palette
- 📜 **Paper textures** for cards
- ⚙️ **Industrial** visual elements
- 🖋️ **Victorian-inspired** typography

---

## 📝 License

MIT License - See [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built with 🔧 by MAGES Studio**

</div>
