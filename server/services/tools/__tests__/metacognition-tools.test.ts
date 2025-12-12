import { describe, it, expect, vi } from "vitest";
import { executeHandStrength } from "../hand-strength";
import { executeCardCounter } from "../card-counter";
import { executeTrumpTracker } from "../trump-tracker";
import type { ToolRequest, ToolCallbacks } from "../types";
import type { GameState, Card, Position, Suit } from "../../../../lib/game/types";

/**
 * Tests for Metacognition Arena tools
 * - Hand Strength: Calculate hand strength for each potential trump suit
 * - Card Counter: Track all cards played and remaining
 * - Trump Tracker: Track trump cards and void detection
 */

// Helper to create cards
const card = (rank: Card["rank"], suit: Suit): Card => ({ rank, suit });

// Create a mock game state for testing
function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: "test-game-1",
    phase: "playing",
    players: [
      {
        position: "north",
        team: 0,
        hand: [
          card("jack", "hearts"),
          card("ace", "hearts"),
          card("king", "spades"),
          card("queen", "clubs"),
          card("9", "diamonds"),
        ],
        modelId: "model1",
      },
      {
        position: "east",
        team: 1,
        hand: [card("jack", "diamonds"), card("ace", "spades")],
        modelId: "model2",
      },
      {
        position: "south",
        team: 0,
        hand: [card("king", "hearts"), card("queen", "hearts")],
        modelId: "model3",
      },
      {
        position: "west",
        team: 1,
        hand: [card("10", "hearts"), card("9", "clubs")],
        modelId: "model4",
      },
    ],
    dealer: "north",
    trump: "hearts",
    trumpCaller: "north",
    scores: [0, 0],
    gameScores: [0, 0],
    kitty: [],
    currentTrick: {
      leadPlayer: "east",
      plays: [],
    },
    completedTricks: [],
    trumpSelection: undefined,
    goingAlone: undefined,
    winningScore: 10,
    handNumber: 1,
    ...overrides,
  };
}

function createToolRequest(
  gameState: GameState,
  player: Position,
  decisionType: "trump_bid" | "card_play" | "discard"
): ToolRequest {
  const playerObj = gameState.players.find((p) => p.position === player)!;
  return {
    tool: "hand_strength", // Will be overridden by actual tool
    player,
    modelId: playerObj.modelId,
    context: {
      gameState,
      player,
      hand: playerObj.hand,
      decisionType,
      trump: gameState.trump ?? undefined,
      turnedUpCard: gameState.trumpSelection?.turnedUpCard,
      biddingRound: gameState.trumpSelection?.round,
      currentTrick: gameState.currentTrick?.plays.map((p) => p.card),
      leadSuit: gameState.currentTrick?.plays[0]?.card.suit,
    },
  };
}

