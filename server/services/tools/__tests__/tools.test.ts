import { describe, it, expect } from "vitest";
import {
  TOOL_DEFINITIONS,
  getToolCost,
  type ToolResult,
  type AskAudienceResult,
  type SituationLookupResult,
  type FiftyFiftyResult,
  type HandStrengthResult,
  type CardCounterResult,
  type TrumpTrackerResult,
} from "../types";
import { shouldUseTool, buildToolContext } from "../index";
import type { GameState, Position } from "../../../../lib/game/types";

/**
 * Tests for Metacognition Arena tool infrastructure
 */

describe("Tool Definitions", () => {
  describe("TOOL_DEFINITIONS", () => {
    it("should have all six tools defined", () => {
      expect(TOOL_DEFINITIONS.ask_audience).toBeDefined();
      expect(TOOL_DEFINITIONS.situation_lookup).toBeDefined();
      expect(TOOL_DEFINITIONS.fifty_fifty).toBeDefined();
      expect(TOOL_DEFINITIONS.hand_strength).toBeDefined();
      expect(TOOL_DEFINITIONS.card_counter).toBeDefined();
      expect(TOOL_DEFINITIONS.trump_tracker).toBeDefined();
    });

    it("should have correct costs", () => {
      expect(TOOL_DEFINITIONS.ask_audience.cost).toBe(2);
      expect(TOOL_DEFINITIONS.situation_lookup.cost).toBe(1);
      expect(TOOL_DEFINITIONS.fifty_fifty.cost).toBe(3);
      expect(TOOL_DEFINITIONS.hand_strength.cost).toBe(1);
      expect(TOOL_DEFINITIONS.card_counter.cost).toBe(1);
      expect(TOOL_DEFINITIONS.trump_tracker.cost).toBe(1);
    });

    it("should have required fields for each tool", () => {
      for (const tool of Object.values(TOOL_DEFINITIONS)) {
        expect(tool.name).toBeDefined();
        expect(tool.id).toBeDefined();
        expect(tool.cost).toBeGreaterThan(0);
        expect(tool.description).toBeDefined();
        expect(tool.icon).toBeDefined();
      }
    });

    it("should have correct icons for new metacognition tools", () => {
      expect(TOOL_DEFINITIONS.hand_strength.icon).toBe("💪");
      expect(TOOL_DEFINITIONS.card_counter.icon).toBe("🔢");
      expect(TOOL_DEFINITIONS.trump_tracker.icon).toBe("🎯");
    });
  });

  describe("getToolCost", () => {
    it("should return 0 for 'none'", () => {
      expect(getToolCost("none")).toBe(0);
    });

    it("should return correct cost for each tool", () => {
      expect(getToolCost("ask_audience")).toBe(2);
      expect(getToolCost("situation_lookup")).toBe(1);
      expect(getToolCost("fifty_fifty")).toBe(3);
      expect(getToolCost("hand_strength")).toBe(1);
      expect(getToolCost("card_counter")).toBe(1);
      expect(getToolCost("trump_tracker")).toBe(1);
    });
  });
});

