# Claude Code Context

## Project Overview

**Euchre Reasoning Arena** - An AI model evaluation platform through the card game Euchre. Built for the AI Gateway Game Hackathon (Model Eval Game category).

**Deadline:** December 12, 2025

## Current Focus: Metacognition Arena

Building a tool-use system where AI agents can optionally use "lifelines" at point costs. The goal is to evaluate AI calibration: "Do models know what they don't know?"

### Core Features
- Agents report confidence (0-100) with each decision
- Optional tools: Ask Audience, Situation Lookup, 50/50
- Calibration-based scoring (confidence × correctness - tool costs)
- Analysis view with live performance scoreboard
- Post-game rankings by reasoning quality

## Key Directories

```
/server/services/ai-agent/   # AI decision making (streamObject, generateObject)
/server/services/tools/      # Tool implementations (NEW)
/server/db/                  # SQLite database (NEW)
/server/api/                 # Nuxt API endpoints (SSE streaming)
/app/components/             # Vue UI components
/app/stores/game.ts          # Pinia state management
/app/pages/                  # Vue pages (index, game)
/lib/game/                   # Euchre game engine (pure TypeScript)
/lib/scoring/                # Calibration scoring (NEW)
```

## Architecture Patterns

### SSE Streaming
Real-time AI reasoning via Server-Sent Events:
- `player_thinking` - Agent starting to think
- `reasoning_token` - Streaming partial reasoning
- `decision_made` - Final decision with confidence
- `tool_request` - Agent requesting a tool (NEW)
- `tool_result` - Tool execution result (NEW)
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

### Two-Phase Decisions (NEW)
1. Get initial confidence + optional tool request
2. If tool requested, execute and add results to context
3. Get final decision with tool context

## Testing

```bash
bun test              # Run tests in watch mode
bun run test:run      # Run tests once
bun run test:coverage # Coverage report
```

- 397 tests, 98% coverage
- Tests in `lib/game/__tests__/` and `server/services/ai-agent/__tests__/`

## Development

```bash
bun install           # Install dependencies
bun run dev           # Start dev server on :3000
bun run build         # Production build
```

## Environment Variables

- `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key (required)
- `DB_PATH` - SQLite database path (optional, defaults to ./data/euchre.db)

## Related Project

The `../euchre` Ruby project has reference implementations for:
- Tournament system
- LLM judge evaluation
- Prompt evolution
- Decision logging

These patterns can be ported but this is a fresh TypeScript implementation.