describe("Hand Strength Tool", () => {
  describe("executeHandStrength", () => {
    it("should calculate hand strength for all suits", async () => {
      const gameState = createMockGameState();
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeHandStrength(
        { ...request, tool: "hand_strength" },
        undefined
      );

      expect(result.success).toBe(true);
      expect(result.tool).toBe("hand_strength");
      expect(result.cost).toBe(1);

      const strengthResult = result.result as any;
      expect(strengthResult.allSuits).toHaveLength(4);
      expect(strengthResult.bestSuit).toBeDefined();
      expect(strengthResult.recommendation).toBeDefined();
    });

    it("should identify best suit correctly", async () => {
      // North has: J♥ (right bower), A♥, K♠, Q♣, 9♦
      // Hearts should be best: 12 + 10 + 4 + 3 + 0 = 29
      const gameState = createMockGameState();
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeHandStrength(
        { ...request, tool: "hand_strength" },
        undefined
      );

      const strengthResult = result.result as any;
      expect(strengthResult.bestSuit).toBe("hearts");
    });

    it("should include current trump info when trump is set", async () => {
      const gameState = createMockGameState({ trump: "hearts" });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeHandStrength(
        { ...request, tool: "hand_strength" },
        undefined
      );

      const strengthResult = result.result as any;
      expect(strengthResult.currentTrump).toBeDefined();
      expect(strengthResult.currentTrump.suit).toBe("hearts");
    });

    it("should work during trump bidding round 1", async () => {
      const gameState = createMockGameState({
        phase: "trump_selection",
        trump: null,
        trumpSelection: {
          turnedUpCard: card("jack", "spades"),
          dealer: "north",
          round: 1,
          currentBidder: "east",
          bids: [],
        },
      });
      const request = createToolRequest(gameState, "east", "trump_bid");

      const result = await executeHandStrength(
        { ...request, tool: "hand_strength" },
        undefined
      );

      expect(result.success).toBe(true);
      const strengthResult = result.result as any;
      // Should include turned up card's suit (spades) as current trump context
      expect(strengthResult.currentTrump).toBeDefined();
      expect(strengthResult.currentTrump.suit).toBe("spades");
    });

    it("should generate appropriate recommendations for strong hands", async () => {
      // Create a player with a very strong hand
      const gameState = createMockGameState({
        players: [
          {
            position: "north",
            team: 0,
            hand: [
              card("jack", "hearts"), // Right bower = 12
              card("jack", "diamonds"), // Left bower = 11
              card("ace", "hearts"), // Trump ace = 10
              card("king", "hearts"), // Trump king = 9
              card("ace", "clubs"), // Off-suit ace = 5
            ],
            modelId: "model1",
          },
          ...createMockGameState().players.slice(1),
        ],
        trumpSelection: {
          turnedUpCard: card("queen", "hearts"),
          dealer: "south",
          round: 1,
          currentBidder: "north",
          bids: [],
        },
      });
      const request = createToolRequest(gameState, "north", "trump_bid");

      const result = await executeHandStrength(
        { ...request, tool: "hand_strength" },
        undefined
      );

      const strengthResult = result.result as any;
      expect(strengthResult.recommendation).toMatch(/strong|order/i);
    });

    it("should call progress callback", async () => {
      const gameState = createMockGameState();
      const request = createToolRequest(gameState, "north", "card_play");
      const callbacks: ToolCallbacks = {
        onToolProgress: vi.fn(),
      };

      await executeHandStrength({ ...request, tool: "hand_strength" }, callbacks);

      expect(callbacks.onToolProgress).toHaveBeenCalled();
    });
  });
});

describe("Card Counter Tool", () => {
  describe("executeCardCounter", () => {
    it("should track cards with no tricks played", async () => {
      const gameState = createMockGameState();
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeCardCounter(
        { ...request, tool: "card_counter" },
        undefined
      );

      expect(result.success).toBe(true);
      expect(result.tool).toBe("card_counter");
      expect(result.cost).toBe(1);

      const counterResult = result.result as any;
      expect(counterResult.bySuit).toHaveLength(4);
      expect(counterResult.totalPlayed).toBe(0);
      // 24 cards total - 5 in north's hand = 19 remaining in play
      expect(counterResult.totalRemaining).toBe(19);
    });

    it("should track cards after completed tricks", async () => {
      const gameState = createMockGameState({
        completedTricks: [
          {
            leadPlayer: "east",
            plays: [
              { player: "east", card: card("10", "spades") },
              { player: "south", card: card("9", "spades") },
              { player: "west", card: card("queen", "spades") },
              { player: "north", card: card("ace", "spades") },
            ],
            winner: "north",
          },
        ],
      });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeCardCounter(
        { ...request, tool: "card_counter" },
        undefined
      );

      const counterResult = result.result as any;
      expect(counterResult.totalPlayed).toBe(4);

      // Find spades in the result
      const spades = counterResult.bySuit.find((s: any) => s.suit === "spades");
      expect(spades.count.played).toBe(4);
    });

    it("should track cards in current trick", async () => {
      const gameState = createMockGameState({
        currentTrick: {
          leadPlayer: "east",
          plays: [
            { player: "east", card: card("ace", "diamonds") },
            { player: "south", card: card("king", "diamonds") },
          ],
        },
      });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeCardCounter(
        { ...request, tool: "card_counter" },
        undefined
      );

      const counterResult = result.result as any;
      expect(counterResult.totalPlayed).toBe(2);

      const diamonds = counterResult.bySuit.find((s: any) => s.suit === "diamonds");
      expect(diamonds.count.played).toBe(2);
    });

    it("should exclude agent's own hand from remaining cards", async () => {
      // North has 5 cards, total deck is 24
      // With no tricks played, remaining = 24 - 5 = 19
      const gameState = createMockGameState();
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeCardCounter(
        { ...request, tool: "card_counter" },
        undefined
      );

      const counterResult = result.result as any;
      // Total remaining should not include north's hand
      expect(counterResult.totalRemaining).toBe(19);
    });

    it("should generate summary with trump indication", async () => {
      const gameState = createMockGameState({ trump: "hearts" });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeCardCounter(
        { ...request, tool: "card_counter" },
        undefined
      );

      const counterResult = result.result as any;
      expect(counterResult.summary).toContain("hearts");
      expect(counterResult.summary).toContain("trump");
    });

    it("should call progress callback", async () => {
      const gameState = createMockGameState();
      const request = createToolRequest(gameState, "north", "card_play");
      const callbacks: ToolCallbacks = {
        onToolProgress: vi.fn(),
      };

      await executeCardCounter({ ...request, tool: "card_counter" }, callbacks);

      expect(callbacks.onToolProgress).toHaveBeenCalled();
    });
  });
});

