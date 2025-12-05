import { describe, it, expect } from "vitest";
import type { Card } from "../../../lib/game/types";
import type { CardPlayResult, TrumpBidResult } from "../ai-agent";

/**
 * Unit tests for illegal move tracking type definitions and contracts
 * These test the TypeScript interfaces and data structures without mocking AI calls
 */

describe("AI Agent - Illegal Move Tracking Types", () => {
  describe("CardPlayResult Interface", () => {
    it("should support illegalAttempt field", () => {
      const resultWithIllegalAttempt: CardPlayResult = {
        card: { rank: "ace", suit: "hearts" },
        reasoning: "I'll play ace of hearts",
        duration: 1000,
        illegalAttempt: {
          card: { rank: "queen", suit: "spades" },
          reasoning: "Initial reasoning for queen",
        },
        isFallback: false,
      };

      expect(resultWithIllegalAttempt.illegalAttempt).toBeDefined();
      expect(resultWithIllegalAttempt.illegalAttempt?.card.rank).toBe("queen");
      expect(resultWithIllegalAttempt.isFallback).toBe(false);
    });

    it("should support isFallback flag", () => {
      const fallbackResult: CardPlayResult = {
        card: { rank: "ace", suit: "hearts" },
        reasoning: "Fallback reasoning",
        duration: 1500,
        isFallback: true,
        illegalAttempt: {
          card: { rank: "queen", suit: "spades" },
          reasoning: "Failed attempt",
        },
      };

      expect(fallbackResult.isFallback).toBe(true);
      expect(fallbackResult.illegalAttempt).toBeDefined();
    });

    it("should allow CardPlayResult without illegal attempt", () => {
      const cleanResult: CardPlayResult = {
        card: { rank: "king", suit: "diamonds" },
        reasoning: "Valid play",
        duration: 800,
      };

      expect(cleanResult.illegalAttempt).toBeUndefined();
      expect(cleanResult.isFallback).toBeFalsy();
    });

    it("should allow optional fields to be undefined", () => {
      const minimalResult: CardPlayResult = {
        card: { rank: "9", suit: "clubs" },
        reasoning: "Minimal result",
        duration: 500,
        illegalAttempt: undefined,
        isFallback: undefined,
      };

      expect(minimalResult.illegalAttempt).toBeUndefined();
      expect(minimalResult.isFallback).toBeUndefined();
    });
  });

  describe("TrumpBidResult Interface (no illegal tracking)", () => {
    it("should not have illegal move tracking", () => {
      const bidResult: TrumpBidResult = {
        action: "order_up",
        goingAlone: false,
        reasoning: "Good hand",
        duration: 2000,
      };

      // TypeScript should not allow illegalAttempt on TrumpBidResult
      // @ts-expect-error - illegalAttempt should not exist on TrumpBidResult
      expect(bidResult.illegalAttempt).toBeUndefined();
    });
  });

  describe("Illegal Attempt Data Structure", () => {
    it("should preserve card details in illegal attempt", () => {
      const illegalCard: Card = { rank: "jack", suit: "spades" };
      const illegalReasoning = "I think jack of spades is best";

      const result: CardPlayResult = {
        card: { rank: "ace", suit: "hearts" },
        reasoning: "Retry succeeded with ace",
        duration: 3000,
        illegalAttempt: {
          card: illegalCard,
          reasoning: illegalReasoning,
        },
        isFallback: false,
      };

      expect(result.illegalAttempt?.card).toEqual(illegalCard);
      expect(result.illegalAttempt?.reasoning).toBe(illegalReasoning);
    });

    it("should differentiate between retry success and fallback", () => {
      const retrySuccess: CardPlayResult = {
        card: { rank: "king", suit: "hearts" },
        reasoning: "Retry reasoning",
        duration: 2500,
        illegalAttempt: {
          card: { rank: "queen", suit: "spades" },
          reasoning: "First attempt",
        },
        isFallback: false, // Retry succeeded
      };

      const fallbackUsed: CardPlayResult = {
        card: { rank: "ace", suit: "hearts" },
        reasoning: "Fallback reasoning",
        duration: 3500,
        illegalAttempt: {
          card: { rank: "queen", suit: "spades" },
          reasoning: "First attempt",
        },
        isFallback: true, // Had to fall back
      };

      expect(retrySuccess.isFallback).toBe(false);
      expect(fallbackUsed.isFallback).toBe(true);
    });
  });

  describe("Data Contract Requirements", () => {
    it("should have all required fields on CardPlayResult", () => {
      const result: CardPlayResult = {
        card: { rank: "10", suit: "hearts" },
        reasoning: "Test reasoning",
        duration: 1200,
      };

      // Required fields must exist
      expect(result.card).toBeDefined();
      expect(result.card.rank).toBeDefined();
      expect(result.card.suit).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.duration).toBeDefined();
    });

    it("should allow rich illegal attempt data", () => {
      const result: CardPlayResult = {
        card: { rank: "ace", suit: "clubs" },
        reasoning: "Final decision after retry",
        duration: 4000,
        illegalAttempt: {
          card: { rank: "king", suit: "spades" },
          reasoning:
            "Long detailed reasoning about why king of spades seemed like a good choice but was actually illegal",
        },
        isFallback: false,
      };

      expect(result.illegalAttempt?.reasoning.length).toBeGreaterThan(50);
    });
  });
});

describe("SSE Event Data Structures", () => {
  describe("illegal_attempt Event Payload", () => {
    it("should have expected structure for SSE transmission", () => {
      // This represents what would be sent via SSE
      const illegalAttemptEvent = {
        type: "illegal_attempt",
        player: "north",
        modelId: "test/model",
        attemptedCard: { rank: "queen", suit: "hearts" },
        isFallback: false,
      };

      expect(illegalAttemptEvent.type).toBe("illegal_attempt");
      expect(illegalAttemptEvent.player).toBe("north");
      expect(illegalAttemptEvent.attemptedCard).toBeDefined();
      expect(illegalAttemptEvent.isFallback).toBeDefined();
    });

    it("should support fallback flag in event", () => {
      const fallbackEvent = {
        type: "illegal_attempt",
        player: "south",
        modelId: "test/model",
        attemptedCard: { rank: "jack", suit: "clubs" },
        isFallback: true,
      };

      expect(fallbackEvent.isFallback).toBe(true);
    });
  });

  describe("decision_made Event with Illegal Data", () => {
    it("should include illegal attempt fields when present", () => {
      const decisionEvent = {
        type: "decision_made",
        player: "east",
        modelId: "test/model",
        card: { rank: "ace", suit: "diamonds" },
        reasoning: "Final reasoning",
        duration: 2000,
        illegalAttempt: {
          card: { rank: "king", suit: "spades" },
          reasoning: "Initial illegal reasoning",
        },
        isFallback: false,
      };

      expect(decisionEvent.illegalAttempt).toBeDefined();
      expect(decisionEvent.isFallback).toBe(false);
    });

    it("should work without illegal attempt fields", () => {
      const cleanDecisionEvent: {
        type: string;
        player: string;
        modelId: string;
        card: { rank: string; suit: string };
        reasoning: string;
        duration: number;
        illegalAttempt?: unknown;
        isFallback?: boolean;
      } = {
        type: "decision_made",
        player: "west",
        modelId: "test/model",
        card: { rank: "10", suit: "hearts" },
        reasoning: "Clean decision",
        duration: 1000,
      };

      expect(cleanDecisionEvent.illegalAttempt).toBeUndefined();
      expect(cleanDecisionEvent.isFallback).toBeFalsy();
    });
  });
});
