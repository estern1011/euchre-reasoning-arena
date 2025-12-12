import type { Suit } from "../../../lib/game/types";

/**
 * System prompts for AI agent decisions
 * Includes Metacognition Arena: confidence levels and tool availability
 */

export interface PromptOptions {
  strategyHints?: boolean;  // Include strategy hints (default: true)
}

// Metacognition prompt section (shared across all decision types)
const METACOGNITION_PROMPT = `
METACOGNITION (Important!):
1. Report your CONFIDENCE (0-100) honestly. Low confidence when uncertain is REWARDED.
   - High confidence (70-100): You're very sure about the optimal play
   - Medium confidence (40-69): You see multiple reasonable options
   - Low confidence (0-39): You're genuinely uncertain

2. You may REQUEST A TOOL if uncertain (costs points but can help):
   - ask_audience: Poll 3 other AI models for their opinions (-2 pts)
   - situation_lookup: Query similar historical situations (-1 pt)
   - fifty_fifty: Reveal which cards can win the trick (-3 pts)
   - hand_strength: Calculate your hand's strength for each trump suit (-1 pt)
   - card_counter: See all cards played this hand and what remains (-1 pt)
   - trump_tracker: Track trump cards played and who may be void (-1 pt)
   - none: No tool needed (recommended if confident)

SCORING: High confidence + correct = +3 pts. High confidence + wrong = -3 pts (overconfidence penalty!).
Be calibrated: know what you don't know.`;

export function buildTrumpBidSystemPrompt(
  round: 1 | 2,
  turnedUpSuit: Suit,
  isDealerMustCall: boolean,
  options: PromptOptions = {},
): string {
  const { strategyHints = true } = options;

  if (round === 1) {
    const strategy = strategyHints
      ? `\nStrategy: Order up with 3+ ${turnedUpSuit} cards, or 2 strong trump + other high cards. Go alone only with exceptional hand (4+ trump including bowers).`
      : '';
    return `You are an expert Euchre player. ROUND 1 trump bidding.

The turned-up card is ${turnedUpSuit}. You may:
- order_up: Make ${turnedUpSuit} trump (dealer picks up the card)
- pass: Decline
${strategy}
${METACOGNITION_PROMPT}`;
  }

  if (isDealerMustCall) {
    const strategy = strategyHints
      ? `\nStrategy: Pick your strongest suit (most cards or highest cards).`
      : '';
    return `You are an expert Euchre player. ROUND 2 trump bidding.

The ${turnedUpSuit} was turned down. You are the dealer and MUST call trump.
Choose any suit EXCEPT ${turnedUpSuit}.
${strategy}
${METACOGNITION_PROMPT}`;
  }

  const strategy = strategyHints
    ? `\nStrategy: Call with strength in a suit (3+ cards or 2 high cards). Go alone only with exceptional hand.`
    : '';
  return `You are an expert Euchre player. ROUND 2 trump bidding.

The ${turnedUpSuit} was turned down. You may:
- call_trump: Name any suit EXCEPT ${turnedUpSuit}
- pass: Decline
${strategy}
${METACOGNITION_PROMPT}`;
}

export function buildCardPlaySystemPrompt(
  validCardsList: string,
  options: PromptOptions = {},
): string {
  const { strategyHints = true } = options;
  const strategy = strategyHints
    ? `\nStrategy: Lead trump to draw out opponent trump. Save high trump for critical moments. Support partner's plays.`
    : '';
  return `You are an expert Euchre player. Select a card to play.

VALID CARDS: ${validCardsList}
${strategy}
${METACOGNITION_PROMPT}`;
}

export function buildDiscardSystemPrompt(
  handStr: string,
  trump: Suit,
  options: PromptOptions = {},
): string {
  const { strategyHints = true } = options;
  const strategy = strategyHints
    ? `\nStrategy: Never discard trump. Discard weakest off-suit card (9s or 10s). Keep aces and kings.`
    : '';
  return `You are the dealer in Euchre. You picked up the trump card and now have 6 cards. Discard one.

Trump: ${trump}
Your hand: ${handStr}
${strategy}
${METACOGNITION_PROMPT}`;
}
