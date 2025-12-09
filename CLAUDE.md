# Claude Code Context

## Project Overview

**Euchre Reasoning Arena** - An AI model evaluation platform through the card game Euchre. Built for the AI Gateway Game Hackathon (Model Eval Game category).

**Deadline:** December 12, 2025

## Metacognition Arena (Implemented)

A tool-use system where AI agents can optionally use "lifelines" at point costs. Evaluates AI calibration: "Do models know what they don't know?"

### Implemented Features

**Tool System (Lifelines)**
- **Ask Audience** (cost: 2) - Poll simulated audience for collective wisdom
- **Situation Lookup** (cost: 1) - Reference play recommendations for the situation
- **50/50** (cost: 3) - Eliminate half the wrong options

**Calibration Scoring**
- Agents report confidence (0-100) with each decision
- Score = confidence × correctness - tool costs
- Tracks Brier scores, calibration curves, decision quality

**Hand Strength Analysis**
- Trump card values: Right Bower (12), Left Bower (11), A (10), K (9), Q (8), 10 (7), 9 (6)
- Off-suit values: A (5), K (4), Q (3), J (2), 10 (1), 9 (0)
- Categories: Strong (25+), Medium (15-24), Weak (<15)
- Matrix view for Round 2 showing strength across all potential trump suits

**Analysis Page**
- Game Insights panel with AI-generated observations
- Performance Scoreboard with calibration metrics
- Hand Strength panel (ranking view for Round 1, matrix for Round 2)
- Tool Panel showing usage counts and costs per player
- Activity Log with tool usage highlighting (icons: 👥 📖 50/50)
- Reasoning History modal with full decision details

**Post-Hand Analysis**
- AI-generated insights after each hand
- Tracks patterns across players and models
- Evolving game narrative

## Key Directories

```
/server/services/ai-agent/   # AI decision making (streamObject, generateObject)
/server/services/tools/      # Tool implementations (ask-audience, situation-lookup, fifty-fifty)
/server/api/                 # Nuxt API endpoints (SSE streaming)
/server/api/analysis/        # Post-hand analysis endpoints
/app/components/             # Vue UI components
/app/stores/game.ts          # Pinia state management (game history, tool tracking)
/app/pages/                  # Vue pages (index, game, analysis)
/lib/game/                   # Euchre game engine (pure TypeScript)
/lib/scoring/                # Calibration scoring, hand strength calculations
```

## Architecture Patterns

### SSE Streaming
Real-time AI reasoning via Server-Sent Events:
- `player_thinking` - Agent starting to think
- `reasoning_token` - Streaming partial reasoning
- `tool_request` - Agent requesting a tool
- `tool_progress` - Tool execution progress
- `tool_result` - Tool execution result
- `decision_made` - Final decision with confidence
- `round_complete` - Phase/trick complete

### AI SDK Usage
```typescript
// Structured output with Zod schemas
const { partialObjectStream } = await streamObject({
  model: getModel(modelId),
  schema: CardPlaySchema,  // Includes confidence, toolRequest
  messages: [...]
});
```

### Two-Phase Decisions
1. Get initial confidence + optional tool request
2. If tool requested, execute and add results to context
3. Get final decision with tool context

### Game History Tracking
- `gameHistory.hands[]` - All hands with trump decisions and tricks
- `toolUsed` property on decisions/plays for tool tracking
- Prevents duplicate hand records

## Key Components

### Analysis Page (`/app/pages/analysis.vue`)
- Three-column layout: Insights | Scoreboard+Strength+Tools | Activity Log
- Real-time game state display
- Tool usage highlighting in activity feed

### Performance Scoreboard (`/app/components/PerformanceScoreboard.vue`)
- Per-player calibration scores
- Decision counts, accuracy rates
- Tool cost tracking

### Hand Strength Panel (`/app/components/HandStrengthPanel.vue`)
- Round 1: Ranked list by strength for turned-up trump
- Round 2: Matrix showing strength for each potential trump suit
- Highlights best suit per player

### Tool Panel (`/app/components/ToolPanel.vue`)
- Shows available tools with costs
- Per-player usage counts
- Total cost calculation from game history

## Testing

```bash
bun test              # Run tests in watch mode
bun run test:run      # Run tests once
bun run test:coverage # Coverage report
```

- Tests in `lib/game/__tests__/`, `lib/scoring/__tests__/`, and `server/services/ai-agent/__tests__/`

## Development

```bash
bun install           # Install dependencies
bun run dev           # Start dev server on :3000
bun run build         # Production build
```

## Environment Variables

- `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key (required)

## UI Design

Code-style aesthetic with:
- Monospace fonts (Courier New, Consolas)
- Comment syntax (`// section_name`)
- Function call styling (`viewHistory()`)
- Grid background pattern
- Teal accent color (#38bdb8)
- Team colors: NS (lime #a3e635), EW (blue #60a5fa)
