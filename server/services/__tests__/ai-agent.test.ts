import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  makeCardPlayDecision,
  makeCardPlayDecisionStreaming,
  makeTrumpBidDecision,
  makeTrumpBidDecisionStreaming,
  makeDiscardDecisionStreaming,
  clearGatewayCache,
  type CardPlayResult,
} from "../ai-agent";
import { createGameWithTrump, createNewGame } from "../../../lib/game/game";
import type { Card } from "../../../lib/game/types";

// Helper to create a mock async iterable for streaming
function createMockStream<T>(partials: Partial<T>[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const partial of partials) {
        yield partial;
      }
    },
  };
}

// Mock ai sdk functions for structured output
vi.mock("ai", () => ({
  generateObject: vi.fn(),
  streamObject: vi.fn(),
  createGateway: vi.fn(() => () => ({})),
}));

const { generateObject, streamObject } = await import("ai");

const modelIds: [string, string, string, string] = ["m1", "m2", "m3", "m4"];

function buildGameForPlay() {
  return createGameWithTrump(modelIds, "hearts");
}

function setHand(
  game: ReturnType<typeof buildGameForPlay>,
  position: "north" | "east" | "south" | "west",
  hand: Card[],
) {
  game.players = game.players.map((p) =>
    p.position === position ? { ...p, hand } : p,
  );
}

