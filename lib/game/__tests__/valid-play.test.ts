import { describe, it, expect } from "vitest";
import {
  createGameWithTrump,
  createNewGame,
  getValidCardsForPlay,
  validatePlay,
  getNextPlayer,
} from "../game";
import type { Card } from "../types";

const modelIds: [string, string, string, string] = ["m1", "m2", "m3", "m4"];

describe("getValidCardsForPlay / validatePlay", () => {
  it("allows any card when leading a trick", () => {
    const game = createGameWithTrump(modelIds, "hearts");
    const leader = game.currentTrick.leadPlayer;
    const valid = getValidCardsForPlay(game, leader);
    expect(valid).toEqual(
      game.players.find((p) => p.position === leader)!.hand,
    );
  });

  it("requires following suit when possible (including left bower)", () => {
    // Force a lead that sets diamonds, ensure a player with both follows suit
    let game = createGameWithTrump(modelIds, "hearts");
    const leadCard: Card = { suit: "diamonds", rank: "10" };
    game = {
      ...game,
      currentTrick: {
        leadPlayer: "north",
        plays: [{ player: "north", card: leadCard }],
        winner: undefined,
      },
    };

    // Set east hand with both lead suit and off-suit cards
    const eastHand: Card[] = [
      { suit: "diamonds", rank: "ace" },
      { suit: "spades", rank: "queen" },
      { suit: "clubs", rank: "jack" },
      { suit: "hearts", rank: "9" },
      { suit: "hearts", rank: "jack" }, // left bower for hearts trump -> counts as hearts, not diamonds
    ];
    game.players = game.players.map((p) =>
      p.position === "east" ? { ...p, hand: eastHand } : p,
    );

    const valid = getValidCardsForPlay(game, "east");
    expect(valid).toEqual([{ suit: "diamonds", rank: "ace" }]);

    // Validate that playing off-suit is rejected
    const currentHand = game.players.find((p) => p.position === "east")!.hand;
    const offSuit = currentHand.find((c) => c.suit !== "diamonds")!;
    const badPlay = validatePlay(offSuit, "east", {
      ...game,
      currentTrick: {
        leadPlayer: "north",
        plays: [{ player: "north", card: leadCard }],
        winner: undefined,
      },
    });
    expect(badPlay.valid).toBe(false);
    expect(badPlay.error).toContain("Must follow suit");

    // Valid follow
    const goodPlay = validatePlay({ suit: "diamonds", rank: "ace" }, "east", {
      ...game,
      currentTrick: {
        leadPlayer: "north",
        plays: [{ player: "north", card: leadCard }],
        winner: undefined,
      },
    });
    expect(goodPlay.valid).toBe(true);
  });

  it("allows any card when void in lead suit", () => {
    let game = createGameWithTrump(modelIds, "clubs");
    const leadCard: Card = { suit: "hearts", rank: "queen" };
    game = {
      ...game,
      currentTrick: {
        leadPlayer: "west",
        plays: [{ player: "west", card: leadCard }],
        winner: undefined,
      },
    };

    // South has no hearts
    const southHand: Card[] = [
      { suit: "clubs", rank: "ace" },
      { suit: "clubs", rank: "jack" }, // right bower
      { suit: "diamonds", rank: "9" },
      { suit: "spades", rank: "10" },
      { suit: "spades", rank: "ace" },
    ];
    game.players = game.players.map((p) =>
      p.position === "south" ? { ...p, hand: southHand } : p,
    );

    const valid = getValidCardsForPlay(game, "south");
    expect(valid).toEqual(southHand);
  });

  it("respects turn order via getNextPlayer + validatePlay", () => {
    const game = createGameWithTrump(modelIds, "spades");
    const expected = getNextPlayer(game);
    const wrongPlayer = expected === "north" ? "south" : "north";
    const playerHand = game.players.find(
      (p) => p.position === wrongPlayer,
    )!.hand;
    const check = validatePlay(playerHand[0], wrongPlayer, game);
    expect(check.valid).toBe(false);
    expect(check.error).toContain("Not");
  });

  it("rejects plays when not in playing phase or without trump", () => {
    const game = createGameWithTrump(modelIds, "hearts");
    // Move to trump selection to simulate wrong phase
    const notPlayingGame = { ...game, phase: "trump_selection" as const };
    const player = notPlayingGame.players[0];
    const card = player.hand[0];
    const notPlaying = validatePlay(card, player.position, notPlayingGame);
    expect(notPlaying.valid).toBe(false);
    expect(notPlaying.error).toContain("Not in playing phase");

    const noTrumpGame = {
      ...game,
      trump: undefined,
      phase: "playing" as const,
    };
    const noTrump = validatePlay(card, player.position, noTrumpGame as any);
    expect(noTrump.valid).toBe(false);
    expect(noTrump.error).toContain("Trump has not been set");
  });

  it("returns empty valid cards for missing player and returns hand when not in playing phase", () => {
    const game = createNewGame(modelIds, "north");
    const missing = getValidCardsForPlay(game, "ghost" as any);
    expect(missing).toEqual([]);

    const handWhenNotPlaying = getValidCardsForPlay(
      game,
      game.players[0].position,
    );
    expect(handWhenNotPlaying).toEqual(game.players[0].hand);
  });
});
