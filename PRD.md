# Product Requirements Document (PRD)
## Euchre Reasoning Arena

**Repository:** `estern1011/euchre-reasoning-arena`
**Timeline:** 2 weeks (Nov 30 - Dec 13, 2025)
**Target:** AI Gateway Game Hackathon - Model Eval Game Category
**Status:** v1.7 - Production Hardening Complete 🔒
**Last Updated:** Dec 4, 2025

---

## Progress Summary

### ✅ Completed

#### Backend Infrastructure
- **Game Engine** - Full Euchre implementation with trump selection, bidding, card play
- **Test Suite** - 397 tests with comprehensive coverage
  - Added 13 tests for illegal move handling
  - Added 22 tests for AI agent service
  - Test speed optimized with fake timers (12s → 600ms)
- **AI Gateway Integration** - Using Vercel AI SDK with `streamText()` for token-by-token streaming
- **API Endpoints:**
  - `/api/new-game` - Initialize new game with model selection
  - `/api/play-next-round` - Non-streaming fallback endpoint
  - `/api/stream-next-round` - **SSE streaming endpoint** ✅ **WORKING END-TO-END!**
  - `/api/models` - Available model list
- **SSE Streaming Implementation** - Real-time AI reasoning tokens via Server-Sent Events
  - Uses `ReadableStream` + `sendStream()` for browser compatibility
  - Proper SSE format (`data: {...}\n\n`)
  - Event types: `player_thinking`, `reasoning_token`, `decision_made`, `round_complete`, `illegal_attempt`
  - Streaming verified with 80+ reasoning tokens per player
  - **Critical Fix:** Switched from `createEventStream()` to `ReadableStream` for fetch() compatibility
- **Illegal Move Handling** - AI gets one retry before fallback to legal card
  - Tracks illegal attempts in `CardPlayResult.illegalAttempt`
  - Emits `illegal_attempt` SSE events
  - Displays in activity log and reasoning modal

#### Frontend UI
- **Landing Page** - Model selection with code-style aesthetic
- **Game Page** - Full game board with:
  - 4-player diamond layout (North/East/South/West)
  - Model badges and status indicators
  - LIVE badge, phase display, score tracking
  - **Real-time SSE streaming** - AI reasoning displayed token-by-token ✅
  - **Live reasoning persistence** - Reasoning stays visible until next player thinks ✅
  - Activity log updates as decisions are made ✅
  - Game state updates after each round ✅
  - **Player hands display** - All 4 positions show cards ✅
  - **Turned-up card display** - Visible during trump selection ✅
  - Pixelated code-style design throughout
