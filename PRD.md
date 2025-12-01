# Product Requirements Document (PRD)
## Euchre Reasoning Arena

**Repository:** `estern1011/euchre-reasoning-arena`
**Timeline:** 2 weeks (Nov 30 - Dec 13, 2025)
**Target:** AI Gateway Game Hackathon - Model Eval Game Category
**Status:** v1.1 - Game Engine Complete ✅

---

## Progress Summary (Last Updated: Nov 30, 2025)

### ✅ Completed (Nov 30)
**Game Engine Foundation**
- Full Euchre game engine with functional TypeScript architecture
- Trump selection system (2-round bidding: order-up → call-trump)
- Going alone mechanics
- Dealer discard after ordering up
- Bower logic (right bower as J of trump, left bower as J of same color)
- Suit-following validation with effective suit handling
- Trick winner determination
- Score calculation
- Custom error types: `InvalidBidError`, `InvalidPlayError`, `InvalidGameStateError`

**Test Coverage**
- 165 tests across 5 test suites
- 98.14% statement coverage
- 94.76% branch coverage
- 100% function coverage
- Test helpers: `createGameWithTrump()` for skipping trump selection

**Infrastructure**
- GitHub repository: `estern1011/euchre-reasoning-arena`
- GitHub Actions CI/CD pipeline
- Automated test running on push/PR
- Coverage badges in README
- Named constants replacing magic numbers (PLAYERS_PER_GAME, CARDS_PER_HAND, etc.)

**Code Quality**
- Type-safe with comprehensive TypeScript types
- Pure functions with immutable state updates
- Separation of concerns (card logic, game state, errors, utils)
- Defensive programming with unreachable error checks
- Clear JSDoc comments

### 🔄 In Progress
- API routes for AI integration
- Frontend UI components

### 📋 Next Steps
- `/api/play-trick` endpoint implementation
- AI SDK integration (OpenAI, Anthropic, Google)
- Prompt template system
- Game board UI component

---

## 1. Overview

**Euchre Reasoning Arena** is an interactive playground for exploring, comparing, and evaluating AI strategic reasoning through the card game Euchre. Unlike passive model benchmarks, users actively engage with AI decision-making by stepping through games trick-by-trick, experimenting with different prompts, and rating AI reasoning quality in blind comparisons.

### One-Sentence Pitch
> "An interactive laboratory where AI enthusiasts can watch AI models think through Euchre strategy, experiment with different prompts, and crowdsource evaluations of AI reasoning quality."C

---

## 2. Problem Statement

**Current state:**
- Model evaluation is passive (automated benchmarks, leaderboards)
- AI reasoning is often a black box
- Hard to understand *why* models make decisions
- Limited ability to experiment with prompt engineering interactively
- No easy way to crowdsource human judgment of AI strategic reasoning

**What we're building:**
- Interactive, transparent AI decision-making
- Real-time visibility into AI reasoning process
- Playground for prompt experimentation
- Crowdsourced human evaluation of AI quality

---

## 3. Goals & Success Metrics

### Primary Goals

1. **Interactive Transparency**
   - Users see AI thinking in real-time (streaming)
   - Expose reasoning, not just decisions

2. **Experimentation Playground**
   - Users can edit prompts and replay decisions
   - Compare outcomes side-by-side

3. **Crowdsourced Evaluation**
   - Blind rating of AI decisions
   - Aggregate community insights

4. **Hackathon Win**
   - Showcase AI SDK capabilities (streaming, multiple providers)
   - Stand out in Model Eval Game category
   - Judges can interact directly

### Success Metrics

**Hackathon:**
- ✅ Submission by Dec 12, 11:59 PM PST
- ✅ Working demo video
- ✅ Judges can interact with live deployment

**Engagement (post-launch):**
- 100+ human ratings collected in first week
- 50+ games played
- 10+ prompt templates created

**Technical:**
- <2s latency per AI decision (fast models)
- 100% uptime during judging period
- Zero timeout errors

---

## 4. Target Audience

### Primary: AI Enthusiasts
- Interested in LLM capabilities
- Curious about prompt engineering
- Enjoy interactive demos
- May not know Euchre rules (provide tutorial)

### Secondary: Hackathon Judges
- Need to evaluate project quickly
- Want to interact directly
- Looking for technical depth + polish

### Tertiary: AI Researchers (Future)
- Study strategic reasoning
- Collect human evaluation data
- Test prompt strategies

---

## 5. Product Modes

### Mode 1: Simulation (Watch)
**Purpose:** Observe AI models play Euchre with visible reasoning

