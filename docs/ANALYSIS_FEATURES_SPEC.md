# Analysis Features Specification

## Overview

This document specifies two new analysis features for the Metacognition Arena:
1. **Hand Strength Rankings** - Deterministic scoring of each player's hand
2. **Evolving Game Insights** - LLM-powered progressive analysis that builds over the game

---

## Feature 1: Hand Strength Rankings

### Purpose
Show each player's hand strength at the start of each hand, providing context for their decisions. Helps viewers understand why an agent might pass or call trump.

### Card Point Values

Points are calculated relative to the trump suit. Higher = stronger.

```
TRUMP CARDS:
  Right Bower (Jack of trump suit)      = 12 pts
  Left Bower (Jack of same color)       = 11 pts
  Ace of trump                          = 10 pts
  King of trump                         = 9 pts
  Queen of trump                        = 8 pts
  10 of trump                           = 7 pts
  9 of trump                            = 6 pts

OFF-SUIT CARDS:
  Ace                                   = 5 pts
  King                                  = 4 pts
  Queen                                 = 3 pts
  Jack                                  = 2 pts
  10                                    = 1 pt
  9                                     = 0 pts
```

### Calculation

```typescript
function calculateHandStrength(hand: Card[], trumpSuit: Suit): number {
  let score = 0;
  const leftBowerSuit = getLeftBowerSuit(trumpSuit); // same color suit

  for (const card of hand) {
    if (card.suit === trumpSuit) {
      // Trump cards
      if (card.rank === 'J') score += 12;      // Right bower
      else if (card.rank === 'A') score += 10;
      else if (card.rank === 'K') score += 9;
      else if (card.rank === 'Q') score += 8;
      else if (card.rank === '10') score += 7;
      else if (card.rank === '9') score += 6;
    } else if (card.suit === leftBowerSuit && card.rank === 'J') {
      // Left bower
      score += 11;
    } else {
      // Off-suit cards
      if (card.rank === 'A') score += 5;
      else if (card.rank === 'K') score += 4;
      else if (card.rank === 'Q') score += 3;
      else if (card.rank === 'J') score += 2;
      else if (card.rank === '10') score += 1;
      // 9 = 0 pts
    }
  }

  return score;
}
```

### Score Interpretation

- **Maximum possible**: 12 + 11 + 10 + 9 + 8 = 50 pts (all top trump)
- **Strong hand**: 25+ pts
- **Medium hand**: 15-24 pts
- **Weak hand**: <15 pts

### UI Display

#### Round 1 (Turned-up card determines potential trump)
Show a simple ranking:
```
// hand_strength (if ♥ trump)
┌────────────────────────────────┐
│ WEST   ████████████░░░  32 pts │
│ SOUTH  ██████████░░░░░  24 pts │
│ NORTH  ████████░░░░░░░  18 pts │
│ EAST   █████░░░░░░░░░░  12 pts │
└────────────────────────────────┘
```

#### Round 2 (Any suit can be called)
Show a matrix - suits on X axis, players on Y axis:
```
// hand_strength_matrix
┌──────────────────────────────────────┐
│         ♥      ♦      ♣      ♠      │
│ NORTH   18     24     15     20     │
│ EAST    12     28     22     14     │
│ SOUTH   24     16     30     18     │
│ WEST    32     20     18     26     │
└──────────────────────────────────────┘
```

### Implementation Location
- Calculation: `lib/scoring/hand-strength.ts`
- Component: `app/components/HandStrengthPanel.vue`
- Store: Add to `game.ts` - calculate when hands are dealt

---

## Feature 2: Evolving Game Insights