- **Card Component** - Re-themed with enhanced visuals
  - Selectable and selected states
  - Hover effects with scale, lift, and neon glow
  - Redesigned card back with nested borders
  - Lime green (#a3e635) accent color matching code theme
- **Responsive Layout** - Fully responsive design ✅
  - Horizontal: Model names wrap, grid columns scale with viewport width
  - Vertical: Cards, fonts, spacing scale with viewport height using CSS clamp()
  - No scrolling required (works from 500px to 1100px+ height)
  - All player info visible including south position
- **Two-Mode Layout System** ✅ NEW
  - **Arena Mode**: Game board (2fr) + Intelligence sidebar (1fr)
  - **Intelligence Mode**: Multi-agent reasoning grid (2fr) + Compact arena sidebar (1fr)
  - Mode switcher tabs in header (like Cursor's Agent/Editor)
  - MultiAgentReasoning component: 2x2 grid showing all 4 agents simultaneously
  - CompactArena component: Text-based game state with suit symbols for hands
  - Smooth content swapping while preserving state
- **Card Component Fix** ✅ - Removed duplicate rank from center (now shows only suit symbol)

#### State Management
- **Pinia Store** - Replaced URL params with proper state management
  - `stores/game.ts` - Central game state, model IDs, getters
  - Reactive model selection persisting across pages
  - Clean navigation without query params

#### Mode 1: Simulation (Watch) - **CORE COMPLETE!** 🎉
- ✅ 4 AI models play Euchre with visible reasoning
- ✅ Real-time token-by-token AI thought process streaming
- ✅ Manual trick advancement via "playNextRound()" button
- ✅ Trump selection phase working
- ✅ Card playing phase working
- ✅ Game state persists across rounds
- ✅ Activity log shows all player actions
- ✅ Using AI Gateway with Claude Haiku, Gemini Flash, GPT-5 Mini, Grok Fast
- ✅ Illegal move handling with retry and activity log
- ✅ Improved trump bid parsing (handles "PASS" vs "ORDER_UP" correctly)
- ✅ Live reasoning persistence
- ✅ Player hands and turned-up card visible (all cards face-up)
- ✅ Fully responsive layout (horizontal and vertical)
- ✅ Model name wrapping for long names
- ✅ playNextRound button moved to header
- ✅ THINKING status only shows during active streaming
- 🚧 **Needs:** Played cards display, improved thinking panel, better spacing

#### CI/CD & Infrastructure
- GitHub Actions pipeline
- Automated testing on push/PR
- Coverage badges
- Type-safe TypeScript throughout

#### Production Hardening (v1.7) ✅ NEW
- **API Validation** - Zod schemas for all API endpoints (GameState, Position, Card, model IDs)
- **Accessibility (WCAG AA)**
  - Modal: role="dialog", aria-modal, focus trap, Escape key
  - Card component: keyboard navigation (Enter/Space), aria-label
  - aria-live regions for screen readers (ActivityLog, StreamingReasoning)
  - Semantic HTML landmarks (main, aside)
  - Improved color contrast for WCAG compliance
- **Vue/Nuxt Best Practices**
  - Converted module-level refs to Nuxt useState() for SSR safety
  - Added onBeforeUnmount cleanup for event listeners
- **Performance Optimizations**
  - Replaced deep watch with targeted property watch in MultiAgentReasoning
  - Fixed O(n²) hand filtering in store using Set for O(1) lookup
  - Model-specific config to skip temperature for reasoning models (o1, o3, gpt-5)
- **Code Quality**
  - Refactored ai-agent.ts (850 lines) into modular structure (8 files)
  - Fixed TypeScript types using LanguageModelUsage from AI SDK
  - Added timeout cleanup to prevent memory leaks

### 🔄 In Progress

**Polish Mode 1 - Visual Enhancements** (Branch: `polish-mode-1`)

Current focus: Improving card visualization and game state display

### 📋 Immediate Next Steps

1. **Arena Mode Visual Polish** (Priority 1 - NEXT)
   - **Header layout**: Move title to top-left, tabs to the right of it
   - **Card positioning by player**:
     - North: cards below name
     - South: cards above name
     - East: cards to left of name
     - West: cards to right of name (current)
   - **Diamond format played cards**: Cards fan toward center from player who played
   - **Going alone visual**: Gray out partner when player goes alone

2. **Thinking Indicator Fixes** (Priority 1 - BUG)
   - **Indicator not moving**: Fix `currentThinkingPlayer` to update between agents
   - **Immediate feedback**: Show thinking indicator on `player_thinking` event, before first token arrives
   - User should always know which agent is thinking (no "hanging" feeling)

3. **Intelligence Mode Refinements** (Priority 2)
   - **Tiny card visuals**: Show actual mini cards instead of suit symbols for hands
   - **Dynamic trick order**: Don't use fixed N/E/S/W positions for current trick
     - Show cards in order played: `[10♥, K♠, ...]`
     - Lead player changes each trick

4. **Polish Mode 1 - Remaining** (Priority 3)
   - Add game completion modal with final scores
   - Improve error handling UI for failed streams
   - Test full 5-trick game completion
   - Smooth animations and transitions

5. **Deployment** (Priority 4)
   - Set up AI_GATEWAY_API_KEY environment variable
   - Deploy to Vercel
   - Smoke test live deployment
   - Verify streaming works in production

6. **Mode 2: Experimentation** (Priority 5 - If Time Permits)
   - Basic prompt editor for one player
   - Pre-built templates (Aggressive, Conservative, Card Counting)
   - Replay trick with new prompt
   - Simple before/after comparison

### Timeline Status

**Original Deadline:** Dec 13, 2025
**Current Date:** Dec 4, 2025 (9 days remaining)
**Status:** ✅ **AHEAD OF SCHEDULE!**

**Updated Schedule:**
- **Dec 2:** ~~Fix SSE frontend~~ ✅ **DONE!** ~~complete Mode 1~~ ✅ **DONE!**
- **Dec 3:** ✅ Pinia migration, illegal moves, live reasoning, hands display, Card component
- **Dec 4 (TODAY):** ✅ Production hardening - validation, accessibility, performance
  - ✅ Zod validation on all API endpoints
  - ✅ WCAG AA accessibility (modal, keyboard, aria-live)
  - ✅ Performance optimizations (O(n²) fix, deep watch fix)
  - ✅ Code refactoring (ai-agent modularization)
- **Dec 5-6:** Mode 2 (Prompt Editor) - Stretch goal
- **Dec 7-8:** Mode 3 (Rating System) - Stretch goal
- **Dec 9-10:** Comprehensive testing, UI improvements
- **Dec 11:** Demo video production
- **Dec 12:** Final testing & submission prep
- **Dec 13:** Buffer day / submission

---

## 1. Overview

**Euchre Reasoning Arena** is an interactive playground for exploring, comparing, and evaluating AI strategic reasoning through the card game Euchre. Unlike passive model benchmarks, users actively engage with AI decision-making by stepping through games trick-by-trick, experimenting with different prompts, and rating AI reasoning quality in blind comparisons.

### One-Sentence Pitch
> "An interactive laboratory where AI enthusiasts can watch AI models think through Euchre strategy, experiment with different prompts, and crowdsource evaluations of AI reasoning quality."

---

## 2. Product Modes

### Mode 1: Simulation (Watch) - **COMPLETE!** ✅
**Purpose:** Observe AI models play Euchre with visible reasoning

**Status:** ✅ **Fully working end-to-end!**

**User Flow:**
```
1. Select 4 models (default: Claude Haiku, Gemini Flash, GPT-5 Mini, Grok Fast) ✅
2. Click "Start Game" ✅
3. Click "playNextRound()" button ✅
4. Watch AI reasoning stream in real-time ✅
5. See cards played with explanations in activity log ✅
6. Continue through trump selection + 5 tricks ✅
7. View game results with final scores (needs polish)
```

**Implementation Notes:**
- Game initialization ✅
- Model selection ✅
- SSE streaming backend ✅
- Frontend SSE consumption ✅
- Real-time reasoning display (received, needs UI polish)
- Activity log updating ✅
- Game state management ✅

**Known Issues:**
- Reasoning tokens received but not displayed in dedicated panel (enhancement)
- No game completion modal (enhancement)
- THINKING indicator doesn't show active player (enhancement)

---

### Mode 2: Experimentation (Explore) - **PLANNED**
**Purpose:** Test how different prompts affect AI decisions

**Priority:** Implement basic version after Mode 1 complete

**Simplified Scope for Hackathon:**
- Single prompt editor (apply to one player)
- Pre-built templates (Aggressive, Conservative, Card Counting)
- Replay current trick with new prompt
- Basic before/after comparison

**Deferred to Post-Hackathon:**
- Multi-player simultaneous editing
- Prompt diff view
- Prompt marketplace/sharing
- Template evolution

---

### Mode 3: Evaluation (Judge) - **PLANNED**
**Purpose:** Rate AI reasoning quality in blind comparisons

**Priority:** Implement basic version if time permits

**Simplified Scope for Hackathon:**
- Single rating dimension (Overall Quality 1-5 stars)
- Manual game setup (admin-created scenarios)
- In-memory ratings (no database persistence)
- Simple aggregate display

**Deferred to Post-Hackathon:**
- Multi-dimensional ratings (quality, clarity, agreement)
- Vercel KV storage
- Community leaderboard
- A/B comparison mode
- Blind rating flow

---

## 3. Technical Architecture

### Current Stack

```
Platform: Vercel
Framework: Nuxt 3
Language: TypeScript
UI: Vue 3 + Nuxt UI + Tailwind CSS
AI: Vercel AI SDK + AI Gateway (single API key)
State: Vue composables (client-side)
Testing: Vitest + v8 coverage
CI/CD: GitHub Actions
```

### Implemented API Endpoints

**`POST /api/new-game`**
```typescript
// Input
{ modelIds?: [string, string, string, string] }

// Output
{ gameState: GameState }
```

**`POST /api/stream-next-round`** ⭐ **SSE Streaming**
```typescript
// Input
{ gameState?: GameState, modelIds?: [string, string, string, string] }

// Output (Server-Sent Events)
data: {"type":"player_thinking","player":"east","modelId":"..."}

data: {"type":"reasoning_token","player":"east","token":"I should"}

data: {"type":"decision_made","player":"east","action":"pass",...}

data: {"type":"round_complete","gameState":{...},"phase":"..."}
```

**`POST /api/play-next-round`** (Non-streaming fallback)
```typescript
// Input
{ gameState?: GameState, modelIds?: [string, string, string, string] }

// Output
{ gameState: GameState, phase: string, decisions: [...], roundSummary: string }
```

### File Structure

```
euchre-reasoning-arena/
├── server/
│   ├── api/
│   │   ├── new-game.post.ts          # Game initialization (Zod validated)
│   │   ├── stream-next-round.post.ts # SSE streaming (Zod validated)
│   │   ├── play-next-round.post.ts   # Non-streaming fallback (Zod validated)
│   │   └── models.get.ts             # Available models
│   ├── schemas/
│   │   └── game-schemas.ts           # Zod validation schemas
│   └── services/
│       └── ai-agent/                  # Modular AI service (refactored from single file)
│           ├── index.ts              # Public exports
│           ├── config.ts             # Gateway, retry, timeout, model config
│           ├── schemas.ts            # AI response schemas
│           ├── prompts.ts            # System prompts
│           ├── trump-bid.ts          # Trump bidding logic
│           ├── card-play.ts          # Card play logic
│           ├── discard.ts            # Discard logic
│           ├── logger.ts             # Structured logging
│           └── types.ts              # TypeScript types
│
├── lib/
│   └── game/
│       ├── game.ts                    # Core game logic
│       ├── types.ts                   # TypeScript types
│       ├── card.ts                    # Card utilities
│       └── __tests__/                 # 204 tests, 100% coverage
│
├── app/
│   ├── pages/
│   │   ├── index.vue                  # Landing page (model selection)
│   │   └── game.vue                   # Game board (SSE frontend - BLOCKED)
│   │
│   ├── components/
│   │   └── Card.vue                   # Card component
│   │
│   └── composables/                   # Vue composition functions
│       ├── useGameStreaming.ts        # SSE streaming for real-time AI reasoning
│       ├── useGameFlow.ts
│       ├── usePlayerInfo.ts
│       ├── useCardDisplay.ts
│       └── useErrorHandling.ts
│
├── package.json
├── nuxt.config.ts
└── vitest.config.ts
```

---

## 4. Success Criteria

### Minimum Viable Product (Must Have for Hackathon)

**Core Functionality:**
- [x] 4 AI models can be selected
- [x] Game initializes correctly
- [x] Backend streams AI reasoning in real-time
- [ ] **Frontend displays streaming reasoning** (BLOCKED)
- [ ] Full game can be played trick-by-trick
- [ ] Game completes with winner display

**Technical Requirements:**
- [x] Deploys to Vercel
- [x] No TypeScript errors
- [x] Test suite passes
- [ ] No crashes during demo
- [ ] <5s latency per AI decision

**Polish:**
- [x] Responsive on desktop
- [x] Clear, code-style UI
- [ ] Smooth streaming animations
- [ ] Error handling for failures

### Nice to Have

**If Time Permits:**
- [ ] Basic prompt editor (Mode 2)
- [ ] Simple rating system (Mode 3)
- [ ] Demo video with voiceover
- [ ] Comprehensive README

**Explicitly Deferred:**
- ❌ User accounts / authentication
- ❌ Database persistence (Vercel KV)
- ❌ Multiple game history
- ❌ Mobile optimization
- ✅ ~~Accessibility audit~~ - WCAG AA implemented (v1.7)
- ❌ Prompt marketplace
- ❌ Advanced statistics
- ❌ Rate limiting
- ❌ Error tracking (Sentry)

---

## 5. Risk Assessment

| Risk | Impact | Status | Mitigation |
|------|--------|--------|------------|
| **SSE frontend not working** | **CRITICAL** | **ACTIVE** | Debug fetch issue; fallback to EventSource API if needed |
| AI calls too slow | High | Mitigated | Using fast models (Haiku, Flash, 3.5-turbo) |
| Scope too ambitious | High | Managed | Simplified Mode 2/3, focused on Mode 1 |
| Deployment issues | Medium | Pending | Test deployment early (Dec 4-5) |
| Demo video quality | Medium | Pending | Record multiple takes, edit carefully |

---

## 6. Future Roadmap (Post-Hackathon)

### Phase 1: Core Game Completion
**Focus:** Complete the game experience before adding features

- **Full game support** (multi-hand to 10 points)
  - Currently only plays 1 hand (5 tricks)
  - Need: Cumulative score tracking, re-dealing, dealer rotation, game over detection
  - Requires game state restructuring (add `Match` wrapper around `Hand`)
- **Searchable model dropdown**
  - Replace hardcoded dropdowns with searchable combobox
  - `/api/models` already returns 8+ models - just need UI
- **UI Polish**
  - Agent panel click-for-details (model name, team, decision history, reasoning)
  - Arena view improvements in Intelligence Mode
  - Auto-play option (run full game without manual advancement)

### Phase 2: Persistence & Infrastructure
**Focus:** Add database to enable all future features

- **Database integration** (Neon Postgres recommended)
  - Port schema concepts from `../euchre` Ruby project
  - Tables: tournaments, games, hands, tricks, trump_decisions, card_plays
  - Enables: game history, stats, multi-game tracking
- **Decision logging**
  - Adapt `decision_logger.rb` patterns from old repo
  - Track every trump bid, card play, discard with full reasoning + game state
  - File + database persistence
- **Prompt versioning**
  - Track prompt changes over time per agent
  - Enable A/B testing of prompts

### Phase 3: Experimentation & Evaluation
**Focus:** Enable prompt editing and AI evaluation

- **Prompt editor** (Mode 2)
  - `customPrompt` params already exist in function signatures - just need UI
  - Per-player prompt overrides
  - Template library (Aggressive, Conservative, Card Counting)
  - Before/after comparison view
- **LLM as a Judge**
  - Port `bower_accuracy_judge.rb` from old repo
  - Evaluate: bower understanding, strategic reasoning, move quality
  - Structured prompts with temp 0.0 for consistency
  - Store evaluations in database
- **Memory/cost tracking**
  - Tokens used per decision
  - Cost per game/tournament
  - Reasoning length trends

### Phase 4: Multi-Game & Tournaments
**Focus:** Run experiments at scale

- **Tournament system**
  - Port from `../euchre` - tournaments → games → hands hierarchy
  - N games in a row with aggregate tracking
  - Seat rotation between games
- **Agent evolution**
  - Port learning conditions from old repo (A-F)
  - Agents rewrite their own prompts based on feedback
  - Per-hand or post-game evolution options
- **Stats dashboard**
  - Win rates per model
  - Decision accuracy metrics
  - Performance over time
  - Model comparison reports

### Phase 5: Human Play & Community
**Focus:** Allow humans to participate

- **Human player support**
  - Port WebSocket infrastructure from `../euchre`
  - Token-based position claiming
  - Any combination of humans/AI
  - Heartbeat monitoring for disconnections
- **User accounts** (optional login)
- **Game replay** - Save and share interesting games
- **Prompt marketplace** - Share and rate templates
- **Leaderboard** with aggregate stats

### Phase 6: Expansion
- **Additional games:** Bridge, Hearts, Poker
- **Research API** - Data export for analysis
- **Educational mode:** Teach Euchre strategy
- **Research paper:** "Crowdsourcing AI Strategy Evaluation"

---

### Database Decision

**Recommended: Neon (Serverless Postgres)**

| Option | Fit | Notes |
|--------|-----|-------|
| **Neon** | ⭐⭐⭐⭐⭐ | Direct port of `../euchre` PostgreSQL schema, scales to zero, generous free tier |
| **Supabase** | ⭐⭐⭐⭐ | Postgres + realtime + auth. Good if human play is prioritized |
| **Turso** | ⭐⭐⭐⭐ | SQLite at edge, simpler, schema still portable |

The old `../euchre` repo has a complete PostgreSQL schema covering:
- Tournament/game/hand hierarchy
- Trump decisions with reasoning
- Card plays with game state context
- Prompt version history
- LLM judge evaluations

This can be ported almost directly to Neon/Supabase.

---

### Assets from `../euchre` Repo (Ruby)

High-value code to port:
1. **Decision Logger** - Tracks all decisions with reasoning + context
2. **Bower Accuracy Judge** - LLM evaluator with structured prompts
3. **Prompt Manager** - Prompt versioning per agent
4. **Learning Methods** - 6 evolution conditions (A-F)
5. **Database Schema** - Complete tournament tracking structure
6. **Game Session Manager** - WebSocket + REST for human play

---

### Long-term Vision

**Goal:** Become the standard platform for evaluating AI strategic reasoning through interactive games.

**Potential:**
- Research tool for AI alignment
- Prompt engineering playground
- Model comparison benchmark
- Educational resource for game strategy

---

## 7. Development Guidelines & Code Quality

### Remove AI Code Slop

All code changes must actively remove AI-generated patterns that don't belong in this codebase:

#### Banned Patterns
- **Excessive Comments:** Remove comments that a human wouldn't add or are inconsistent with the file's style
- **Defensive Checks:** Remove unnecessary try/catch blocks or validation in trusted/validated codepaths  
- **Type Workarounds:** Remove `as any` casts used to bypass TypeScript issues
- **Generic Styling:** Remove cookie-cutter CSS/components that lack project-specific character
- **Over-Engineering:** Remove abstraction layers that serve no purpose

#### What to Keep
- **Minimal Comments:** Only for complex business logic or external API quirks
- **Necessary Error Handling:** Only where external systems (AI Gateway, network) can fail
- **Proper Types:** Strong typing without shortcuts
- **Project-Specific Code:** Code that matches existing patterns and style

#### Reporting Requirement
After removing slop, provide a brief 1-3 sentence summary of what was changed.

### Frontend Design Principles

**Aesthetic Direction:** Vercel-inspired monochrome with strategic color accents, pixelated/code-style, wireframe-like

**Design Inspiration Sources:**
- **Vercel.com** - Clean, monochrome, technical aesthetic
- **dtc-benchmark-report-doug.vercel.app** - Data-driven reports with structured layouts
- **helix-ai-doug.vercel.app** - Research-focused, scientific presentation
- **ctx-engineering.vercel.app** - Code-style typography, technical documentation

**Key Design Elements:**
- **Typography:** Code-style fonts (monospace, technical). Avoid generic fonts like Inter, Arial, system defaults
- **Color Scheme:** Primarily monochrome (black/white/grays) with strategic color pops for emphasis
- **Layout:** Wireframe-like structures, technical diagrams, asymmetric compositions
- **Motion:** Subtle animations focusing on token-by-token text reveals for AI reasoning
- **Visual Details:** Textures, grain overlays, gradient meshes that reinforce the technical aesthetic

**Frontend Implementation Requirements:**
- Create distinctive, production-grade interfaces with high design quality
- Avoid generic "AI slop" aesthetics - no purple gradients on white backgrounds
- Match implementation complexity to aesthetic vision
- Use creative, context-specific design choices
- Implement bold maximalism or refined minimalism with clear intentionality

## 8. Key Decisions & Trade-offs

### Technology Choices

**Why Nuxt 3 over Next.js?**
- Vue's reactivity system
- Nuxt UI component library
- Server-side rendering flexibility

**Why AI Gateway over direct SDK?**
- Single API key for all providers
- Built-in rate limiting
- Simplified billing

**Why SSE over WebSockets?**
- Simpler protocol for one-way streaming
- Better Vercel compatibility
- Easier error handling

### Scope Decisions

**Included in Hackathon:**
- ✅ Mode 1 (Simulation) - Core value prop
- ✅ SSE streaming - Showcase AI SDK capability
- ✅ Manual trick control - Interactive engagement

**Deferred to Post-Hackathon:**
- ❌ Complex prompt editor
- ❌ Database-backed ratings
- ❌ User accounts
- ❌ Mobile optimization

**Rationale:** Focus on shipping one mode extremely well rather than three modes poorly.

---

## 8. Open Questions

### Technical

1. **SSE Implementation:** Should we use EventSource API instead of fetch()?
   - **Current:** Using fetch() with ReadableStream
   - **Alternative:** EventSource (built-in SSE support)
   - **Decision:** Try EventSource if fetch continues to fail

2. **Error Recovery:** How to handle mid-stream failures?
   - **Option A:** Retry entire round
   - **Option B:** Continue with fallback to non-streaming
   - **Decision:** TBD after SSE is working

### Product

3. **Euchre Knowledge:** Assume users know rules?
   - **Decision:** Collapsible rules tooltip + link to external guide

4. **Model Selection:** Fixed set or user choice?
   - **Current:** Fixed default set (Claude, Gemini, GPT, Grok)
   - **Future:** Allow custom selection

5. **Prompt Length:** Character limit for custom prompts?
   - **Decision:** 1000 char limit for Mode 2

---

## 9. Appendix

### Model Configuration

```typescript
const DEFAULT_MODELS = [
  "anthropic/claude-haiku-4.5",       // Fast, cheap, reliable
  "google/gemini-2.5-flash",          // Fast, creative reasoning
  "openai/gpt-5-mini",                // Balanced performance
  "xai/grok-4.1-fast-non-reasoning"   // Fast alternative
]
```

### SSE Event Types

```typescript
type SSEEvent =
  | { type: 'player_thinking', player: Position, modelId: string }
  | { type: 'reasoning_token', player: Position, token: string }
  | { type: 'decision_made', player: Position, action: TrumpBidAction | Card, ... }
  | { type: 'round_complete', gameState: GameState, phase: string, ... }
  | { type: 'error', message: string }
```

---

## Sign-Off

**Product Owner:** estern1011
**Submission Deadline:** December 12, 2025, 11:59 PM PST
**Days Remaining:** 11

**Critical Path:**
1. Fix SSE frontend connection (Dec 2-3)
2. Complete Mode 1 end-to-end (Dec 3-4)
3. Deploy and test live (Dec 4-5)
4. Polish and demo video (Dec 11-12)

**Status:** On track if SSE issue resolved by Dec 3

---

**End of PRD**