**User Flow:**
```
1. Select 4 models (e.g., GPT-4, Claude, Gemini, GPT-3.5)
2. Click "Play Next Trick"
3. Watch AI reasoning stream in real-time
4. See cards played with explanations
5. Continue through 5 tricks
6. View game results
```

**Key Features:**
- Real-time streaming of AI thought process
- 4-player game visualization
- Model identification (badges/colors)
- Trick-by-trick control (manual advancement)

---

### Mode 2: Experimentation (Explore)
**Purpose:** Test how different prompts affect AI decisions

**User Flow:**
```
1. Start game simulation
2. Click "Edit Prompts"
3. Modify strategy for one or more players
4. Replay the same trick
5. Compare outcomes side-by-side
6. Save successful prompts as templates
```

**Key Features:**
- Prompt editor (per player)
- Prompt template library (aggressive, conservative, card-counting, etc.)
- Diff view (compare two prompts on same situation)
- Replay functionality
- Export/share prompts

---

### Mode 3: Evaluation (Judge)
**Purpose:** Rate AI reasoning quality in blind comparisons

**User Flow:**
```
1. AIs play a trick (models hidden)
2. User sees 4 decisions with reasoning
3. Rate each on:
   - Decision quality (1-5 stars)
   - Reasoning clarity (1-5 stars)
   - Agreement ("Would you play this?")
4. Submit ratings
5. Models revealed + community aggregate shown
```

**Key Features:**
- Blind rating (model names hidden until submission)
- Multi-dimensional ratings
- A/B comparison mode (pick better of two)
- Community leaderboard
- Personal rating history

---

## 6. Core Features (Detailed)

### 6.1 Game Visualization

**Game Board:**
- 4-player positions (North, East, South, West)
- Current hand display (for each AI)
- Played cards in center
- Trump indicator
- Score display (Teams 0-1 vs 2-3)
- Trick count (1/5, 2/5, etc.)

**Card Display:**
- Standard playing card visuals
- Suit colors (♥♦ red, ♠♣ black)
- Highlight left/right bower when trump is set
- Animation for card plays

---

### 6.2 AI Reasoning Display

**Streaming Output:**
```tsx
<div className="reasoning-panel">
  <div className="model-badge">GPT-4</div>
  <div className="thinking-indicator">💭 Thinking...</div>
  <div className="reasoning-text">
    "I have the right bower (J♥) which is the strongest
    card in play. Since my partner already took this trick,
    I should save my bower for a later trick where..."
    <span className="cursor">▊</span>
  </div>
  <div className="decision">
    → Plays 9♥
  </div>
</div>
```

**Features:**
- Real-time streaming (AI SDK `streamText`)
- Syntax highlighting for card mentions
- Collapsible (hide verbose reasoning)
- Copy to clipboard
- Timestamp/duration

---

### 6.3 Prompt Editor

**Interface:**
```tsx
<PromptEditor>
  <Tabs>
    <Tab label="Player 0 (GPT-4)">
      <Textarea
        value={prompts[0]}
        onChange={...}
        placeholder="You are an expert Euchre player..."
      />

      <TemplateSelector>
        <option>Custom</option>
        <option>Aggressive</option>
        <option>Conservative</option>
        <option>Card Counting</option>
        <option>Partnership Focus</option>
      </TemplateSelector>

      <button>Apply Template</button>
      <button>Save as Template</button>
    </Tab>
    {/* Repeat for players 1-3 */}
  </Tabs>

  <div className="actions">
    <button>Replay Trick</button>
    <button>Save Configuration</button>
  </div>
</PromptEditor>
```

**Prompt Templates:**
```typescript
const TEMPLATES = {
  aggressive: {
    name: "Aggressive Strategy",
    prompt: `You are an aggressive Euchre player. Key principles:
