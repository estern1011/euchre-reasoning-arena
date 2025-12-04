import { describe, it, expect } from "vitest";
import {
  createNewGame,
  makeTrumpBid,
  formatTrumpSelectionForAI,
  formatGameStateForAI,
} from "../game";
import { InvalidGameStateError } from "../errors";

const modelIds: [string, string, string, string] = ["m1", "m2", "m3", "m4"];

describe("formatTrumpSelectionForAI", () => {
  it("renders bid history with passes, order ups, and call trump with going alone", () => {
    const game = createNewGame(modelIds, "north");

    // Manually craft bids covering pass, order up, and call trump
    game.trumpSelection = {
      ...game.trumpSelection!,
      round: 2,
      currentBidder: "west",
      bids: [
        { player: "east", action: "pass" },
        { player: "south", action: "order_up", goingAlone: true },
        { player: "north", action: "order_up", goingAlone: false },
        { player: "west", action: "pass" },
        { player: "north", action: "pass" },
        {
          player: "east",
          action: "call_trump",
          suit: "spades",
          goingAlone: true,
        },
        {
          player: "south",
          action: "call_trump",
          suit: "clubs",
          goingAlone: false,
        },
      ],
    };

    const text = formatTrumpSelectionForAI(game, "west");
    expect(text).toContain("order_up");
    expect(text).toContain("call_trump spades");
    expect(text).toContain("(alone)");
    expect(text).toContain("pass");
  });

  it("shows '(none yet)' when there are no bids", () => {
    const game = createNewGame(modelIds, "north");
    const text = formatTrumpSelectionForAI(game, "north");
    expect(text).toContain("(none yet)");
  });
});

describe("makeTrumpBid invalid states", () => {
  it("throws when there is no next bidder (invalid trump selection state)", () => {
    const game = createNewGame(modelIds, "north");
    // Craft an invalid state: round 2 already has 8 bids (complete), but we call makeTrumpBid again
    game.trumpSelection = {
      ...game.trumpSelection!,
      round: 2,
      currentBidder: "north",
      bids: [
        { player: "north", action: "pass" },
        { player: "east", action: "pass" },
        { player: "south", action: "pass" },
        { player: "west", action: "pass" },
        { player: "north", action: "pass" },
        { player: "east", action: "pass" },
        { player: "south", action: "pass" },
        { player: "west", action: "pass" },
      ],
    };

    expect(() => makeTrumpBid(game, "north", "pass")).toThrow(
      InvalidGameStateError,
    );
  });
});

describe("formatGameStateForAI", () => {
  it("includes 'not set' when trump is unset", () => {
    const game = createNewGame(modelIds, "north");
    const text = formatGameStateForAI(game, "north");
    expect(text).toContain("not set");
  });
});
