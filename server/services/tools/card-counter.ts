import type { ToolRequest, ToolResult, CardCounterResult, CardsBySuit, ToolCallbacks } from "./types";
import type { Card, Suit, Rank } from "../../../lib/game/types";
import { getToolCost } from "./types";
import { cardToString } from "../../../lib/game/card";

/**
 * Card Counter Tool - Track all cards played and remaining
 *
 * Helps agents track what cards have been played during the hand.
 * Tests whether agents can maintain mental card counts or need assistance.
 */

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["9", "10", "jack", "queen", "king", "ace"];

/**
 * Generate a full deck for Euchre (24 cards: 9-A in each suit)
 */
function generateFullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Check if two cards are the same
 */
function cardsEqual(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/**
 * Get all cards played so far in the hand
 */
function getPlayedCards(request: ToolRequest): Card[] {
  const { gameState } = request.context;
  const played: Card[] = [];

  // Cards from completed tricks
  for (const trick of gameState.completedTricks) {
    for (const play of trick.plays) {
      played.push(play.card);
    }
  }

  // Cards from current trick (if any)
  if (gameState.currentTrick) {
    for (const play of gameState.currentTrick.plays) {
      played.push(play.card);
    }
  }

  return played;
}

/**
 * Calculate remaining cards (not played, not in agent's hand)
 */
function getRemainingCards(
  fullDeck: Card[],
  playedCards: Card[],
  agentHand: Card[]
): Card[] {
  return fullDeck.filter((card) => {
    const wasPlayed = playedCards.some((p) => cardsEqual(p, card));
    const inHand = agentHand.some((h) => cardsEqual(h, card));
    return !wasPlayed && !inHand;
  });
}

/**
 * Organize cards by suit
 */
function organizeCardsBySuit(
  playedCards: Card[],
  remainingCards: Card[]
): CardsBySuit[] {
  return SUITS.map((suit) => {
    const played = playedCards.filter((c) => c.suit === suit);
    const remaining = remainingCards.filter((c) => c.suit === suit);
    return {
      suit,
      played,
      remaining,
      count: {
        played: played.length,
        remaining: remaining.length,
      },
    };
  });
}

/**
 * Generate a human-readable summary
 */
function generateSummary(bySuit: CardsBySuit[], trump?: Suit | null): string {
  const parts: string[] = [];

  for (const { suit, count } of bySuit) {
    const isTrump = suit === trump ? " (trump)" : "";
    if (count.remaining === 0) {
      parts.push(`${suit}${isTrump}: all played`);
    } else if (count.played === 0) {
      parts.push(`${suit}${isTrump}: none played yet`);
    } else {
      parts.push(`${suit}${isTrump}: ${count.played} played, ${count.remaining} out`);
    }
  }

  return parts.join("; ");
}

export async function executeCardCounter(
  request: ToolRequest,
  callbacks?: ToolCallbacks
): Promise<ToolResult> {
  const startTime = Date.now();
  const cost = getToolCost("card_counter");

  callbacks?.onToolProgress?.("Counting cards played...");

  const { context } = request;
  const { hand, gameState } = context;

  const fullDeck = generateFullDeck();
  const playedCards = getPlayedCards(request);
  const remainingCards = getRemainingCards(fullDeck, playedCards, hand);

  const bySuit = organizeCardsBySuit(playedCards, remainingCards);
  const summary = generateSummary(bySuit, gameState.trump);

  callbacks?.onToolProgress?.(`${playedCards.length} cards played, ${remainingCards.length} remaining in play`);

  const result: CardCounterResult = {
    bySuit,
    totalPlayed: playedCards.length,
    totalRemaining: remainingCards.length,
    summary,
  };

  return {
    tool: "card_counter",
    success: true,
    result,
    cost,
    duration: Date.now() - startTime,
  };
}