describe("makeCardPlayDecision fallbacks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AI_GATEWAY_API_KEY = "test-key";
  });

  it("auto-plays when only one legal card", async () => {
    const game = buildGameForPlay();
    // Lead with north so east must follow suit, but give east only one lead-suit card
    const lead = game.currentTrick.leadPlayer;
    game.currentTrick = {
      leadPlayer: lead,
      plays: [{ player: lead, card: { suit: "hearts", rank: "ace" } }],
      winner: undefined,
    };
    setHand(game, "east", [
      { suit: "hearts", rank: "9" },
      { suit: "spades", rank: "king" },
      { suit: "clubs", rank: "queen" },
      { suit: "diamonds", rank: "10" },
      { suit: "clubs", rank: "jack" },
    ]);

    const result = await makeCardPlayDecision(game, "east", "m2");
    expect((generateObject as any).mock.calls.length).toBe(0);
    expect(result.card).toEqual({ suit: "hearts", rank: "9" });
    expect(result.reasoning).toContain("Only one legal card");
  });

  it("retries on illegal card and falls back to first legal card if still illegal", async () => {
    const game = buildGameForPlay();
    const lead = game.currentTrick.leadPlayer;
    game.currentTrick = {
      leadPlayer: lead,
      plays: [{ player: lead, card: { suit: "hearts", rank: "king" } }],
      winner: undefined,
    };
    const validHearts: Card[] = [
      { suit: "hearts", rank: "9" },
      { suit: "hearts", rank: "queen" },
    ];
    setHand(game, "east", [
      ...validHearts,
      { suit: "clubs", rank: "ace" },
      { suit: "spades", rank: "10" },
      { suit: "diamonds", rank: "ace" },
    ]);

    // Structured output returns illegal card, then still illegal
    (generateObject as any).mockResolvedValueOnce({
      object: { reasoning: "I will play the Ace of Clubs.", rank: "ace", suit: "clubs" },
    });
    (generateObject as any).mockResolvedValueOnce({
      object: { reasoning: "I insist on Ace of Clubs again.", rank: "ace", suit: "clubs" },
    });

    const result: CardPlayResult = await makeCardPlayDecision(game, "east", "m2");

    expect((generateObject as any).mock.calls.length).toBe(2);
    expect(result.card).toEqual(validHearts[0]); // fell back to first legal card
    expect(result.reasoning.toLowerCase()).toContain("fell back");
  });

  it("accepts valid card on retry", async () => {
    const game = buildGameForPlay();
    const lead = game.currentTrick.leadPlayer;
    game.currentTrick = {
      leadPlayer: lead,
      plays: [{ player: lead, card: { suit: "hearts", rank: "king" } }],
      winner: undefined,
    };
    const validHearts: Card[] = [
      { suit: "hearts", rank: "9" },
      { suit: "hearts", rank: "queen" },
    ];
    setHand(game, "east", [
      ...validHearts,
      { suit: "clubs", rank: "ace" },
      { suit: "spades", rank: "10" },
      { suit: "diamonds", rank: "ace" },
    ]);

    // First returns illegal, second returns valid
    (generateObject as any).mockResolvedValueOnce({
      object: { reasoning: "I will play the Ace of Clubs.", rank: "ace", suit: "clubs" },
    });
    (generateObject as any).mockResolvedValueOnce({
      object: { reasoning: "Playing Queen of Hearts.", rank: "queen", suit: "hearts" },
    });

    const result = await makeCardPlayDecision(game, "east", "m2");
    expect((generateObject as any).mock.calls.length).toBe(2);
    expect(result.card).toEqual({ suit: "hearts", rank: "queen" });
  });

  it("falls back when no legal cards computed", async () => {
    const game = buildGameForPlay();
    // Empty east hand to force validCards length 0
    setHand(game, "east", []);
    const result = await makeCardPlayDecision(game, "east", "m2");
    expect(result.reasoning).toContain("No legal cards detected");
  });

  it("returns first valid card when model gives card not in hand", async () => {
    const game = buildGameForPlay();
    const lead = game.currentTrick.leadPlayer;
    game.currentTrick = {
      leadPlayer: lead,
      plays: [{ player: lead, card: { suit: "hearts", rank: "king" } }],
      winner: undefined,
    };
    setHand(game, "east", [
      { suit: "hearts", rank: "9" },
      { suit: "hearts", rank: "jack" },
      { suit: "spades", rank: "ace" },
      { suit: "clubs", rank: "ace" },
      { suit: "diamonds", rank: "ace" },
    ]);

    // Model returns a card not in hand - will trigger retry then fallback
    (generateObject as any).mockResolvedValueOnce({
      object: { reasoning: "Playing something random.", rank: "10", suit: "hearts" },
    });
    (generateObject as any).mockResolvedValueOnce({
      object: { reasoning: "Still playing something random.", rank: "10", suit: "hearts" },
    });

    const result = await makeCardPlayDecision(game, "east", "m2");
    expect(result.card).toEqual({ suit: "hearts", rank: "9" }); // first valid card
  });

  it("accepts a valid first choice without retry", async () => {
    const game = buildGameForPlay();
    const lead = game.currentTrick.leadPlayer;
    game.currentTrick = {
      leadPlayer: lead,
      plays: [{ player: lead, card: { suit: "hearts", rank: "king" } }],
      winner: undefined,
    };
    setHand(game, "east", [
      { suit: "hearts", rank: "9" },
      { suit: "hearts", rank: "jack" },
      { suit: "clubs", rank: "ace" },
      { suit: "spades", rank: "ace" },
      { suit: "diamonds", rank: "ace" },
    ]);

    (generateObject as any).mockResolvedValueOnce({
      object: { reasoning: "Playing Jack of Hearts.", rank: "jack", suit: "hearts" },
    });

    const result = await makeCardPlayDecision(game, "east", "m2");
    expect(result.card).toEqual({ suit: "hearts", rank: "jack" });
    expect((generateObject as any).mock.calls.length).toBe(1);
  });
});

