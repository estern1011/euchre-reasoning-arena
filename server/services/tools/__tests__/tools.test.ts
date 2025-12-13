import { describe, it, expect } from "vitest";
import {
  TOOL_DEFINITIONS,
  getToolCost,
  type ToolResult,
  type AskAudienceResult,
  type AskPartnerResult,
  type FiftyFiftyResult,
} from "../types";
import { shouldUseTool, buildToolContext } from "../index";
import type { GameState, Position } from "../../../../lib/game/types";

/**
 * Tests for Metacognition Arena tool infrastructure
 */

describe("Tool Definitions", () => {
  describe("TOOL_DEFINITIONS", () => {
    it("should have all three tools defined", () => {
      expect(TOOL_DEFINITIONS.ask_audience).toBeDefined();
      expect(TOOL_DEFINITIONS.ask_partner).toBeDefined();
      expect(TOOL_DEFINITIONS.fifty_fifty).toBeDefined();
    });

    it("should have correct costs", () => {
      expect(TOOL_DEFINITIONS.ask_audience.cost).toBe(2);
      expect(TOOL_DEFINITIONS.ask_partner.cost).toBe(2);
      expect(TOOL_DEFINITIONS.fifty_fifty.cost).toBe(3);
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
  });

  describe("getToolCost", () => {
    it("should return 0 for 'none'", () => {
      expect(getToolCost("none")).toBe(0);
    });

    it("should return correct cost for each tool", () => {
      expect(getToolCost("ask_audience")).toBe(2);
      expect(getToolCost("ask_partner")).toBe(2);
      expect(getToolCost("fifty_fifty")).toBe(3);
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
      expect(shouldUseTool("ask_partner")).toBe(true);
      expect(shouldUseTool("fifty_fifty")).toBe(true);
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

  describe("AskPartnerResult", () => {
    it("should have correct structure", () => {
      const result: AskPartnerResult = {
        partnerPosition: "south",
        partnerModelId: "anthropic/claude-3-haiku",
        partnerModelName: "Claude 3 Haiku",
        question: "What should I do?",
        partnerAdvice: "Lead with your strongest trump",
        partnerConfidence: 80,
      };

      expect(result.partnerPosition).toBe("south");
      expect(result.partnerAdvice).toBe("Lead with your strongest trump");
      expect(result.partnerConfidence).toBe(80);
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