- Lead with trump early to draw out opponent trump
- Go alone when you have 3+ trump
- Play high cards to win tricks quickly
- Don't save cards for later`
  },

  conservative: {
    name: "Conservative Strategy",
    prompt: `You are a conservative Euchre player. Key principles:
- Save trump for critical moments
- Let partner take tricks when possible
- Only go alone with very strong hands
- Count cards to minimize risk`
  },

  cardCounting: {
    name: "Card Counting Focus",
    prompt: `You are a Euchre player focused on card counting.
Track which cards have been played and calculate probabilities.
Reason about what cards opponents likely hold.`
  },

  partnership: {
    name: "Partnership Coordination",
    prompt: `You are a team-oriented Euchre player.
Focus on reading partner signals and coordinating strategy.
Support partner's leads and avoid taking their tricks.`
  }
}
```

---

### 6.4 Rating System

**Rating Dimensions:**

1. **Decision Quality** (1-5 stars)
   - "Was this the right card to play?"

2. **Reasoning Clarity** (1-5 stars)
   - "Was the explanation clear and logical?"

3. **Agreement** (Yes/No/Unsure)
   - "Would you have made the same play?"

**Rating UI:**
```tsx
<RatingCard move={move} modelHidden={true}>
  <CardDisplay card={move.card} />

  <ReasoningDisplay>
    {move.reasoning}
  </ReasoningDisplay>

  <RatingInputs>
    <StarRating
      label="Decision Quality"
      value={rating.quality}
      onChange={...}
    />

    <StarRating
      label="Reasoning Clarity"
      value={rating.clarity}
      onChange={...}
    />

    <AgreementButtons>
      <button>👍 Would Play</button>
      <button>🤷 Unsure</button>
      <button>👎 Wouldn't Play</button>
    </AgreementButtons>
  </RatingInputs>
</RatingCard>
```

**Leaderboard:**
```tsx
<Leaderboard>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Model</th>
        <th>Avg Quality</th>
        <th>Avg Clarity</th>
        <th>Agreement %</th>
        <th>Total Ratings</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>🥇 1</td>
        <td>Claude 3.5 Sonnet</td>
        <td>4.6 ⭐</td>
        <td>4.8 ⭐</td>
        <td>78%</td>
        <td>234</td>
      </tr>
      {/* ... */}
    </tbody>
  </table>
</Leaderboard>
```

---

### 6.5 Comparison Mode

**Side-by-Side:**
```tsx
<ComparisonView>
  <div className="split-screen">
    <div className="option-a">
      <h3>Option A (model hidden)</h3>
      <ReasoningDisplay>{moveA.reasoning}</ReasoningDisplay>
      <CardDisplay card={moveA.card} />
    </div>

    <div className="option-b">
      <h3>Option B (model hidden)</h3>
      <ReasoningDisplay>{moveB.reasoning}</ReasoningDisplay>
      <CardDisplay card={moveB.card} />
    </div>
  </div>

  <VoteButtons>
    <button onClick={() => vote('A')}>
      Option A is Better
    </button>
    <button onClick={() => vote('B')}>
      Option B is Better
    </button>
    <button onClick={() => vote('tie')}>
      About the Same
    </button>
  </VoteButtons>
</ComparisonView>
```

---

## 7. Technical Architecture

### 7.1 Tech Stack

```
Platform: Vercel (single deployment)
Framework: Next.js 15 (App Router)
Language: TypeScript
UI: React + Tailwind CSS
AI: Vercel AI SDK + AI Gateway
State: React hooks (client-side)
Database: Vercel KV (for ratings)
Analytics: Vercel Analytics
```

### 7.2 Project Structure

```
euchre-reasoning-arena/
├── app/
│   ├── page.tsx                    # Home (mode selection)
│   ├── play/page.tsx              # Simulation mode
│   ├── experiment/page.tsx        # Experimentation mode
│   ├── evaluate/page.tsx          # Evaluation mode
│   ├── leaderboard/page.tsx       # Community ratings
│   │
│   └── api/
│       ├── play-trick/route.ts    # Run one trick
│       ├── rate/route.ts          # Submit rating
│       └── stats/route.ts         # Get aggregate stats
│
├── lib/
│   ├── game/                       # Game engine
│   │   ├── card.ts                # Card class
│   │   ├── game.ts                # Game state
│   │   ├── trick.ts               # Trick logic
│   │   ├── player.ts              # Player state
│   │   └── types.ts               # Shared types
│   │
│   ├── ai/
│   │   ├── agent.ts               # AI SDK integration
│   │   ├── prompts.ts             # Prompt templates
│   │   └── models.ts              # Model configs
│   │
│   ├── db/
│   │   └── ratings.ts             # KV operations
│   │
│   └── utils/
│       ├── parse.ts               # Parse AI responses
│       └── format.ts              # Format game state
│
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx
│   │   ├── Card.tsx
│   │   ├── Hand.tsx
│   │   └── TrickDisplay.tsx
│   │
│   ├── ai/
│   │   ├── ReasoningPanel.tsx
│   │   ├── StreamingThought.tsx
│   │   └── ModelBadge.tsx
│   │
│   ├── prompts/
│   │   ├── PromptEditor.tsx
│   │   ├── TemplateSelector.tsx
│   │   └── DiffView.tsx
│   │
│   └── rating/
│       ├── RatingCard.tsx
│       ├── StarRating.tsx
│       ├── Leaderboard.tsx
│       └── ComparisonView.tsx
│
├── public/
│   └── cards/                      # Card images
│
├── package.json
├── tsconfig.json
└── README.md
```

### 7.3 API Routes

**`POST /api/play-trick`**
```typescript
// Input
{
  gameState: GameState,
  prompts: Record<0|1|2|3, string>,
  models: [string, string, string, string]
}