describe("makeTrumpBidDecision parsing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AI_GATEWAY_API_KEY = "test-key";
  });

  it("orders up and marks going alone in round 1", async () => {
    const game = createNewGame(modelIds, "north");
    (generateObject as any).mockResolvedValueOnce({
      object: {
        reasoning: "ORDER UP GOING ALONE, I love this hand.",
        action: "order_up",
        goingAlone: true,
      },
    });

    const result = await makeTrumpBidDecision(game, "east", "m2");
    expect(result.action).toBe("order_up");
    expect(result.goingAlone).toBe(true);
    expect(result.suit).toBeUndefined();
  });

  it("calls a trump suit (not the turned-up suit) in round 2", async () => {
    const game = createNewGame(modelIds, "north");
    game.trumpSelection!.round = 2;
    game.trumpSelection!.turnedUpCard = { suit: "hearts", rank: "9" };
    (generateObject as any).mockResolvedValueOnce({
      object: {
        reasoning: "CALL SPADES and I'm going alone.",
        action: "call_trump",
        suit: "spades",
        goingAlone: true,
      },
    });

    const result = await makeTrumpBidDecision(game, "south", "m3");
    expect(result.action).toBe("call_trump");
    expect(result.suit).toBe("spades");
    expect(result.goingAlone).toBe(true);
  });

  it("passes when action is pass in round 2", async () => {
    const game = createNewGame(modelIds, "north");
    game.trumpSelection!.round = 2;
    game.trumpSelection!.turnedUpCard = { suit: "clubs", rank: "jack" };
    (generateObject as any).mockResolvedValueOnce({
      object: {
        reasoning: "I will pass here.",
        action: "pass",
        goingAlone: false,
      },
    });

    const result = await makeTrumpBidDecision(game, "west", "m4");
    expect(result.action).toBe("pass");
    expect(result.suit).toBeUndefined();
    expect(result.goingAlone).toBe(false);
  });

  it("passes in round 2 with schema that excludes suit field", async () => {
    const game = createNewGame(modelIds, "north");
    game.trumpSelection!.round = 2;
    game.trumpSelection!.turnedUpCard = { suit: "diamonds", rank: "9" };
    // Round 2 pass schema has no suit field - SDK enforces this
    (generateObject as any).mockResolvedValueOnce({
      object: {
        reasoning: "No strong suit, passing.",
        action: "pass",
        goingAlone: false,
      },
    });

    const result = await makeTrumpBidDecision(game, "south", "m3");
    expect(result.action).toBe("pass");
    expect(result.suit).toBeUndefined();
    expect(result.goingAlone).toBe(false);
  });

  it("passes in round 1 when action is pass", async () => {
    const game = createNewGame(modelIds, "north");
    (generateObject as any).mockResolvedValueOnce({
      object: {
        reasoning: "I'll sit this one out and pass.",
        action: "pass",
        goingAlone: false,
      },
    });

    const result = await makeTrumpBidDecision(game, "north", "m1");
    expect(result.action).toBe("pass");
    expect(result.goingAlone).toBe(false);
  });

  it("throws when AI gateway API key is missing", async () => {
    const game = createNewGame(modelIds, "north");
    // Clear cached gateway so it tries to create a new one
    clearGatewayCache();
    delete process.env.AI_GATEWAY_API_KEY;
    await expect(makeTrumpBidDecision(game, "north", "m1")).rejects.toThrow(
      "AI_GATEWAY_API_KEY",
    );
  });

  it("dealer must call trump in round 2 after all pass", async () => {
    const game = createNewGame(modelIds, "north");
    // Set up round 2 with dealer (north) being forced to call
    game.trumpSelection = {
      ...game.trumpSelection!,
      round: 2,
      currentBidder: "north",
      turnedUpCard: { suit: "hearts", rank: "9" },
      bids: [
        // Round 1: all pass
        { player: "east", action: "pass" },
        { player: "south", action: "pass" },
        { player: "west", action: "pass" },
        { player: "north", action: "pass" },
        // Round 2: three passes, dealer must call
        { player: "east", action: "pass" },
        { player: "south", action: "pass" },
        { player: "west", action: "pass" },
      ],
    };

    (generateObject as any).mockResolvedValueOnce({
      object: {
        reasoning: "I must call, choosing spades.",
        action: "call_trump",
        suit: "spades",
        goingAlone: false,
      },
    });

    const result = await makeTrumpBidDecision(game, "north", "m1");
    expect(result.action).toBe("call_trump");
    expect(result.suit).toBe("spades");
    // Verify dealer schema was used (no pass option)
    expect(result.action).not.toBe("pass");
  });
});

