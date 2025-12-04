# Product Requirements Document (PRD)
## Euchre Reasoning Arena

**Repository:** `estern1011/euchre-reasoning-arena`
**Timeline:** 2 weeks (Nov 30 - Dec 13, 2025)
**Target:** AI Gateway Game Hackathon - Model Eval Game Category
**Status:** v1.6 - Two-Mode Layout System Complete 🎨
**Last Updated:** Dec 3, 2025 (Evening)

---

## Progress Summary

### ✅ Completed

#### Backend Infrastructure
- **Game Engine** - Full Euchre implementation with trump selection, bidding, card play
- **Test Suite** - 217 tests with 100% coverage (statement/branch/function/line)
  - Added 13 new tests for illegal move handling
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
**Current Date:** Dec 2, 2025 (11 days remaining)
**Status:** ✅ **AHEAD OF SCHEDULE!**

**Updated Schedule:**
- **Dec 2:** ~~Fix SSE frontend~~ ✅ **DONE!** ~~complete Mode 1~~ ✅ **DONE!**
- **Dec 3 (TODAY):** ✅ Pinia migration, illegal moves, live reasoning, hands display, Card component
  - 🚧 **Current:** Visual card displays with Card components (hands, center, turned-up)
  - 🚧 **Next:** Loading states, animations, polish
- **Dec 3-4:** Complete Mode 1 polish, deploy to Vercel, test live
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
│   │   ├── new-game.post.ts          # Game initialization
│   │   ├── stream-next-round.post.ts # SSE streaming (WORKING)
│   │   ├── play-next-round.post.ts   # Non-streaming fallback
│   │   └── models.get.ts             # Available models
│   └── services/
│       └── ai-agent.ts                # AI SDK integration with streamText()
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
- ❌ Accessibility audit
- ❌ Prompt marketplace
- ❌ Advanced statistics

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

### Phase 2: Enhanced Features (Month 1)
- **Fix and polish all 3 modes**
  - Complete SSE integration
  - Full prompt editor with templates
  - Comprehensive rating system
- **Vercel KV integration** for persistent ratings
- **User sessions** (anonymous tracking)
- **Leaderboard** with aggregate stats

### Phase 3: Community Features (Month 2-3)
- **User accounts** (optional login)
- **Prompt marketplace** - Share and rate templates
- **Game replay** - Save and share interesting games
- **Tournament mode** - Bracket-style competition
- **Research API** - Data export for analysis

### Phase 4: Expansion (Month 4+)
- **Additional games:** Bridge, Hearts, Poker
- **Acontext integration:** Memory across games
- **Educational mode:** Teach Euchre strategy
- **Research paper:** "Crowdsourcing AI Strategy Evaluation"

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
