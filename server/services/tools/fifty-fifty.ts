import type { ToolRequest, ToolResult, FiftyFiftyResult, ToolCallbacks } from "./types";
import type { Card, Suit } from "../../../lib/game/types";
import { getToolCost } from "./types";
import { effectiveSuit, trumpRank, rankValues } from "../../../lib/game/card";

/**
 * 50/50 Tool - Reveal which cards in your hand can win the current trick
 *
 * This is a pure logic tool that analyzes the current trick state and
 * determines which cards have a chance of winning.
 */

/**
 * Get effective suit of a card, handling the case when trump is undefined
 */
function getCardSuit(card: Card, trump: Suit | undefined): Suit {
  if (!trump) return card.suit;
  return effectiveSuit(card, trump);
}

/**
 * Get value of a card for comparison purposes
 * For trump cards, uses trumpRank which handles bowers correctly
 * For non-trump cards, uses standard rank values
 */
function getCardValue(card: Card, trump: Suit | undefined): number {
  if (!trump) return rankValues[card.rank];
  const cardSuit = effectiveSuit(card, trump);
  if (cardSuit === trump) {
    return trumpRank(card, trump);
  }
  return rankValues[card.rank];
}

/**
 * Determine if a card can potentially win the current trick
 */
function canCardWin(
  card: Card,
  currentTrick: Card[],
  leadSuit: Suit | undefined,
  trump: Suit | undefined,
  hand: Card[]
): boolean {
  // If no cards played yet, any card can win (you're leading)
  if (currentTrick.length === 0) {
    return true;
  }

  // Get the effective suit and value of our card
  const cardEffectiveSuit = getCardSuit(card, trump);
  const cardValue = getCardValue(card, trump);

  // Find the current winning card in the trick
  let winningCard = currentTrick[0]!;
  let winningValue = getCardValue(winningCard, trump);
  let winningEffectiveSuit = getCardSuit(winningCard, trump);

  for (let i = 1; i < currentTrick.length; i++) {
    const trickCard = currentTrick[i]!;
    const trickCardEffectiveSuit = getCardSuit(trickCard, trump);
    const trickCardValue = getCardValue(trickCard, trump);

    // Trump beats non-trump
    if (trickCardEffectiveSuit === trump && winningEffectiveSuit !== trump) {
      winningCard = trickCard;
      winningValue = trickCardValue;
      winningEffectiveSuit = trickCardEffectiveSuit;
    }
    // Same suit, higher value wins
    else if (trickCardEffectiveSuit === winningEffectiveSuit && trickCardValue > winningValue) {
      winningCard = trickCard;
      winningValue = trickCardValue;
      winningEffectiveSuit = trickCardEffectiveSuit;
    }
  }

  // Determine the lead suit (effective suit of first card)
  const effectiveLeadSuit = getCardSuit(currentTrick[0]!, trump);

  // Can our card beat the current winner?

  // If our card is trump and winner is not trump, we win
  if (cardEffectiveSuit === trump && winningEffectiveSuit !== trump) {
    return true;
  }

  // If our card is trump and winner is trump, we need higher value
  if (cardEffectiveSuit === trump && winningEffectiveSuit === trump) {
    return cardValue > winningValue;
  }

  // If winner is trump and we're not trump, we can't win
  if (winningEffectiveSuit === trump && cardEffectiveSuit !== trump) {
    return false;
  }

  // Neither is trump - must follow lead suit to have a chance
  if (cardEffectiveSuit === effectiveLeadSuit) {
    return cardValue > winningValue;
  }

  // Off-suit non-trump can't win
  return false;
}

/**
 * Check if player must follow suit
 */
function mustFollowSuit(hand: Card[], leadSuit: Suit, trump: Suit | undefined): Card[] {
  // Find cards that match the lead suit (considering left bower)
  const followCards = hand.filter(card => {
    const cardSuit = getCardSuit(card, trump);
    return cardSuit === leadSuit;
  });

  return followCards.length > 0 ? followCards : hand;
}

export async function executeFiftyFifty(
  request: ToolRequest,
  callbacks?: ToolCallbacks
): Promise<ToolResult> {
  const startTime = Date.now();
  const cost = getToolCost("fifty_fifty");

  callbacks?.onToolProgress?.("Analyzing winning possibilities...");

  const { context } = request;
  const { hand, currentTrick, leadSuit, trump } = context;

  // Determine which cards are legal to play
  let legalCards = hand;
  if (currentTrick && currentTrick.length > 0 && leadSuit) {
    legalCards = mustFollowSuit(hand, leadSuit, trump);
  }

  // Find which legal cards can win
  const winningCards: Card[] = [];
  const losingCards: Card[] = [];

  for (const card of legalCards) {
    if (canCardWin(card, currentTrick || [], leadSuit, trump, hand)) {
      winningCards.push(card);
    } else {
      losingCards.push(card);
    }
  }

  callbacks?.onToolProgress?.(`Found ${winningCards.length} potential winners`);

  const result: FiftyFiftyResult = {
    totalOptions: legalCards.length,
    winningOptions: winningCards.length,
    revealedWinners: winningCards,
    eliminatedLosers: losingCards,
  };

  return {
    tool: "fifty_fifty",
    success: true,
    result,
    cost,
    duration: Date.now() - startTime,
  };
}
