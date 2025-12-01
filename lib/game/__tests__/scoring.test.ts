import { describe, it, expect } from "vitest";
import {
  calculateScores,
  determineTrickWinner,
  createGameWithTrump,
} from "../game";
import type { Trick, Position } from "../types";

const modelIds: [string, string, string, string] = ["m1", "m2", "m3", "m4"];

function trick(winner: Position): Trick {
  return {
    leadPlayer: winner,
    plays: [
      { player: winner, card: { suit: "hearts", rank: "ace" } },
      { player: "north", card: { suit: "clubs", rank: "9" } },
      { player: "south", card: { suit: "spades", rank: "9" } },
      { player: "west", card: { suit: "diamonds", rank: "9" } },
    ],
    winner,
  };
}

describe("calculateScores", () => {
  it("awards 2 points for a march while going alone", () => {
    const game = createGameWithTrump(modelIds, "spades");
    game.trumpCaller = "east";
    game.goingAlone = "east";

    const completed = [
      trick("east"),
      trick("east"),
      trick("east"),
      trick("east"),
      trick("east"),
    ];
    const scores = calculateScores(game, completed);
    expect(scores).toEqual([0, 4]); // team1 march going alone
  });

  it("awards 2 points to defenders when makers are euchred", () => {
    const game = createGameWithTrump(modelIds, "hearts");
    game.trumpCaller = "east"; // team1 makers
    game.goingAlone = null;
    const completed = [
      trick("south"),
      trick("south"),
      trick("east"),
      trick("east"),
      trick("south"),
    ];
    const scores = calculateScores(game, completed);
    expect(scores).toEqual([2, 0]); // defenders (team0) euchre
  });
});

describe("determineTrickWinner validation", () => {
  it("throws when trick is incomplete", () => {
    const incomplete = {
      leadPlayer: "north" as const,
      plays: [
        { player: "north" as const, card: { suit: "clubs", rank: "ace" } },
      ],
      winner: undefined,
    };
    expect(() =>
      determineTrickWinner(incomplete as any, "clubs", false),
    ).toThrow(/must have 4 plays/);
  });
});