// Output
{
  moves: [
    {
      player: 0,
      model: "gpt-4",
      card: { suit: "hearts", rank: "J" },
      reasoning: "I have the right bower...",
      duration: 2.3
    },
    // ... 3 more moves
  ],
  gameState: GameState,
  trickWinner: 0
}
```

**`POST /api/rate`**
```typescript
// Input
{
  gameId: string,
  trickNumber: number,
  ratings: [
    {
      playerIndex: 0,
      quality: 4,
      clarity: 5,
      agreement: "yes"
    },
    // ... 3 more ratings
  ],
  raterId: string  // Anonymous or user ID
}

// Output
{
  success: true,
  revealedModels: ["gpt-4", "claude-3-5-sonnet", ...],
  aggregateStats: { ... }
}
```

**`GET /api/stats`**
```typescript
// Output
{
  models: [
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      avgQuality: 4.6,
      avgClarity: 4.8,
      agreementRate: 0.78,
      totalRatings: 234
    },
    // ... more models
  ]
}
```

### 7.4 Data Models

**Game State:**
```typescript
interface GameState {
  id: string
  phase: 'dealing' | 'trump_selection' | 'playing' | 'complete'
  players: Player[]
  trump: Suit | null
  currentPlayer: 0 | 1 | 2 | 3
  currentTrick: Trick
  completedTricks: Trick[]
  scores: [number, number]  // Team scores
}

interface Player {
  position: 0 | 1 | 2 | 3
  team: 0 | 1
  hand: Card[]
  modelId: string
}

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  rank: '9' | '10' | 'J' | 'Q' | 'K' | 'A'
}

interface Trick {
  leadPlayer: number
  plays: CardPlay[]
  winner: number | null
}

interface CardPlay {
  player: number
  card: Card
  reasoning?: string
}
```

**Rating:**
```typescript
interface Rating {
  id: string
  gameId: string
  trickNumber: number
  playerIndex: 0 | 1 | 2 | 3
  modelId: string

  // Ratings
  quality: 1 | 2 | 3 | 4 | 5
  clarity: 1 | 2 | 3 | 4 | 5
  agreement: 'yes' | 'no' | 'unsure'