describe("Trump Tracker Tool", () => {
  describe("executeTrumpTracker", () => {
    it("should track trump cards with none played", async () => {
      const gameState = createMockGameState({ trump: "hearts" });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeTrumpTracker(
        { ...request, tool: "trump_tracker" },
        undefined
      );

      expect(result.success).toBe(true);
      expect(result.tool).toBe("trump_tracker");
      expect(result.cost).toBe(1);

      const trackerResult = result.result as any;
      expect(trackerResult.trumpSuit).toBe("hearts");
      expect(trackerResult.trumpPlayed).toHaveLength(0);
      // 7 trump cards: 6 hearts + jack of diamonds (left bower)
      expect(trackerResult.trumpRemaining).toHaveLength(7);
      expect(trackerResult.rightBowerPlayed).toBe(false);
      expect(trackerResult.leftBowerPlayed).toBe(false);
    });

    it("should detect right bower played", async () => {
      const gameState = createMockGameState({
        trump: "hearts",
        completedTricks: [
          {
            leadPlayer: "north",
            plays: [
              { player: "north", card: card("jack", "hearts") }, // Right bower
              { player: "east", card: card("10", "hearts") },
              { player: "south", card: card("9", "hearts") },
              { player: "west", card: card("queen", "hearts") },
            ],
            winner: "north",
          },
        ],
      });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeTrumpTracker(
        { ...request, tool: "trump_tracker" },
        undefined
      );

      const trackerResult = result.result as any;
      expect(trackerResult.rightBowerPlayed).toBe(true);
      expect(trackerResult.trumpPlayed).toHaveLength(4);
    });

    it("should detect left bower played", async () => {
      const gameState = createMockGameState({
        trump: "hearts",
        completedTricks: [
          {
            leadPlayer: "east",
            plays: [
              { player: "east", card: card("jack", "diamonds") }, // Left bower (hearts trump)
              { player: "south", card: card("10", "clubs") },
              { player: "west", card: card("9", "clubs") },
              { player: "north", card: card("ace", "clubs") },
            ],
            winner: "east",
          },
        ],
      });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeTrumpTracker(
        { ...request, tool: "trump_tracker" },
        undefined
      );

      const trackerResult = result.result as any;
      expect(trackerResult.leftBowerPlayed).toBe(true);
      expect(trackerResult.rightBowerPlayed).toBe(false);
    });

    it("should detect void players when they don't follow trump", async () => {
      const gameState = createMockGameState({
        trump: "hearts",
        completedTricks: [
          {
            leadPlayer: "north",
            plays: [
              { player: "north", card: card("ace", "hearts") }, // Trump lead
              { player: "east", card: card("9", "clubs") }, // Didn't follow - void!
              { player: "south", card: card("king", "hearts") }, // Followed
              { player: "west", card: card("10", "spades") }, // Didn't follow - void!
            ],
            winner: "north",
          },
        ],
      });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeTrumpTracker(
        { ...request, tool: "trump_tracker" },
        undefined
      );

      const trackerResult = result.result as any;
      expect(trackerResult.playersLikelyVoid).toContain("east");
      expect(trackerResult.playersLikelyVoid).toContain("west");
      expect(trackerResult.playersLikelyVoid).not.toContain("south");
    });

    it("should return error when no trump set", async () => {
      const gameState = createMockGameState({ trump: null });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeTrumpTracker(
        { ...request, tool: "trump_tracker" },
        undefined
      );

      expect(result.success).toBe(false);
      const trackerResult = result.result as any;
      expect(trackerResult.summary).toContain("not been called");
    });

    it("should sort trump by power", async () => {
      const gameState = createMockGameState({
        trump: "spades",
        completedTricks: [
          {
            leadPlayer: "north",
            plays: [
              { player: "north", card: card("9", "spades") },
              { player: "east", card: card("ace", "spades") },
              { player: "south", card: card("jack", "spades") }, // Right bower
              { player: "west", card: card("king", "spades") },
            ],
            winner: "south",
          },
        ],
      });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeTrumpTracker(
        { ...request, tool: "trump_tracker" },
        undefined
      );

      const trackerResult = result.result as any;
      // Should be sorted: right bower (jack spades), ace, king, 9
      expect(trackerResult.trumpPlayed[0].rank).toBe("jack");
      expect(trackerResult.trumpPlayed[0].suit).toBe("spades");
    });

    it("should generate summary with bower status", async () => {
      const gameState = createMockGameState({
        trump: "clubs",
        completedTricks: [
          {
            leadPlayer: "north",
            plays: [
              { player: "north", card: card("jack", "clubs") }, // Right bower
              { player: "east", card: card("10", "clubs") },
              { player: "south", card: card("9", "diamonds") },
              { player: "west", card: card("queen", "diamonds") },
            ],
            winner: "north",
          },
        ],
      });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeTrumpTracker(
        { ...request, tool: "trump_tracker" },
        undefined
      );

      const trackerResult = result.result as any;
      expect(trackerResult.summary).toContain("clubs");
      expect(trackerResult.summary).toContain("Right bower played");
      expect(trackerResult.summary).toContain("left bower still out");
    });

    it("should call progress callback", async () => {
      const gameState = createMockGameState({ trump: "hearts" });
      const request = createToolRequest(gameState, "north", "card_play");
      const callbacks: ToolCallbacks = {
        onToolProgress: vi.fn(),
      };

      await executeTrumpTracker({ ...request, tool: "trump_tracker" }, callbacks);

      expect(callbacks.onToolProgress).toHaveBeenCalled();
    });

    it("should track trump in current trick", async () => {
      const gameState = createMockGameState({
        trump: "hearts",
        currentTrick: {
          leadPlayer: "east",
          plays: [
            { player: "east", card: card("ace", "hearts") },
            { player: "south", card: card("king", "hearts") },
          ],
        },
      });
      const request = createToolRequest(gameState, "north", "card_play");

      const result = await executeTrumpTracker(
        { ...request, tool: "trump_tracker" },
        undefined
      );

      const trackerResult = result.result as any;
      expect(trackerResult.trumpPlayed).toHaveLength(2);
    });
  });
});