### Purpose
Provide progressive, LLM-generated analysis that:
- Summarizes what happened in each hand
- Identifies agent behavior patterns (trend analysis)
- Compares decision-making styles across models
- Builds a narrative that evolves as the game progresses

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GAME FLOW                                │
│                                                                  │
│  Hand 1 Completes                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/analyze-hand                                   │   │
│  │                                                           │   │
│  │  Input:                                                   │   │
│  │    - handData: {                                          │   │
│  │        trumpDecisions: TrumpDecision[]                    │   │
│  │        tricks: Trick[]                                    │   │
│  │        outcome: { winner, points, wasEuchred }            │   │
│  │        reasoningTexts: { [position]: string }             │   │
│  │      }                                                    │   │
│  │    - previousInsights: null (first hand)                  │   │
│  │                                                           │   │
│  │  Output:                                                  │   │
│  │    - handSummary: string                                  │   │
│  │    - insights: EvolvedInsights                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         ▼                                                        │
│  Store insights in gameStore.evolvedInsights                     │
│  Display in UI                                                   │
│                                                                  │
│  Hand 2 Completes                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/analyze-hand                                   │   │
│  │                                                           │   │
│  │  Input:                                                   │   │
│  │    - handData: { ... hand 2 data ... }                    │   │
│  │    - previousInsights: insights from hand 1   ◄── KEY    │   │
│  │                                                           │   │
│  │  Output:                                                  │   │
│  │    - handSummary: string                                  │   │
│  │    - insights: UPDATED EvolvedInsights        ◄── EVOLVES│   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         ▼                                                        │
│  ... continues, insights compound and refine ...                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Structures

```typescript
// Input to analysis endpoint
interface HandAnalysisInput {
  handNumber: number;

  // Trump phase data
  trumpDecisions: {
    player: Position;
    action: 'call' | 'pass' | 'call_suit';
    confidence?: number;
    reasoning?: string;
    suit?: Suit;
  }[];

  // Trick data
  tricks: {
    plays: { player: Position; card: Card; confidence?: number; reasoning?: string }[];
    winner: Position;
  }[];

  // Outcome
  outcome: {
    callingTeam: 'NS' | 'EW';
    winningTeam: 'NS' | 'EW';
    points: number;
    wasEuchred: boolean;
    wasMarch: boolean;
    wasLoner: boolean;
  };

  // Model info
  modelIds: { [position: Position]: string };

  // Previous insights (null for first hand)
  previousInsights: EvolvedInsights | null;
}

// Output from analysis endpoint
interface HandAnalysisOutput {
  // Summary of this specific hand
  handSummary: string;  // "North called hearts with a weak hand and got euchred..."

  // Evolved insights (cumulative)
  insights: EvolvedInsights;
}

// The evolving insights structure
interface EvolvedInsights {
  // Per-agent behavioral patterns (trend analysis)
  agentPatterns: {
    north: string;  // "Conservative - passes with <3 trump cards, high confidence correlates with success"
    east: string;   // "Aggressive caller - tends to overestimate hand strength"
    south: string;  // "Strategic - considers partner position before calling"
    west: string;   // "Risk-averse - rarely goes alone even with strong hands"
  };

  // Cross-model decision style comparison
  decisionStyleComparison: string;
  // e.g., "Claude (North/South) shows better calibration than GPT (East/West).
  //        Claude's confidence levels closely match outcomes, while GPT tends
  //        toward overconfidence on marginal hands."

  // Memorable moments from the game
  keyMoments: string[];
  // e.g., ["Hand 2: South's risky loner attempt resulted in a march (+4 pts)",
  //        "Hand 4: West correctly passed despite holding the right bower"]

  // Running game narrative
  gameNarrative: string;
  // e.g., "NS jumped to an early lead through conservative play, but EW is
  //        adapting with more aggressive trump calls. The momentum is shifting."

  // Statistical observations
  statistics: {
    callSuccessRate: { NS: number; EW: number };  // % of called hands won
    avgConfidenceWhenCorrect: { [position: Position]: number };
    avgConfidenceWhenWrong: { [position: Position]: number };
  };
}
```

### LLM Prompt Structure

```typescript
const systemPrompt = `You are an expert Euchre analyst providing commentary on an AI vs AI game.
Your role is to:
1. Summarize what happened in this hand
2. Identify behavioral patterns for each agent
3. Compare decision-making styles across different AI models
4. Build a narrative that evolves as the game progresses

Be concise but insightful. Focus on:
- Calibration: Does confidence match outcomes?
- Strategy: Are decisions well-reasoned?
- Patterns: What tendencies emerge over time?
- Comparisons: How do different AI models approach the same situations?

Output JSON matching the specified schema.`;

const userPrompt = `
## Hand ${handNumber} Analysis

### Trump Decisions
${formatTrumpDecisions(trumpDecisions)}

### Tricks Played
${formatTricks(tricks)}