  // Metadata
  raterId: string
  ratedAt: Date
}
```

### 7.5 AI SDK Integration

```typescript
// lib/ai/agent.ts
import { generateText, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'

export class EuchreAgent {
  private model: any

  constructor(modelId: string) {
    if (modelId.includes('gpt')) {
      this.model = openai(modelId)
    } else if (modelId.includes('claude')) {
      this.model = anthropic(modelId)
    } else if (modelId.includes('gemini')) {
      this.model = google(modelId)
    }
  }

  async selectCard(
    gameState: GameState,
    prompt: string,
    stream: boolean = false
  ): Promise<{ card: Card, reasoning: string }> {

    const fullPrompt = `${prompt}

Game State:
${formatGameState(gameState)}

Your hand: ${formatHand(gameState.players[gameState.currentPlayer].hand)}
Trump: ${gameState.trump}

Think through your decision, then select a card to play.
Format: "PLAY: [rank][suit]" (e.g., "PLAY: J♥")`

    if (stream) {
      const { textStream, text } = await streamText({
        model: this.model,
        prompt: fullPrompt,
        temperature: 0.7,
      })

      return {
        textStream,  // For UI streaming
        text         // Final text
      }
    } else {
      const { text } = await generateText({
        model: this.model,
        prompt: fullPrompt,
        temperature: 0.7,
      })

      return {
        card: parseCard(text),
        reasoning: text
      }
    }
  }
}
```

### 7.6 Database (Vercel KV)

```typescript
// lib/db/ratings.ts
import { kv } from '@vercel/kv'

export async function saveRating(rating: Rating) {
  const key = `rating:${rating.id}`
  await kv.set(key, rating)

  // Add to model-specific sorted set for aggregation
  await kv.zadd(
    `ratings:model:${rating.modelId}`,
    { score: Date.now(), member: rating.id }
  )
}

export async function getModelStats(modelId: string) {
  const ratingIds = await kv.zrange(`ratings:model:${modelId}`, 0, -1)
  const ratings = await Promise.all(
    ratingIds.map(id => kv.get<Rating>(`rating:${id}`))
  )

  return {
    avgQuality: average(ratings.map(r => r.quality)),
    avgClarity: average(ratings.map(r => r.clarity)),
    agreementRate: ratings.filter(r => r.agreement === 'yes').length / ratings.length,
    totalRatings: ratings.length
  }
}
```

---

## 8. User Flows

### Flow 1: First-Time User (Simulation)

```
1. Land on homepage
   → See hero: "Watch AI Models Think Through Euchre Strategy"
   → Three mode cards: Simulate, Experiment, Evaluate

2. Click "Try Simulation"
   → Model selector appears
   → Pre-selected: GPT-4, Claude, Gemini, GPT-3.5
   → "Start Game" button

3. Click "Start Game"
   → Game board appears
   → Cards dealt
   → "Euchre is a 4-player trick-taking game..." (collapsible rules)
   → Big "Play Next Trick" button

4. Click "Play Next Trick"
   → 4 reasoning panels appear
   → See streaming: "Player 0 (GPT-4): Thinking..."
   → Text streams in real-time
   → Card animations play
   → Trick winner highlighted

5. Click "Play Next Trick" again
   → Repeat for 5 tricks

6. Game ends
   → Results screen
   → "Team 0-2 wins! 10-7"
   → "Try Experiment Mode" CTA
```

### Flow 2: Experimenting with Prompts

```
1. Start from simulation mode
2. After trick 2, click "Edit Prompts"
3. Modal opens with 4 tabs
4. Edit Player 0's prompt: "You are aggressive..."
5. Click "Save & Replay Trick"
6. See side-by-side comparison:
   - Left: Original decision
   - Right: New decision with edited prompt
7. Click "Apply Changes"
8. Continue game with new prompt
9. Click "Save as Template"
10. Name it "My Aggressive Strategy"
11. Share link generated
```

### Flow 3: Rating AI Decisions

```
1. Click "Evaluation Mode" from home
2. See: "Rate AI decisions (models hidden)"
3. Pre-configured game starts
4. Trick plays out automatically
5. 4 rating cards appear (models hidden)
6. For each card:
   - Read reasoning
   - Rate quality (drag stars)
   - Rate clarity (drag stars)
   - Click "Would play" or "Wouldn't play"
7. Click "Submit Ratings"
8. Reveal animation
9. See: "Player 0 was GPT-4 (you rated 4/5)"
10. See aggregate: "Community rates GPT-4: 4.2/5"
11. View leaderboard
12. "Rate Another Trick" button
```

---

## 9. Timeline & Milestones

### Week 1: Core Functionality (Nov 30 - Dec 6)

**Day 1-2: Setup & Game Engine** ✅ COMPLETED
- [x] Create repo
- [x] Next.js/Nuxt setup
- [x] Implement game engine in TypeScript (functional design)
- [x] Unit tests for game logic (165 tests, 98.14% coverage)
- [x] Trump selection system (2-round bidding, order-up, call-trump)
- [x] Going alone support
- [x] Dealer discard logic
- [x] Bower logic (right/left bower)
- [x] Custom error types (InvalidBidError, InvalidPlayError, InvalidGameStateError)
- [x] GitHub Actions CI/CD
- [x] Test coverage badges

**Day 3-4: API Routes & AI Integration**
- [ ] `/api/play-trick` endpoint
- [ ] AI SDK integration (all providers)
- [ ] Prompt template system
- [ ] Test with all 4 models

**Day 5-7: Simulation Mode UI**
- [ ] Game board component
- [ ] Card visuals
- [ ] Streaming reasoning display
- [ ] Manual trick advancement
- [ ] Basic styling

**Milestone:** ~~Can play full game with AI streaming~~ (In Progress)

---

### Week 2: Polish & Evaluation (Dec 7-13)

**Day 8-9: Experimentation Mode**
- [ ] Prompt editor UI
- [ ] Template selector
- [ ] Replay functionality
- [ ] Diff view (side-by-side)

**Day 10: Evaluation Mode**
- [ ] Rating UI components
- [ ] Blind rating flow
- [ ] `/api/rate` endpoint
- [ ] Vercel KV integration

**Day 11: Leaderboard & Stats**
- [ ] Aggregate stats calculation
- [ ] Leaderboard component
- [ ] Model reveal animation
- [ ] A/B comparison mode

**Day 12: Polish**
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Animations/transitions
- [ ] README & documentation

**Day 13: Ship**
- [ ] Demo video (2-3 min)
- [ ] Screenshots for submission
- [ ] Final testing
- [ ] Deploy to production
- [ ] Submit before 11:59 PM PST ✅

---

## 10. Out of Scope (For Hackathon)

**Defer to post-hackathon:**
- ❌ User accounts / authentication
- ❌ Persistent game history per user
- ❌ Acontext integration (memory mode)
- ❌ Tournament brackets
- ❌ Multiplayer (humans playing)
- ❌ Mobile app
- ❌ Accessibility audit (do basic only)
- ❌ Internationalization
- ❌ Prompt evolution/genetic algorithms
- ❌ Advanced statistics (Bayesian ranking, etc.)

**Keep it simple to ship on time!**

---

## 11. Success Criteria

### Minimum Viable Product (Must Have)
- ⏳ 4 AI models can play a full game
- ⏳ Reasoning streams in real-time
- ⏳ Manual trick-by-trick control
- ⏳ Prompt editing works
- ⏳ Blind rating system functional
- ⏳ Deploys to Vercel
- ⏳ No crashes during demo

### Completed Foundation ✅
- ✅ Full Euchre game engine implemented
- ✅ Trump selection with 2-round bidding
- ✅ Going alone support
- ✅ Comprehensive test suite (165 tests)
- ✅ 98.14% test coverage
- ✅ GitHub Actions CI/CD
- ✅ Type-safe with TypeScript
- ✅ Clean functional architecture

### Polish (Should Have)
- ✅ Responsive on desktop + tablet
- ✅ Smooth animations
- ✅ Clear UI/UX
- ✅ Fast loading (<2s)
- ✅ Good error messages

### Wow Factor (Nice to Have)
- ✅ Diff view comparison
- ✅ Community leaderboard
- ✅ Beautiful card animations
- ✅ Prompt templates library
- ✅ Share functionality

---

## 12. Open Questions

1. **Model Selection:**
   - Let users pick any 4 models? Or pre-configured sets?
   - **Decision:** Pre-configured for demo, custom in advanced mode

2. **Rating Anonymity:**
   - Require login or allow anonymous?
   - **Decision:** Anonymous for hackathon (use session ID)

3. **Euchre Rules:**
   - Assume users know rules or teach them?
   - **Decision:** Collapsible rules section + tooltips

4. **Prompt Length:**
   - Limit character count?
   - **Decision:** 500 char limit for now

5. **Cost Display:**
   - Show real-time cost per model?
   - **Decision:** Nice-to-have, skip for MVP

---

## 13. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI calls too slow | High | Medium | Use fast models (Haiku, 3.5-turbo) for demo |
| Timeout errors | High | Low | Each trick < 60s with fast models |
| Rating spam | Medium | Low | Rate limiting + session tracking |
| Complex UI confuses users | Medium | Medium | User testing on Day 11 |
| Scope creep | High | High | Strict feature freeze on Day 10 |

---

## 14. Future Roadmap (Post-Hackathon)

**Phase 2 (Month 1):**
- User accounts
- Save/load games
- Acontext memory mode
- Advanced statistics

**Phase 3 (Month 2-3):**
- Human vs AI mode
- Tournament system
- Prompt marketplace
- Research paper publication

**Phase 4 (Month 4+):**
- Other card games (Bridge, Hearts)
- API for researchers
- Educational curriculum

---

## Appendix A: Model Configuration

```typescript
export const MODELS = {
  fast: [
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      avgLatency: 2,
      cost: 0.002
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      avgLatency: 1.5,
      cost: 0.00025
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'google',
      avgLatency: 2,
      cost: 0.001
    },
  ],

  slow: [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      avgLatency: 15,
      cost: 0.03
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      avgLatency: 10,
      cost: 0.015
    },
  ]
}
```

---

## Appendix B: Prompt Templates

See section 6.3 for full templates.

---

## Sign-Off

**Product Owner:** estern1011
**Target Launch:** December 13, 2025
**Submission Deadline:** December 12, 2025, 11:59 PM PST

**Next Steps:**
1. Review & approve PRD ✅
2. Create Engineering Spec
3. Set up repo & project board
4. Begin implementation (Day 1)

---

**End of PRD**
