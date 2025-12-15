import type { Suit, Position } from "../../../lib/game/types";

/**
 * System prompts for AI agent decisions
 * Includes Metacognition Arena: confidence levels and tool availability
 */

// Prompt preset levels for strategy guidance
export type PromptPreset = 'none' | 'conservative' | 'neutral' | 'aggressive';

// Display labels for prompt presets (used in UI)
export const PROMPT_PRESET_LABELS: Record<PromptPreset, string> = {
  none: 'none',
  conservative: 'safe',
  neutral: 'neutral',
  aggressive: 'yolo',
};

// Descriptions for prompt presets (used in tooltips)
export const PROMPT_PRESET_DESCRIPTIONS: Record<PromptPreset, string> = {
  none: 'No strategic guidance',
  conservative: 'Safe mode - Conservative play style',
  neutral: 'Neutral mode - Balanced guidance',
  aggressive: 'YOLO mode - Aggressive risk-taking',
};

// Short hints for prompt presets (used in compact UI elements)
export const PROMPT_PRESET_HINTS: Record<PromptPreset, string> = {
  none: 'No guidance',
  conservative: 'Play it safe',
  neutral: 'Standard tips',
  aggressive: 'Take risks',
};

export interface PromptOptions {
  promptPresets?: Partial<Record<Position, PromptPreset>>;  // Per-agent strategy guidance
  agentReflections?: Partial<Record<Position, string[]>>;  // Per-agent reflections from previous hands
}

// Strategy content by preset level
const TRUMP_BID_ROUND1_STRATEGY: Record<PromptPreset, (suit: Suit) => string> = {
  none: () => '',
  conservative: (suit) => `
Strategy: Only order up with STRONG hands - 4+ ${suit} cards, or 3 trump with Right/Left bower. Pass on marginal hands. Go alone only with 5 trump including both bowers.`,
  neutral: (suit) => `
Strategy: Order up with 3+ ${suit} cards, or 2 strong trump + other high cards. Go alone only with exceptional hand (4+ trump including bowers).`,
  aggressive: (suit) => `
Strategy: Order up with 2+ ${suit} cards if you have any bower, or 3+ cards of any strength. Trust your partner to help. Consider going alone with 3+ strong trump.`,
};

const TRUMP_BID_ROUND2_STRATEGY: Record<PromptPreset, string> = {
  none: '',
  conservative: `
Strategy: Only call trump with a dominant suit - 3+ cards with high values, or 2 cards including a bower. When in doubt, pass to partner.`,
  neutral: `
Strategy: Call with strength in a suit (3+ cards or 2 high cards). Go alone only with exceptional hand.`,
  aggressive: `
Strategy: Call your longest suit even with moderate strength. 2+ cards with an ace or bower is enough. Partners will support you.`,
};

const TRUMP_BID_DEALER_MUST_CALL_STRATEGY: Record<PromptPreset, string> = {
  none: '',
  conservative: `
Strategy: Pick your strongest suit (most cards or highest cards). Prefer suits with bowers.`,
  neutral: `
Strategy: Pick your strongest suit (most cards or highest cards).`,
  aggressive: `
Strategy: Pick any suit where you have 2+ cards. Length matters more than strength when you must call.`,
};

const CARD_PLAY_STRATEGY: Record<PromptPreset, string> = {
  none: '',
  conservative: `
Strategy:
- Lead your highest card to establish control
- Save trump for emergencies - don't waste them early
- Follow partner's lead and support their plays
- When defending, focus on stopping 3 tricks rather than winning all`,
  neutral: `
Strategy (adapt based on your role):
- MAKERS: Lead trump to draw out opponent trump. Play aggressively to win 3+ tricks.
- DEFENDERS: Try to euchre makers (stop them from winning 3 tricks). Save trump to trump their winners.
- Going alone: Even higher stakes - play to maximize/minimize tricks.
- Support partner's plays. Save high trump for critical moments.`,
  aggressive: `
Strategy:
- Lead trump immediately to establish control and draw out opponent trump
- Take tricks when you can - don't wait for "perfect" opportunities
- Force opponents to use their trump early
- When making, push for all 5 tricks when possible`,
};

