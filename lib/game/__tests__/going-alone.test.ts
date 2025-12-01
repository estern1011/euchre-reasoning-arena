import { describe, it, expect } from "vitest";
import { createGameWithTrump, getNextPlayer, playCard } from "../game";
import type { Card } from "../types";

const modelIds: [string, string, string, string] = ["m1", "m2", "m3", "m4"];

describe("going alone flow", () => {
  it("skips partner when determining next player", () => {
    const game = createGameWithTrump(modelIds, "hearts");
    game.goingAlone = "north";

    // Lead with north to start trick
    game.currentTrick = {
      leadPlayer: "north",
      plays: [{ player: "north", card: { suit: "hearts", rank: "ace" } }],
      winner: undefined,
    };

    const next = getNextPlayer(game);
    expect(next).toBe("east"); // skips south (partner)
  });

  it("completes a trick with only 3 plays when going alone", () => {
    let game = createGameWithTrump(modelIds, "clubs");
    game.goingAlone = "north";

    // Give everyone a clubs card to follow suit
    const northCard: Card = { suit: "clubs", rank: "ace" };
    const eastCard: Card = { suit: "clubs", rank: "king" };
    const westCard: Card = { suit: "clubs", rank: "queen" };
    game.players = game.players.map((p) => {
      if (p.position === "north") return { ...p, hand: [northCard] };
      if (p.position === "east") return { ...p, hand: [eastCard] };
      if (p.position === "west") return { ...p, hand: [westCard] };
      // partner (south) is skipped in going alone
      return { ...p, hand: [{ suit: "spades", rank: "9" }] };
    });

    game.currentTrick = {
      leadPlayer: "north",
      plays: [],
      winner: undefined,
    };

    // Play three cards; should complete the trick with expectedPlays=3
    game = playCard(game, "north", northCard);
    game = playCard(game, "east", eastCard);
    game = playCard(game, "west", westCard);

    expect(game.completedTricks.length).toBe(1);
    expect(game.currentTrick.plays.length).toBe(0); // new trick started
  });

  it("handles missing going-alone player gracefully", () => {
    const game = createGameWithTrump(modelIds, "clubs");
    game.goingAlone = "ghost" as any;
    game.currentTrick = {
      leadPlayer: "north",
      plays: [{ player: "north", card: { suit: "clubs", rank: "ace" } }],
      winner: undefined,
    };
    const next = getNextPlayer(game);
    expect(next).toBeDefined();
  });
});