describe("makeDiscardDecisionStreaming", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AI_GATEWAY_API_KEY = "test-key";
  });

  it("discards a valid card from hand", async () => {
    const game = createGameWithTrump(modelIds, "hearts");
    // Give dealer 6 cards (after picking up trump)
    const dealerHand: Card[] = [
      { suit: "hearts", rank: "jack" },
      { suit: "hearts", rank: "ace" },
      { suit: "diamonds", rank: "9" },
      { suit: "clubs", rank: "king" },
      { suit: "spades", rank: "queen" },
      { suit: "diamonds", rank: "10" },
    ];
    game.players = game.players.map((p) =>
      p.position === game.dealer ? { ...p, hand: dealerHand } : p,
    );

    const tokens: string[] = [];
    (streamObject as any).mockResolvedValueOnce({
      partialObjectStream: createMockStream([
        { reasoning: "The 9 of diamonds" },
        { reasoning: "The 9 of diamonds is my weakest card." },
      ]),
      object: Promise.resolve({
        reasoning: "The 9 of diamonds is my weakest card.",
        rank: "9",
        suit: "diamonds",
      }),
      usage: Promise.resolve({ promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    });

    const result = await makeDiscardDecisionStreaming(game, "m1", (t) => tokens.push(t));

    expect(result.card).toEqual({ suit: "diamonds", rank: "9" });
    expect(result.reasoning).toContain("weakest");
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("falls back to first card when discard not in hand", async () => {
    const game = createGameWithTrump(modelIds, "hearts");
    const dealerHand: Card[] = [
      { suit: "hearts", rank: "jack" },
      { suit: "hearts", rank: "ace" },
      { suit: "diamonds", rank: "9" },
      { suit: "clubs", rank: "king" },
      { suit: "spades", rank: "queen" },
      { suit: "diamonds", rank: "10" },
    ];
    game.players = game.players.map((p) =>
      p.position === game.dealer ? { ...p, hand: dealerHand } : p,
    );

    (streamObject as any).mockResolvedValueOnce({
      partialObjectStream: createMockStream([]),
      object: Promise.resolve({
        reasoning: "Discarding a card I don't have.",
        rank: "ace", // Ace of spades not in hand
        suit: "spades",
      }),
      usage: Promise.resolve({ promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    });

    const result = await makeDiscardDecisionStreaming(game, "m1", () => {});

    // Should fall back to first card in hand
    expect(result.card).toEqual({ suit: "hearts", rank: "jack" });
  });
});

describe("streaming variants", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AI_GATEWAY_API_KEY = "test-key";
  });

  it("makeTrumpBidDecisionStreaming streams reasoning tokens", async () => {
    const game = createNewGame(modelIds, "north");
    const tokens: string[] = [];

    (streamObject as any).mockResolvedValueOnce({
      partialObjectStream: createMockStream([
        { reasoning: "Looking at " },
        { reasoning: "Looking at my hand, " },
        { reasoning: "Looking at my hand, I have strong hearts." },
      ]),
      object: Promise.resolve({
        reasoning: "Looking at my hand, I have strong hearts.",
        action: "order_up",
        goingAlone: false,
      }),
      usage: Promise.resolve({ promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    });

    const result = await makeTrumpBidDecisionStreaming(
      game,
      "east",
      "m2",
      (t) => tokens.push(t),
    );

    expect(result.action).toBe("order_up");
    expect(tokens.join("")).toContain("Looking at my hand");
  });

  it("makeCardPlayDecisionStreaming auto-plays single card without streaming", async () => {
    const game = buildGameForPlay();
    const lead = game.currentTrick.leadPlayer;
    game.currentTrick = {
      leadPlayer: lead,
      plays: [{ player: lead, card: { suit: "hearts", rank: "ace" } }],
      winner: undefined,
    };
    // Give east only one heart (must follow suit)
    setHand(game, "east", [
      { suit: "hearts", rank: "9" },
      { suit: "spades", rank: "king" },
      { suit: "clubs", rank: "queen" },
      { suit: "diamonds", rank: "10" },
      { suit: "clubs", rank: "jack" },
    ]);

    const tokens: string[] = [];
    const result = await makeCardPlayDecisionStreaming(
      game,
      "east",
      "m2",
      (t) => tokens.push(t),
    );

    expect(result.card).toEqual({ suit: "hearts", rank: "9" });
    expect((streamObject as any).mock.calls.length).toBe(0);
    // Reasoning should be streamed even for auto-play
    expect(tokens.join("")).toContain("Only one legal card");
  });

  it("makeCardPlayDecisionStreaming streams reasoning for multi-card choice", async () => {
    const game = buildGameForPlay();
    // Set up leading position (all cards valid)
    game.currentTrick = {
      leadPlayer: "east",
      plays: [],
      winner: undefined,
    };
    setHand(game, "east", [
      { suit: "hearts", rank: "9" },
      { suit: "hearts", rank: "jack" },
      { suit: "clubs", rank: "ace" },
      { suit: "spades", rank: "ace" },
      { suit: "diamonds", rank: "ace" },
    ]);

    const tokens: string[] = [];
    (streamObject as any).mockResolvedValueOnce({
      partialObjectStream: createMockStream([
        { reasoning: "Leading " },
        { reasoning: "Leading with the right bower." },
      ]),
      object: Promise.resolve({
        reasoning: "Leading with the right bower.",
        rank: "jack",
        suit: "hearts",
      }),
      usage: Promise.resolve({ promptTokens: 100, completionTokens: 50, totalTokens: 150 }),
    });

    const result = await makeCardPlayDecisionStreaming(
      game,
      "east",
      "m2",
      (t) => tokens.push(t),
    );

    expect(result.card).toEqual({ suit: "hearts", rank: "jack" });
    expect(tokens.join("")).toContain("right bower");
  });
});

describe("retry logic", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    process.env.AI_GATEWAY_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries on rate limit error and succeeds", async () => {
    const game = createNewGame(modelIds, "north");

    // First call fails with rate limit, second succeeds
    (generateObject as any)
      .mockRejectedValueOnce(new Error("rate limit exceeded"))
      .mockResolvedValueOnce({
        object: {
          reasoning: "Recovered after rate limit.",
          action: "pass",
          goingAlone: false,
        },
      });

    const resultPromise = makeTrumpBidDecision(game, "east", "m2");

    // Advance past the retry delay
    await vi.advanceTimersByTimeAsync(1000);

    const result = await resultPromise;

    expect(result.action).toBe("pass");
    expect((generateObject as any).mock.calls.length).toBe(2);
  });

  it("retries on 503 error", async () => {
    const game = createNewGame(modelIds, "north");

    (generateObject as any)
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockResolvedValueOnce({
        object: {
          reasoning: "Recovered.",
          action: "order_up",
          goingAlone: false,
        },
      });

    const resultPromise = makeTrumpBidDecision(game, "east", "m2");

    // Advance past the retry delay
    await vi.advanceTimersByTimeAsync(1000);

    const result = await resultPromise;

    expect(result.action).toBe("order_up");
    expect((generateObject as any).mock.calls.length).toBe(2);
  });

  it("throws immediately on non-retryable error", async () => {
    const game = createNewGame(modelIds, "north");

    (generateObject as any).mockRejectedValueOnce(new Error("Invalid API key"));

    await expect(makeTrumpBidDecision(game, "east", "m2")).rejects.toThrow(
      "Invalid API key",
    );
    expect((generateObject as any).mock.calls.length).toBe(1);
  });

  it("throws after max retries exhausted", async () => {
    const game = createNewGame(modelIds, "north");

    // All 3 attempts fail with retryable error
    (generateObject as any)
      .mockRejectedValueOnce(new Error("rate limit"))
      .mockRejectedValueOnce(new Error("rate limit"))
      .mockRejectedValueOnce(new Error("rate limit"));

    // Attach the rejection handler BEFORE advancing timers
    const resultPromise = makeTrumpBidDecision(game, "east", "m2").catch((e) => e);

    // Advance past all retry delays
    await vi.runAllTimersAsync();

    const error = await resultPromise;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("rate limit");
    expect((generateObject as any).mock.calls.length).toBe(3);
  });
});