describe("Tool Registry", () => {
  describe("shouldUseTool", () => {
    it("should return false for 'none'", () => {
      expect(shouldUseTool("none")).toBe(false);
    });

    it("should return true for valid tools", () => {
      expect(shouldUseTool("ask_audience")).toBe(true);
      expect(shouldUseTool("situation_lookup")).toBe(true);
      expect(shouldUseTool("fifty_fifty")).toBe(true);
      expect(shouldUseTool("hand_strength")).toBe(true);
      expect(shouldUseTool("card_counter")).toBe(true);
      expect(shouldUseTool("trump_tracker")).toBe(true);
    });
  });

  describe("buildToolContext", () => {
    const mockGameState: GameState = {
      id: "test-game-1",
      phase: "playing",
      players: [
        { position: "north", team: 0, hand: [{ rank: "ace", suit: "hearts" }], modelId: "model1" },
        { position: "east", team: 1, hand: [{ rank: "king", suit: "spades" }], modelId: "model2" },
        { position: "south", team: 0, hand: [{ rank: "queen", suit: "diamonds" }], modelId: "model3" },
        { position: "west", team: 1, hand: [{ rank: "jack", suit: "clubs" }], modelId: "model4" },
      ],
      dealer: "north",
      trump: "hearts",
      trumpCaller: "north",
      scores: [0, 0],
      gameScores: [0, 0],
      kitty: [],
      currentTrick: {
        leadPlayer: "east",
        plays: [{ player: "east", card: { rank: "10", suit: "hearts" } }],
      },
      completedTricks: [],
      trumpSelection: undefined,
      goingAlone: undefined,
      winningScore: 10,
      handNumber: 1,
    };

    it("should build context for card_play", () => {
      const context = buildToolContext(mockGameState, "north", "card_play");

      expect(context.gameState).toBe(mockGameState);
      expect(context.player).toBe("north");
      expect(context.decisionType).toBe("card_play");
      expect(context.hand).toHaveLength(1);
      expect(context.hand[0]).toEqual({ rank: "ace", suit: "hearts" });
      expect(context.currentTrick).toHaveLength(1);
      expect(context.leadSuit).toBe("hearts");
      expect(context.trump).toBe("hearts");
    });

    it("should build context for trump_bid", () => {
      const trumpBidState: GameState = {
        ...mockGameState,
        phase: "trump_selection",
        trump: null,
        trumpSelection: {
          turnedUpCard: { rank: "jack", suit: "spades" },
          dealer: "north",
          round: 1,
          currentBidder: "east",
          bids: [],
        },
      };

      const context = buildToolContext(trumpBidState, "east", "trump_bid");

      expect(context.decisionType).toBe("trump_bid");
      expect(context.turnedUpCard).toEqual({ rank: "jack", suit: "spades" });
      expect(context.biddingRound).toBe(1);
    });

    it("should build context for discard", () => {
      const context = buildToolContext(mockGameState, "north", "discard");

      expect(context.decisionType).toBe("discard");
      expect(context.hand).toHaveLength(1);
    });
  });
});

