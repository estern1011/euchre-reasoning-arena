import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  makeCardPlayDecision,
  makeTrumpBidDecision,
  type CardPlayResult,
} from "../ai-agent";
import { createGameWithTrump, createNewGame } from "../../../lib/game/game";
import type { Card } from "../../../lib/game/types";

// Mock ai sdk functions
vi.mock("ai", () => ({
  generateText: vi.fn(),
  createGateway: vi.fn(() => () => ({})),
}));

const { generateText } = await import("ai");

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
    expect((generateText as any).mock.calls.length).toBe(0);
    expect(result.card).toEqual({ suit: "hearts", rank: "9" });
    expect(result.reasoning).toContain("Only one legal card");
  });

  it("retries on illegal card and falls back to first legal card if still illegal", async () => {
    const game = buildGameForPlay();
    // Lead with north (hearts), give east multiple hearts so valid cards exist
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

    // First response chooses an illegal card; second also illegal
    (generateText as any).mockResolvedValueOnce({
      text: "I will play the Ace of Clubs.",
    });
    (generateText as any).mockResolvedValueOnce({
      text: "I insist on Ace of Clubs again.",
    });

    const result: CardPlayResult = await makeCardPlayDecision(
      game,
      "east",
      "m2",
    );

    expect((generateText as any).mock.calls.length).toBe(2);
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

    (generateText as any).mockResolvedValueOnce({
      text: "I will play the Ace of Clubs.",
    });
    (generateText as any).mockResolvedValueOnce({
      text: "Playing Queen of Hearts.",
    });

    const result = await makeCardPlayDecision(game, "east", "m2");
    expect((generateText as any).mock.calls.length).toBe(2);
    expect(result.card).toEqual({ suit: "hearts", rank: "queen" });
  });

  it("falls back when no legal cards computed", async () => {
    const game = buildGameForPlay();
    // Empty east hand to force validCards length 0
    setHand(game, "east", []);
    const result = await makeCardPlayDecision(game, "east", "m2");
    expect(result.reasoning).toContain("No legal cards detected");
  });

  it("returns first valid card when model gives no recognizable card", async () => {
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

    (generateText as any).mockResolvedValueOnce({
      text: "I cannot decide, maybe something else entirely.",
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

    (generateText as any).mockResolvedValueOnce({
      text: "Playing Jack of Hearts.",
    });

    const result = await makeCardPlayDecision(game, "east", "m2");
    expect(result.card).toEqual({ suit: "hearts", rank: "jack" });
    expect((generateText as any).mock.calls.length).toBe(1);
  });
});

describe("makeTrumpBidDecision parsing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AI_GATEWAY_API_KEY = "test-key";
  });

  it("orders up and marks going alone in round 1", async () => {
    const game = createNewGame(modelIds, "north");
    (generateText as any).mockResolvedValueOnce({
      text: "ORDER UP GOING ALONE, I love this hand.",
    });

    const result = await makeTrumpBidDecision(game, "east", "m2");
    expect(result.action).toBe("order_up");
    expect(result.goingAlone).toBe(true);
    expect(result.suit).toBeUndefined();
  });

  it("calls a trump suit (not the turned-up suit) in round 2", async () => {
    const game = createNewGame(modelIds, "north");
    game.trumpSelection!.round = 2;
    // Ensure turned-up suit is different from what we will call
    game.trumpSelection!.turnedUpCard = { suit: "hearts", rank: "9" };
    (generateText as any).mockResolvedValueOnce({
      text: "CALL SPADES and I'm going alone.",
    });

    const result = await makeTrumpBidDecision(game, "south", "m3");
    expect(result.action).toBe("call_trump");
    expect(result.suit).toBe("spades");
    expect(result.goingAlone).toBe(true);
  });

  it("passes when no suit is chosen in round 2", async () => {
    const game = createNewGame(modelIds, "north");
    game.trumpSelection!.round = 2;
    game.trumpSelection!.turnedUpCard = { suit: "clubs", rank: "jack" };
    (generateText as any).mockResolvedValueOnce({
      text: "I will pass here.",
    });

    const result = await makeTrumpBidDecision(game, "west", "m4");
    expect(result.action).toBe("pass");
    expect(result.suit).toBeUndefined();
    expect(result.goingAlone).toBe(false);
  });

  it("passes in round 1 when no order up text", async () => {
    const game = createNewGame(modelIds, "north");
    (generateText as any).mockResolvedValueOnce({
      text: "I'll sit this one out and pass.",
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
