import type { ToolRequest, ToolResult, TrumpTrackerResult, ToolCallbacks } from "./types";
import type { Card, Suit, Rank, Position } from "../../../lib/game/types";
import { getToolCost } from "./types";
import { cardToString } from "../../../lib/game/card";

/**
 * Trump Tracker Tool - Track trump cards played and void detection
 *
 * Specialized tool for tracking the trump suit during play.
 * Includes left bower detection and void analysis.
 * Tests whether agents can track trump mentally or need assistance.
 */

const TRUMP_RANKS: Rank[] = ["9", "10", "jack", "queen", "king", "ace"];

/**
 * Get the same-color suit for left bower
 */
function getLeftBowerSuit(trumpSuit: Suit): Suit {
  const sameColor: Record<Suit, Suit> = {
    hearts: "diamonds",
    diamonds: "hearts",
    clubs: "spades",
    spades: "clubs",
  };
  return sameColor[trumpSuit];
}

/**
 * Check if a card is trump (including left bower)
 */
function isTrump(card: Card, trumpSuit: Suit): boolean {
  if (card.suit === trumpSuit) return true;
  // Left bower check
  if (card.rank === "jack" && card.suit === getLeftBowerSuit(trumpSuit)) {
    return true;
  }
  return false;
}

/**
 * Check if a card is the right bower
 */
function isRightBower(card: Card, trumpSuit: Suit): boolean {
  return card.suit === trumpSuit && card.rank === "jack";
}

/**
 * Check if a card is the left bower
 */
function isLeftBower(card: Card, trumpSuit: Suit): boolean {
  return card.suit === getLeftBowerSuit(trumpSuit) && card.rank === "jack";
}

/**
 * Generate all trump cards for a given suit (7 cards: 6 in trump + left bower)
 */
function getAllTrumpCards(trumpSuit: Suit): Card[] {
  const trumpCards: Card[] = [];

  // All cards of trump suit
  for (const rank of TRUMP_RANKS) {
    trumpCards.push({ suit: trumpSuit, rank });
  }

  // Left bower (jack of same color)
  const leftBowerSuit = getLeftBowerSuit(trumpSuit);
  trumpCards.push({ suit: leftBowerSuit, rank: "jack" });

  return trumpCards;
}

/**
 * Check if two cards are the same
 */
