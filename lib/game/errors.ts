import type { Position, Card, TrumpBidAction } from "./types";

/**
 * Base error class for game-related errors
 */
export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "GameError";
  }
}

/**
 * Error thrown when an invalid play is attempted
 */
export class InvalidPlayError extends GameError {
  constructor(
    message: string,
    public readonly player: Position,
    public readonly card: Card | null,
  ) {
    super(message, "INVALID_PLAY");
    this.name = "InvalidPlayError";
  }
}

/**
 * Error thrown when game state is invalid
 */
export class InvalidGameStateError extends GameError {
  constructor(message: string) {
    super(message, "INVALID_GAME_STATE");
    this.name = "InvalidGameStateError";
  }
}

/**
 * Error thrown when an invalid trump bid is attempted
 */
export class InvalidBidError extends GameError {
  constructor(
    message: string,
    public readonly player: Position,
    public readonly action: TrumpBidAction,
  ) {
    super(message, "INVALID_BID");
    this.name = "InvalidBidError";
  }
}