describe("Tool Integration", () => {
  it("should have consistent cost across tool executions", async () => {
    const gameState = createMockGameState({ trump: "hearts" });
    const request = createToolRequest(gameState, "north", "card_play");

    const handResult = await executeHandStrength({ ...request, tool: "hand_strength" }, undefined);
    const cardResult = await executeCardCounter({ ...request, tool: "card_counter" }, undefined);
    const trumpResult = await executeTrumpTracker({ ...request, tool: "trump_tracker" }, undefined);

    expect(handResult.cost).toBe(1);
    expect(cardResult.cost).toBe(1);
    expect(trumpResult.cost).toBe(1);
  });

  it("should track duration for all tools", async () => {
    const gameState = createMockGameState({ trump: "hearts" });
    const request = createToolRequest(gameState, "north", "card_play");

    const handResult = await executeHandStrength({ ...request, tool: "hand_strength" }, undefined);
    const cardResult = await executeCardCounter({ ...request, tool: "card_counter" }, undefined);
    const trumpResult = await executeTrumpTracker({ ...request, tool: "trump_tracker" }, undefined);

    expect(handResult.duration).toBeGreaterThanOrEqual(0);
    expect(cardResult.duration).toBeGreaterThanOrEqual(0);
    expect(trumpResult.duration).toBeGreaterThanOrEqual(0);
  });
});
