import { describe, it, expect } from "vitest";
import { GameError, InvalidPlayError, InvalidGameStateError } from "../errors";
import type { Position, Card } from "../types";

describe("GameError", () => {
  it("should create a game error with code", () => {
    const error = new GameError("Test error", "TEST_CODE");

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.name).toBe("GameError");
  });
});

describe("InvalidPlayError", () => {
  it("should create invalid play error with player and card", () => {
    const player: Position = "north";
    const card: Card = { rank: "ace", suit: "spades" };
    const error = new InvalidPlayError("Invalid play", player, card);

    expect(error).toBeInstanceOf(GameError);
    expect(error.message).toBe("Invalid play");
    expect(error.code).toBe("INVALID_PLAY");
    expect(error.player).toBe(player);
    expect(error.card).toEqual(card);
    expect(error.name).toBe("InvalidPlayError");
  });
});

describe("InvalidGameStateError", () => {
  it("should create invalid game state error", () => {
    const error = new InvalidGameStateError("Invalid state");

    expect(error).toBeInstanceOf(GameError);
    expect(error.message).toBe("Invalid state");
    expect(error.code).toBe("INVALID_GAME_STATE");
    expect(error.name).toBe("InvalidGameStateError");
  });
});
