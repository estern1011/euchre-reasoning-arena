# Euchre Reasoning Arena

**How well do AI models handle uncertainty?**

Built for the **AI Gateway Game Hackathon** (Model Eval Game Category).

![Tests](https://github.com/estern1011/euchre-reasoning-arena/workflows/Tests/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-98%25-brightgreen)
![Tests](https://img.shields.io/badge/tests-569%20passing-brightgreen)

---

## Overview

Euchre Reasoning Arena evaluates how well AI models and prompt strategies calibrate confidence and manage uncertainty. In Euchre, players don't know the contents of their opponents' or partner's hands. Players must coordinate with their partner without directly conversing. In real-world applications, models constantly face decisions under uncertainty. This platform measures whether they handle that well.

Models report their confidence (0-100%) for every decision they make. Models can optionally spend points on "lifeline" tools when uncertain: Ask Audience polls other AIs, Situation Lookup consults strategy guides, and 50/50 eliminates bad options. A well-calibrated model should use tools when genuinely uncertain and trust its judgment when confident. The platform tracks Brier scores, visualizes calibration curves, and generates AI-powered insights about each model's uncertainty management patterns. When configuring a game, you can choose between different levels of aggressiveness in strategy, or choose to have the model play without any strategy guidance.

---

## Demo Video

Watch a complete hand being played, from setup through analysis:

[![Demo Video](https://vumbnail.com/1146463794.jpg)](https://vimeo.com/1146463794)

---

## Key Features

### Lifeline Tools
| Tool | Cost | Description |
|------|------|-------------|
| Ask Audience | 2 pts | Poll 3 other AI models for their opinions |
| Situation Lookup | 1 pt | Reference play recommendations for the situation |
| 50/50 | 3 pts | Eliminate half the wrong options |

### Per-Agent Configuration
Configure different prompt strategies per player:
| Mode | Strategy |
|------|----------|
| Raw | No strategic guidance |
| Safe | Conservative play style |
| Neutral | Balanced tips |
| YOLO | Aggressive risk-taking |

### Live Analysis
- Real-time reasoning streams as models think
- Confidence tracking with visual indicators
- Brier score tracking for calibration quality
- Post-game AI-generated insights

### Full Euchre Implementation
- Complete rules: trump selection, bowers, going alone, euchre scoring
- 569 tests with 98% coverage
- Supports any model via AI Gateway

---

## Quick Start

```bash
# Install dependencies
bun install

# Set your API key
echo "AI_GATEWAY_API_KEY=your_key_here" > .env

# Start development server
bun run dev
```

Open http://localhost:3000

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 3 |
| Language | TypeScript |
| UI | Vue 3 + Custom CSS |
| AI | Vercel AI SDK + AI Gateway |
| Streaming | Server-Sent Events |
| Testing | Vitest (98% coverage) |
| Runtime | Bun |

---

## Project Structure

```
euchre-reasoning-arena/
├── app/                    # Nuxt frontend
│   ├── pages/             # Vue pages (index, game, analysis)
│   ├── components/        # Vue components
│   └── stores/            # Pinia state management
├── server/                 # API endpoints
│   ├── api/               # SSE streaming, game state
│   └── services/          # AI agent logic, tools
├── lib/                    # Shared game engine
│   ├── game/              # Euchre rules, validation
│   └── scoring/           # Calibration, hand strength
└── public/                 # Static assets
```

---

## Testing

```bash
bun run test:run      # Run once
bun run test:coverage # Coverage report
```

**Coverage:** 569 tests, 98% statements, 100% functions

---

## Screenshots

### Game Setup
Configure models and prompt strategies for each player:

![Setup](screenshots/setup_page.png)

### Live Gameplay
Watch AI models reason in real-time with confidence tracking:

![Gameplay](screenshots/gameplay.png)

### Prompt Inspection
See exactly what each model receives:

![Prompt Modal](screenshots/prompt_modal.png)

### Reasoning History
Review all decisions with full reasoning chains:

![History](screenshots/history_modal.png)

### Post-Game Analysis
Calibration scores and AI-generated insights:

![Analysis](screenshots/analysis_page.png)

---

## License

MIT