const DISCARD_STRATEGY: Record<PromptPreset, string> = {
  none: '',
  conservative: `
Strategy: Never discard trump. Discard the absolute weakest card (9s, then 10s). Keep all aces and kings. Prefer keeping suited cards for potential runs.`,
  neutral: `
Strategy: Never discard trump. Discard weakest off-suit card (9s or 10s). Keep aces and kings.`,
  aggressive: `
Strategy: Never discard trump. Discard low off-suit cards quickly. Keep aces, but kings are expendable if you have trump control.`,
};

/**
 * Format reflections for injection into prompt (used by position-specific prompts)
 */
function formatReflections(reflections: string[] | undefined): string {
  if (!reflections || reflections.length === 0) return '';

  const recent = reflections.slice(-3);  // Last 3 reflections
  const formattedReflections = recent.map(r => `- ${r}`).join('\n');

  return `
WHAT YOU LEARNED FROM PREVIOUS HANDS:
${formattedReflections}
Apply these lessons to this decision.`;
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
   - ask_partner: Ask your partner for advice (they can't see your hand) (-2 pts)
   - fifty_fifty: Reveal which cards can win the trick (-3 pts)
   - none: No tool needed (recommended if confident)

SCORING: High confidence + correct = +3 pts. High confidence + wrong = -3 pts (overconfidence penalty!).
Be calibrated: know what you don't know.`;

export function buildTrumpBidSystemPrompt(
  round: 1 | 2,
  turnedUpSuit: Suit,
  isDealerMustCall: boolean,
  options: PromptOptions = {},
  player?: Position,
): string {
  const { promptPresets, agentReflections } = options;
  const promptPreset = (player && promptPresets?.[player]) || 'neutral';
  const reflections = player && agentReflections ? formatReflections(agentReflections[player]) : '';

  if (round === 1) {
    const strategy = TRUMP_BID_ROUND1_STRATEGY[promptPreset](turnedUpSuit);
    return `You are an expert Euchre player. ROUND 1 trump bidding.

The turned-up card is ${turnedUpSuit}. You may:
- order_up: Make ${turnedUpSuit} trump (dealer picks up the card)
- pass: Decline
${strategy}${reflections}
${METACOGNITION_PROMPT}`;
  }

  if (isDealerMustCall) {
    const strategy = TRUMP_BID_DEALER_MUST_CALL_STRATEGY[promptPreset];
    return `You are an expert Euchre player. ROUND 2 trump bidding.

The ${turnedUpSuit} was turned down. You are the dealer and MUST call trump.
Choose any suit EXCEPT ${turnedUpSuit}.
${strategy}${reflections}
${METACOGNITION_PROMPT}`;
  }

  const strategy = TRUMP_BID_ROUND2_STRATEGY[promptPreset];
  return `You are an expert Euchre player. ROUND 2 trump bidding.

The ${turnedUpSuit} was turned down. You may:
- call_trump: Name any suit EXCEPT ${turnedUpSuit}
- pass: Decline
${strategy}${reflections}
${METACOGNITION_PROMPT}`;
}

export function buildCardPlaySystemPrompt(
  validCardsList: string,
  options: PromptOptions = {},
  player?: Position,
): string {
  const { promptPresets, agentReflections } = options;
  const promptPreset = (player && promptPresets?.[player]) || 'neutral';
  const reflections = player && agentReflections ? formatReflections(agentReflections[player]) : '';
  const strategy = CARD_PLAY_STRATEGY[promptPreset];
  return `You are an expert Euchre player. Select a card to play.

VALID CARDS: ${validCardsList}
${strategy}${reflections}
${METACOGNITION_PROMPT}`;
}

export function buildDiscardSystemPrompt(
  handStr: string,
  trump: Suit,
  options: PromptOptions = {},
  player?: Position,
): string {
  const { promptPresets, agentReflections } = options;
  const promptPreset = (player && promptPresets?.[player]) || 'neutral';
  const reflections = player && agentReflections ? formatReflections(agentReflections[player]) : '';
  const strategy = DISCARD_STRATEGY[promptPreset];
  return `You are the dealer in Euchre. You picked up the trump card and now have 6 cards. Discard one.

Trump: ${trump}
Your hand: ${handStr}
${strategy}${reflections}
${METACOGNITION_PROMPT}`;
}
