import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  makeCardPlayDecision,
  makeTrumpBidDecision,
  type CardPlayResult,
} from "../ai-agent";
import { createGameWithTrump, createNewGame } from "../../../lib/game/game";
import type { Card } from "../../../lib/game/types";

// Mock ai sdk functions for structured output
vi.mock("ai", () => ({
  generateObject: vi.fn(),
  streamObject: vi.fn(),
  createGateway: vi.fn(() => () => ({})),
}));

const { generateObject } = await import("ai");

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
    delete process.env.AI_GATEWAY_API_KEY;
    await expect(makeTrumpBidDecision(game, "north", "m1")).rejects.toThrow(
      "AI_GATEWAY_API_KEY",
    );
  });
});
