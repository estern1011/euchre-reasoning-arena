import type { ToolRequest, ToolResult, SituationLookupResult, HistoricalSituation, ToolCallbacks } from "./types";
import type { Card } from "../../../lib/game/types";
import { getToolCost } from "./types";
import { cardToString } from "../../../lib/game/card";

/**
 * Situation Lookup Tool - Query similar historical hands
 *
 * Currently a mock implementation that generates plausible recommendations
 * based on common Euchre heuristics. In future, this could query a real
 * database of historical game decisions.
 */

/**
 * Common Euchre heuristics encoded as "historical wisdom"
 */
const HEURISTICS = {
  // Trump bidding heuristics
  trump_bid: [
    {
      condition: (ctx: any) => countTrump(ctx.hand, ctx.turnedUpCard?.suit) >= 3,
      decision: "order_up",
      successRate: 75,
      reasoning: "Three or more trump cards typically warrants ordering up",
    },
    {
      condition: (ctx: any) => hasRightBower(ctx.hand, ctx.turnedUpCard?.suit),
      decision: "order_up",
      successRate: 80,
      reasoning: "Having the right bower is a strong indicator to order up",
    },
    {
      condition: (ctx: any) => countTrump(ctx.hand, ctx.turnedUpCard?.suit) <= 1,
      decision: "pass",
      successRate: 70,
      reasoning: "Weak trump holdings suggest passing",
    },
  ],
  // Card play heuristics
  card_play: [
    {
      condition: (ctx: any) => ctx.currentTrick?.length === 0,
      decision: "lead_trump",
      successRate: 65,
      reasoning: "Leading trump can draw out opponent's trump",
    },
    {
      condition: (ctx: any) => ctx.currentTrick?.length === 3,
      decision: "play_lowest_winner",
      successRate: 70,
      reasoning: "When last to play, use minimum card needed to win",
    },
    {
      condition: (ctx: any) => isPartnerWinning(ctx),
      decision: "throw_off",
      successRate: 75,
      reasoning: "Don't waste a high card when partner is winning",
    },
  ],
};

function countTrump(hand: Card[], trumpSuit: string | undefined): number {
  if (!trumpSuit) return 0;
  return hand.filter(card => {
    if (card.suit === trumpSuit) return true;
    // Left bower check
    if (card.rank === "jack") {
      const sameColor =
        (card.suit === "hearts" && trumpSuit === "diamonds") ||
        (card.suit === "diamonds" && trumpSuit === "hearts") ||
        (card.suit === "spades" && trumpSuit === "clubs") ||
        (card.suit === "clubs" && trumpSuit === "spades");
      return sameColor;
    }
    return false;
  }).length;
}

function hasRightBower(hand: Card[], trumpSuit: string | undefined): boolean {
  if (!trumpSuit) return false;
  return hand.some(card => card.rank === "jack" && card.suit === trumpSuit);
}

function isPartnerWinning(ctx: any): boolean {
  // Simplified check - would need full trick analysis in real implementation
  return false;
}

function generateRecommendations(request: ToolRequest): HistoricalSituation[] {
  const { context } = request;
  const recommendations: HistoricalSituation[] = [];

  const heuristics = context.decisionType === "trump_bid"
    ? HEURISTICS.trump_bid
    : HEURISTICS.card_play;

  for (const heuristic of heuristics) {
    try {
      if (heuristic.condition(context)) {
        recommendations.push({
          decision: heuristic.decision,
          successRate: heuristic.successRate + Math.floor(Math.random() * 10) - 5, // Add some variance
          occurrences: Math.floor(Math.random() * 500) + 100,
          sampleReasoning: heuristic.reasoning,
        });
      }
    } catch {
      // Condition check failed, skip this heuristic
    }
  }

  // Add a general recommendation if nothing matched
  if (recommendations.length === 0) {
    if (context.decisionType === "trump_bid") {
      recommendations.push({
        decision: "pass",
        successRate: 55,
        occurrences: 234,
        sampleReasoning: "When uncertain, passing is often the safer choice",
      });
    } else if (context.decisionType === "card_play" && context.hand.length > 0) {
      const card = context.hand[0]!;
      recommendations.push({
        decision: cardToString(card),
        successRate: 50,
        occurrences: 156,
        sampleReasoning: "No strong historical patterns match this exact situation",
      });
    }
  }

  // Sort by success rate
  recommendations.sort((a, b) => b.successRate - a.successRate);

  return recommendations.slice(0, 3); // Return top 3
}

export async function executeSituationLookup(
  request: ToolRequest,
  callbacks?: ToolCallbacks
): Promise<ToolResult> {
  const startTime = Date.now();
  const cost = getToolCost("situation_lookup");

  callbacks?.onToolProgress?.("Searching historical situations...");

  // Simulate a small delay for "database lookup"
  await new Promise(resolve => setTimeout(resolve, 200));

  const recommendations = generateRecommendations(request);

  callbacks?.onToolProgress?.(`Found ${recommendations.length} similar situations`);

  // Calculate confidence based on how many strong recommendations we found
  const avgSuccessRate = recommendations.length > 0
    ? recommendations.reduce((sum, r) => sum + r.successRate, 0) / recommendations.length
    : 0;

  const result: SituationLookupResult = {
    situationsFound: recommendations.reduce((sum, r) => sum + r.occurrences, 0),
    recommendations,
    confidence: Math.min(95, avgSuccessRate),
  };

  return {
    tool: "situation_lookup",
    success: true,
    result,
    cost,
    duration: Date.now() - startTime,
  };
}
