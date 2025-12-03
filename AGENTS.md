# AGENTS.md

Agent briefing packet for the Euchre Reasoning Arena project.

## Build & Test

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests with coverage
bun test

# Run type checking
bun run typecheck

# Run linting
bun run lint

# Build for production
bun run build

# Preview production build
bun run preview
```

## Architecture Overview

**Stack:** Nuxt 3 + TypeScript + Vue 3 + Nuxt UI + Tailwind CSS + Vercel AI SDK
**Platform:** Vercel deployment
**AI:** AI Gateway with multiple model providers (Claude, Gemini, GPT, Grok)

### Key Components

- **Game Engine** (`lib/game/`) - Core Euchre logic with 100% test coverage
- **API Endpoints** (`server/api/`) - RESTful and SSE streaming endpoints
- **Frontend** (`app/`) - Vue.js components with real-time AI reasoning display
- **AI Integration** (`server/services/ai-agent.ts`) - Vercel AI SDK with streaming

### File Structure

```
lib/game/           # Core game logic (pure functions)
├── game.ts         # Main game state management
├── types.ts        # TypeScript type definitions
├── card.ts         # Card utilities and enums
└── __tests__/      # 204 tests, 100% coverage

server/api/         # API endpoints
├── new-game.post.ts           # Game initialization
├── stream-next-round.post.ts  # SSE streaming endpoint
├── play-next-round.post.ts    # Non-streaming fallback
└── models.get.ts             # Available AI models

app/                # Frontend Vue.js application
├── pages/
├── components/
└── layouts/
```

## Security

- **Environment Variables:** `AI_GATEWAY_API_KEY` required for AI Gateway
- **No Secrets in Frontend:** All AI calls go through backend API
- **Rate Limiting:** Built into AI Gateway
- **Input Validation:** TypeScript types enforce game state integrity

## Git Workflows

- `main` branch for stable releases
- Feature branches for development
- All changes via pull request
- GitHub Actions CI runs tests automatically
- Deploy to Vercel on merge to main

## Conventions & Patterns

### TypeScript

- **Strict Types:** No `any` casts to bypass type issues
- **Pure Functions:** Game logic is stateless and testable
- **Type Guards:** Use proper type checking, not assertions

### Vue/Nuxt

- **Composition API:** Use `<script setup>` syntax consistently
- **Nuxt UI:** Use existing components before creating custom ones
- **Tailwind:** Use utility classes, avoid custom CSS when possible

### Testing

- **100% Coverage:** All game logic must be tested
- **Unit Tests:** Focus on pure functions in `lib/game/`
- **Integration Tests:** Test API endpoints with real game flows

### AI Integration

- **Streaming First:** Use SSE for real-time AI reasoning display
- **Error Handling:** Graceful fallbacks for AI failures
- **Multiple Models:** Support 4 different AI providers simultaneously

### Code Style

- **No AI Slop:** See "Remove AI Code Slop" section below
- **Consistent Formatting:** Use project's ESLint/Prettier config
- **Minimal Comments:** Code should be self-documenting
- **No Defensive Programming:** Trust validated inputs, don't over-engineer

## Frontend Design Principles

**Aesthetic Direction:** Vercel-inspired monochrome with color accents, pixelated/code-style, wireframe-like

**Design Inspiration:**
- Vercel.com - Clean, monochrome, technical aesthetic
- dtc-benchmark-report-doug.vercel.app - Data-driven reports
- helix-ai-doug.vercel.app - Research-focused, scientific
- ctx-engineering.vercel.app - Code-style typography, technical content

**Key Elements:**
- **Typography:** Code-style fonts (monospace, technical), avoid generic fonts like Inter/Arial
- **Color Scheme:** Primarily monochrome (black/white/grays) with strategic color pops
- **Layout:** Wireframe-like, technical diagrams, asymmetric compositions
- **Motion:** Subtle animations, token-by-token text reveals
- **Backgrounds:** Textures, grain overlays, gradient meshes that fit technical aesthetic

## Remove AI Code Slop

When making changes, actively remove AI-generated patterns that don't belong:

### Banned Patterns

- **Excessive Comments:** Remove comments that a human wouldn't add or are inconsistent with the file's style
- **Defensive Checks:** Remove unnecessary try/catch blocks or validation in trusted codepaths
- **Type Workarounds:** Remove `as any` casts used to bypass TypeScript issues
- **Generic Styling:** Remove cookie-cutter CSS/components that lack project-specific character
- **Over-Engineering:** Remove abstraction layers that serve no purpose

### What to Keep

- **Minimal Comments:** Only for complex business logic or external API quirks
- **Necessary Error Handling:** Only where external systems (AI Gateway, network) can fail
- **Proper Types:** Strong typing without shortcuts
- **Project-Specific Code:** Code that matches the existing patterns and style

### Reporting

After removing slop, provide a brief 1-3 sentence summary of what was cleaned up.

## Environment Variables

```bash
# Required for AI Gateway integration
AI_GATEWAY_API_KEY=your_key_here

# Optional for development
NUXT_DEV_HTTPS=false
```

## Deployment Notes

- **Vercel Platform:** Optimized for Nuxt 3 SSR
- **Environment Variables:** Set `AI_GATEWAY_API_KEY` in Vercel dashboard
- **Build Command:** `bun run build`
- **Output Directory:** `.output/`
- **Node.js Version:** 18+ required

## External Dependencies

- **AI Gateway:** Single API key for Claude, Gemini, GPT, Grok models
- **Vercel AI SDK:** For streaming text generation
- **Nuxt UI:** Component library and design system
- **Vitest:** Testing framework with v8 coverage

## Domain Knowledge

**Euchre Rules Summary:**
- 4 players, partnerships (North/South vs East/West)
- 24-card deck (9, 10, J, Q, K, A of each suit)
- Trump suit selection phase, then 5 tricks
- First team to 10 points wins
- Complex scoring with "going alone" and "euchre" bonuses

**AI Models Used:**
- `anthropic/claude-haiku-4.5` - Fast, reliable reasoning
- `google/gemini-2.5-flash` - Creative strategic thinking  
- `openai/gpt-5-mini` - Balanced performance
- `xai/grok-4.1-fast-non-reasoning` - Alternative perspective

## Current Status

**Mode 1 (Simulation):** ✅ Complete - 4 AI models play with visible reasoning
**Mode 2 (Experimentation):** 📋 Planned - Prompt editing capabilities
**Mode 3 (Evaluation):** 📋 Planned - Rating/comparison system

The project is currently focused on polishing Mode 1 and preparing for deployment.