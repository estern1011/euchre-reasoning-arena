import type { ToolRequest, ToolResult, HandStrengthResult, HandStrengthBySuit, ToolCallbacks } from "./types";
import type { Suit } from "../../../lib/game/types";
import { getToolCost } from "./types";
import {
  calculateHandStrength,
  calculateHandStrengthAllSuits,
  getBestTrumpSuit,
  getHandStrengthCategory,
  getHandStrengthPercent,
} from "../../../lib/scoring/hand-strength";

/**
 * Hand Strength Tool - Calculate hand strength for each potential trump suit
 *
 * Helps agents evaluate their hand's potential when deciding whether to
 * call trump or how to play. Tests whether agents can self-evaluate their
 * hands or need assistance.
 */

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

function buildStrengthBySuit(suit: Suit, strength: number): HandStrengthBySuit {
  return {
    suit,
    strength,
    category: getHandStrengthCategory(strength),
    percent: getHandStrengthPercent(strength),
  };
}

function generateRecommendation(
  bestSuit: Suit,
  bestStrength: number,
  currentTrump?: Suit,
  biddingRound?: 1 | 2
): string {
  const category = getHandStrengthCategory(bestStrength);

  if (biddingRound === 1 && currentTrump) {
    const trumpStrength = bestSuit === currentTrump ? bestStrength : 0;
    if (trumpStrength >= 25) {
      return `Strong hand for ${currentTrump} trump (${trumpStrength} pts). Consider ordering up.`;
    } else if (trumpStrength >= 15) {
      return `Medium hand for ${currentTrump} trump (${trumpStrength} pts). Order up if partner is dealer or you have good support.`;
    } else {
      return `Weak hand for ${currentTrump} trump (${trumpStrength} pts). Passing is recommended.`;
    }
  }

  if (biddingRound === 2) {
    if (category === "strong") {
      return `Strong hand for ${bestSuit} (${bestStrength} pts). Calling ${bestSuit} is recommended.`;
    } else if (category === "medium") {
      return `Medium strength for ${bestSuit} (${bestStrength} pts). Consider calling if forced or partner has shown strength.`;
    } else {
      return `Weak hand across all suits. Best option is ${bestSuit} (${bestStrength} pts). Pass if possible.`;
    }
  }

  // During play
  if (currentTrump) {
    const trumpStrength = calculateHandStrength([], currentTrump); // Will be recalculated below
    return `Hand strength for current trump (${currentTrump}): ${category}. Best potential suit: ${bestSuit}.`;
  }

  return `Best potential trump: ${bestSuit} (${bestStrength} pts, ${category}).`;
}

export async function executeHandStrength(
  request: ToolRequest,
  callbacks?: ToolCallbacks
): Promise<ToolResult> {
  const startTime = Date.now();
  const cost = getToolCost("hand_strength");

  callbacks?.onToolProgress?.("Analyzing hand strength...");

  const { context } = request;
  const { hand, trump, biddingRound, turnedUpCard } = context;

  // Calculate strength for all suits
  const allSuitsStrength = calculateHandStrengthAllSuits(hand);
  const { suit: bestSuit, strength: bestStrength } = getBestTrumpSuit(hand);

  // Build detailed breakdown by suit
  const allSuits: HandStrengthBySuit[] = SUITS.map((suit) =>
    buildStrengthBySuit(suit, allSuitsStrength[suit])
  ).sort((a, b) => b.strength - a.strength);

  // If there's a current trump (during play or round 1 bidding), include it
  let currentTrump: HandStrengthBySuit | undefined;
  const effectiveTrump = trump ?? turnedUpCard?.suit;
  if (effectiveTrump) {
    currentTrump = buildStrengthBySuit(effectiveTrump, allSuitsStrength[effectiveTrump]);
  }

  callbacks?.onToolProgress?.(`Best suit: ${bestSuit} (${bestStrength} pts)`);

  const recommendation = generateRecommendation(
    bestSuit,
    bestStrength,
    effectiveTrump,
    biddingRound
  );

  const result: HandStrengthResult = {
    currentTrump,
    allSuits,
    bestSuit,
    recommendation,
  };

  return {
    tool: "hand_strength",
    success: true,
    result,
    cost,
    duration: Date.now() - startTime,
  };
}