function cardsEqual(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/**
 * Analyze played tricks for void detection
 * A player is likely void if they didn't follow suit when trump was led
 */
function detectVoidPlayers(request: ToolRequest, trumpSuit: Suit): Position[] {
  const { gameState } = request.context;
  const voidPlayers = new Set<Position>();

  for (const trick of gameState.completedTricks) {
    if (trick.plays.length === 0) continue;

    const leadCard = trick.plays[0]?.card;
    if (!leadCard) continue;

    // Was trump led? (considering effective suit for left bower)
    const trumpLed = isTrump(leadCard, trumpSuit);
    if (!trumpLed) continue;

    // Check each subsequent play
    for (let i = 1; i < trick.plays.length; i++) {
      const play = trick.plays[i];
      if (!play) continue;

      const playedCard = play.card;
      const playedTrump = isTrump(playedCard, trumpSuit);

      // If trump was led and they didn't play trump, they're void
      if (!playedTrump) {
        voidPlayers.add(play.player);
      }
    }
  }

  return Array.from(voidPlayers);
}

/**
 * Get all trump cards that have been played
 */
function getPlayedTrump(request: ToolRequest, trumpSuit: Suit): Card[] {
  const { gameState } = request.context;
  const played: Card[] = [];

  for (const trick of gameState.completedTricks) {
    for (const play of trick.plays) {
      if (isTrump(play.card, trumpSuit)) {
        played.push(play.card);
      }
    }
  }

  // Current trick
  if (gameState.currentTrick) {
    for (const play of gameState.currentTrick.plays) {
      if (isTrump(play.card, trumpSuit)) {
        played.push(play.card);
      }
    }
  }

  return played;
}

/**
 * Sort trump cards by power (right bower > left bower > A > K > Q > 10 > 9)
 */
function sortTrumpByPower(cards: Card[], trumpSuit: Suit): Card[] {
  const powerOrder: Record<string, number> = {
    right_bower: 7,
    left_bower: 6,
    ace: 5,
    king: 4,
    queen: 3,
    "10": 2,
    "9": 1,
  };

  return [...cards].sort((a, b) => {
    const aPower = isRightBower(a, trumpSuit)
      ? powerOrder.right_bower
      : isLeftBower(a, trumpSuit)
        ? powerOrder.left_bower
        : powerOrder[a.rank] ?? 0;
    const bPower = isRightBower(b, trumpSuit)
      ? powerOrder.right_bower
      : isLeftBower(b, trumpSuit)
        ? powerOrder.left_bower
        : powerOrder[b.rank] ?? 0;
    return bPower - aPower;
  });
}

/**
 * Generate summary text
 */
function generateSummary(
  trumpSuit: Suit,
  played: Card[],
  remaining: Card[],
  rightBowerPlayed: boolean,
  leftBowerPlayed: boolean,
  voidPlayers: Position[]
): string {
  const parts: string[] = [];

  parts.push(`Trump: ${trumpSuit}`);
  parts.push(`${played.length}/7 trump played`);

  if (rightBowerPlayed && leftBowerPlayed) {
    parts.push("Both bowers out");
  } else if (rightBowerPlayed) {
    parts.push("Right bower played, left bower still out");
  } else if (leftBowerPlayed) {
    parts.push("Left bower played, right bower still out");
  } else {
    parts.push("Both bowers still out");
  }

  if (voidPlayers.length > 0) {
    parts.push(`Likely void: ${voidPlayers.join(", ")}`);
  }

  return parts.join(". ");
}

export async function executeTrumpTracker(
  request: ToolRequest,
  callbacks?: ToolCallbacks
): Promise<ToolResult> {
  const startTime = Date.now();
  const cost = getToolCost("trump_tracker");

  const { gameState } = request.context;
  const trumpSuit = gameState.trump;

  if (!trumpSuit) {
    // No trump called yet - return error result
    return {
      tool: "trump_tracker",
      success: false,
      result: {
        trumpSuit: "hearts", // placeholder
        trumpPlayed: [],
        trumpRemaining: [],
        leftBowerPlayed: false,
        rightBowerPlayed: false,
        playersLikelyVoid: [],
        summary: "Trump has not been called yet.",
      },
      cost,
      duration: Date.now() - startTime,
    };
  }

  callbacks?.onToolProgress?.(`Tracking ${trumpSuit} trump cards...`);

  const allTrump = getAllTrumpCards(trumpSuit);
  const playedTrump = getPlayedTrump(request, trumpSuit);
  const remainingTrump = allTrump.filter(
    (card) => !playedTrump.some((p) => cardsEqual(p, card))
  );

  const rightBowerPlayed = playedTrump.some((c) => isRightBower(c, trumpSuit));
  const leftBowerPlayed = playedTrump.some((c) => isLeftBower(c, trumpSuit));
  const voidPlayers = detectVoidPlayers(request, trumpSuit);

  // Sort by power
  const sortedPlayed = sortTrumpByPower(playedTrump, trumpSuit);
  const sortedRemaining = sortTrumpByPower(remainingTrump, trumpSuit);

  callbacks?.onToolProgress?.(
    `${playedTrump.length} trump played, ${remainingTrump.length} remaining`
  );

  const summary = generateSummary(
    trumpSuit,
    sortedPlayed,
    sortedRemaining,
    rightBowerPlayed,
    leftBowerPlayed,
    voidPlayers
  );

  const result: TrumpTrackerResult = {
    trumpSuit,
    trumpPlayed: sortedPlayed,
    trumpRemaining: sortedRemaining,
    leftBowerPlayed,
    rightBowerPlayed,
    playersLikelyVoid: voidPlayers,
    summary,
  };

  return {
    tool: "trump_tracker",
    success: true,
    result,
    cost,
    duration: Date.now() - startTime,
  };
}
