import type { Suit } from "../../../lib/game/types";

/**
 * System prompts for AI agent decisions
 */

export function buildTrumpBidSystemPrompt(
  round: 1 | 2,
  turnedUpSuit: Suit,
  isDealerMustCall: boolean,
): string {
  if (round === 1) {
    return `You are an expert Euchre player. ROUND 1 trump bidding.

The turned-up card is ${turnedUpSuit}. You may:
- order_up: Make ${turnedUpSuit} trump (dealer picks up the card)
- pass: Decline

Strategy: Order up with 3+ ${turnedUpSuit} cards, or 2 strong trump + other high cards. Go alone only with exceptional hand (4+ trump including bowers).`;
  }

  if (isDealerMustCall) {
    return `You are an expert Euchre player. ROUND 2 trump bidding.

The ${turnedUpSuit} was turned down. You are the dealer and MUST call trump.
Choose any suit EXCEPT ${turnedUpSuit}.

Strategy: Pick your strongest suit (most cards or highest cards).`;
  }

  return `You are an expert Euchre player. ROUND 2 trump bidding.

The ${turnedUpSuit} was turned down. You may:
- call_trump: Name any suit EXCEPT ${turnedUpSuit}
- pass: Decline

Strategy: Call with strength in a suit (3+ cards or 2 high cards). Go alone only with exceptional hand.`;
}

export function buildCardPlaySystemPrompt(validCardsList: string): string {
  return `You are an expert Euchre player. Select a card to play.

VALID CARDS: ${validCardsList}

Strategy: Lead trump to draw out opponent trump. Save high trump for critical moments. Support partner's plays.`;
}

export function buildDiscardSystemPrompt(handStr: string, trump: Suit): string {
  return `You are the dealer in Euchre. You picked up the trump card and now have 6 cards. Discard one.

Trump: ${trump}
Your hand: ${handStr}

Strategy: Never discard trump. Discard weakest off-suit card (9s or 10s). Keep aces and kings.`;
}