### Outcome
- Calling team: ${outcome.callingTeam}
- Winner: ${outcome.winningTeam}
- Points: ${outcome.points}
- Euchred: ${outcome.wasEuchred}

### Agent Reasoning Excerpts
North (${modelIds.north}): "${reasoningTexts.north}"
East (${modelIds.east}): "${reasoningTexts.east}"
South (${modelIds.south}): "${reasoningTexts.south}"
West (${modelIds.west}): "${reasoningTexts.west}"

${previousInsights ? `
### Previous Insights (from hands 1-${handNumber - 1})
${JSON.stringify(previousInsights, null, 2)}

Update these insights based on the new hand. Patterns should become more refined,
not completely rewritten. Build on what you observed before.
` : ''}

Provide your analysis as JSON matching the HandAnalysisOutput schema.
`;
```

### UI Display

Replace "recent_decisions" panel with "game_insights" panel:

```
┌─────────────────────────────────────────────────────────────┐
│ // game_insights                                    [Hand 3] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ latest_hand ──────────────────────────────────────────┐  │
│ │ South called diamonds with 65% confidence and secured  │  │
│ │ 3 tricks for 1 point. North's support was crucial.     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ agent_patterns ───────────────────────────────────────┐  │
│ │ NORTH (claude-haiku-4.5)                               │  │
│ │   Conservative player - passes 80% with weak hands     │  │
│ │                                                         │  │
│ │ EAST (gemini-2.5-flash)                                │  │
│ │   Aggressive - calls trump on marginal hands           │  │
│ │                                                         │  │
│ │ SOUTH (gpt-5-mini)                                     │  │
│ │   Well-calibrated - confidence matches outcomes        │  │
│ │                                                         │  │
│ │ WEST (grok-4.1-fast)                                   │  │
│ │   Risk-averse - rarely attempts loners                 │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ game_narrative ───────────────────────────────────────┐  │
│ │ NS leads 4-2 through solid fundamentals. Claude's      │  │
│ │ conservative passing is paying off while Gemini's      │  │
│ │ aggression has led to two euchres.                     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─ key_moments ──────────────────────────────────────────┐  │
│ │ • Hand 1: West's risky call got euchred (-2 EW)        │  │
│ │ • Hand 2: South's 85% confidence call → march (+2 NS)  │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Files

```
NEW FILES:
├── lib/scoring/hand-strength.ts        # Hand strength calculation
├── server/api/analyze-hand.post.ts     # Analysis endpoint
├── server/services/analysis/           # Analysis service
│   ├── types.ts                        # Type definitions
│   ├── prompts.ts                      # LLM prompts
│   └── index.ts                        # Main analysis logic
├── app/components/HandStrengthPanel.vue
├── app/components/GameInsightsPanel.vue

MODIFIED FILES:
├── app/stores/game.ts                  # Add evolvedInsights state
├── app/pages/game.vue                  # Replace recent_decisions with new panels
├── server/api/stream-next-round.post.ts # Trigger analysis after hand completion
```

### Integration Points

1. **After hand completion** in `stream-next-round.post.ts`:
   - Detect when a hand ends (5 tricks completed)
   - Collect all reasoning from the hand
   - Call `/api/analyze-hand` endpoint
   - Stream the analysis result to frontend
   - Store in `gameStore.evolvedInsights`

2. **Frontend display**:
   - `HandStrengthPanel` shows at start of each hand (during trump selection)
   - `GameInsightsPanel` updates after each hand completes
   - Both replace the current "recent_decisions" panel space

### Performance Considerations

- Analysis LLM call happens **after** hand completes, not during gameplay
- Use a fast model (claude-3-haiku or gpt-4o-mini) for analysis
- Cache previous insights in game store to avoid re-fetching
- Analysis is non-blocking - game can continue while analysis streams

---

## Implementation Priority

1. **Phase 1**: Hand Strength Calculation + Panel (deterministic, no LLM)
2. **Phase 2**: Analysis endpoint + GameInsightsPanel (LLM integration)
3. **Phase 3**: Polish UI, refine prompts, test with real games

---

## Open Questions

1. Should we show hand strength during Round 2 matrix automatically, or only when someone clicks to expand?
2. How do we handle analysis if game ends mid-hand (player disconnects)?
3. Should we store analysis in the database for post-game review?
4. Rate limiting on analysis endpoint to avoid excessive LLM calls?