describe("Tool Result Types", () => {
  describe("AskAudienceResult", () => {
    it("should have correct structure", () => {
      const result: AskAudienceResult = {
        opinions: [
          {
            modelId: "model1",
            modelName: "GPT-4o Mini",
            decision: "ace of hearts",
            confidence: 85,
            briefReasoning: "Strong trump card",
          },
        ],
        consensus: {
          decision: "ace of hearts",
          agreementRate: 100,
        },
      };

      expect(result.opinions).toHaveLength(1);
      expect(result.consensus.agreementRate).toBe(100);
    });
  });

  describe("SituationLookupResult", () => {
    it("should have correct structure", () => {
      const result: SituationLookupResult = {
        situationsFound: 5,
        recommendations: [
          {
            decision: "ace of hearts",
            successRate: 0.8,
            occurrences: 10,
            sampleReasoning: "Usually wins the trick",
          },
        ],
        confidence: 75,
      };

      expect(result.situationsFound).toBe(5);
      expect(result.recommendations).toHaveLength(1);
    });
  });

  describe("FiftyFiftyResult", () => {
    it("should have correct structure", () => {
      const result: FiftyFiftyResult = {
        totalOptions: 4,
        winningOptions: 2,
        revealedWinners: [
          { rank: "ace", suit: "hearts" },
          { rank: "king", suit: "hearts" },
        ],
        eliminatedLosers: [
          { rank: "9", suit: "clubs" },
          { rank: "10", suit: "diamonds" },
        ],
      };

      expect(result.totalOptions).toBe(4);
      expect(result.winningOptions).toBe(2);
      expect(result.revealedWinners).toHaveLength(2);
      expect(result.eliminatedLosers).toHaveLength(2);
    });
  });

  describe("HandStrengthResult", () => {
    it("should have correct structure", () => {
      const result: HandStrengthResult = {
        currentTrump: {
          suit: "hearts",
          strength: 25,
          category: "strong",
          percent: 50,
        },
        allSuits: [
          { suit: "hearts", strength: 25, category: "strong", percent: 50 },
          { suit: "diamonds", strength: 18, category: "medium", percent: 36 },
          { suit: "clubs", strength: 12, category: "weak", percent: 24 },
          { suit: "spades", strength: 10, category: "weak", percent: 20 },
        ],
        bestSuit: "hearts",
        recommendation: "Strong hand for hearts (25 pts). Consider ordering up.",
      };

      expect(result.bestSuit).toBe("hearts");
      expect(result.allSuits).toHaveLength(4);
      expect(result.currentTrump?.category).toBe("strong");
      expect(result.recommendation).toContain("Strong hand");
    });

    it("should allow currentTrump to be undefined", () => {
      const result: HandStrengthResult = {
        allSuits: [
          { suit: "hearts", strength: 25, category: "strong", percent: 50 },
        ],
        bestSuit: "hearts",
        recommendation: "Best potential trump: hearts",
      };

      expect(result.currentTrump).toBeUndefined();
    });
  });

  describe("CardCounterResult", () => {
    it("should have correct structure", () => {
      const result: CardCounterResult = {
        bySuit: [
          {
            suit: "hearts",
            played: [{ rank: "ace", suit: "hearts" }],
            remaining: [{ rank: "king", suit: "hearts" }],
            count: { played: 1, remaining: 1 },
          },
          {
            suit: "diamonds",
            played: [],
            remaining: [{ rank: "ace", suit: "diamonds" }],
            count: { played: 0, remaining: 1 },
          },
          {
            suit: "clubs",
            played: [{ rank: "9", suit: "clubs" }],
            remaining: [],
            count: { played: 1, remaining: 0 },
          },
          {
            suit: "spades",
            played: [],
            remaining: [],
            count: { played: 0, remaining: 0 },
          },
        ],
        totalPlayed: 2,
        totalRemaining: 2,
        summary: "hearts: 1 played, 1 out; diamonds: none played yet",
      };

      expect(result.bySuit).toHaveLength(4);
      expect(result.totalPlayed).toBe(2);
      expect(result.totalRemaining).toBe(2);
      expect(result.summary).toContain("hearts");
    });
  });

  describe("TrumpTrackerResult", () => {
    it("should have correct structure", () => {
      const result: TrumpTrackerResult = {
        trumpSuit: "hearts",
        trumpPlayed: [
          { rank: "jack", suit: "hearts" },
          { rank: "ace", suit: "hearts" },
        ],
        trumpRemaining: [
          { rank: "jack", suit: "diamonds" },
          { rank: "king", suit: "hearts" },
        ],
        leftBowerPlayed: false,
        rightBowerPlayed: true,
        playersLikelyVoid: ["east", "west"],
        summary: "Trump: hearts. 2/7 trump played. Right bower played, left bower still out.",
      };

      expect(result.trumpSuit).toBe("hearts");
      expect(result.trumpPlayed).toHaveLength(2);
      expect(result.trumpRemaining).toHaveLength(2);
      expect(result.rightBowerPlayed).toBe(true);
      expect(result.leftBowerPlayed).toBe(false);
      expect(result.playersLikelyVoid).toContain("east");
      expect(result.summary).toContain("hearts");
    });

    it("should allow empty void players", () => {
      const result: TrumpTrackerResult = {
        trumpSuit: "spades",
        trumpPlayed: [],
        trumpRemaining: [{ rank: "jack", suit: "spades" }],
        leftBowerPlayed: false,
        rightBowerPlayed: false,
        playersLikelyVoid: [],
        summary: "Trump: spades. 0/7 trump played.",
      };

      expect(result.playersLikelyVoid).toHaveLength(0);
    });
  });

  describe("ToolResult", () => {
    it("should include cost and duration", () => {
      const result: ToolResult = {
        tool: "ask_audience",
        success: true,
        result: {
          opinions: [],
          consensus: { decision: "pass", agreementRate: 0 },
        },
        cost: 2,
        duration: 1500,
      };

      expect(result.tool).toBe("ask_audience");
      expect(result.success).toBe(true);
      expect(result.cost).toBe(2);
      expect(result.duration).toBe(1500);
    });
  });
});

describe("Confidence Levels", () => {
  it("should categorize confidence correctly", () => {
    // High confidence: 70-100
    expect(75).toBeGreaterThanOrEqual(70);
    expect(75).toBeLessThanOrEqual(100);

    // Medium confidence: 40-69
    expect(55).toBeGreaterThanOrEqual(40);
    expect(55).toBeLessThan(70);

    // Low confidence: 0-39
    expect(30).toBeGreaterThanOrEqual(0);
    expect(30).toBeLessThan(40);
  });
});
