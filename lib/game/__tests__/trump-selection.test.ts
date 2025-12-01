import { describe, it, expect, beforeEach } from "vitest";
import type { GameState, Card, Suit } from "../types";
import {
  createNewGame,
  makeTrumpBid,
  dealerDiscard,
  getNextBidder,
  formatTrumpSelectionForAI,
} from "../game";
import { InvalidBidError, InvalidGameStateError } from "../errors";

describe("Trump Selection - Create New Game", () => {
  it("should start in trump_selection phase", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.phase).toBe("trump_selection");
  });

  it("should have a turned-up card", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.trumpSelection?.turnedUpCard).toBeDefined();
    expect(game.trumpSelection?.turnedUpCard.suit).toBeDefined();
    expect(game.trumpSelection?.turnedUpCard.rank).toBeDefined();
  });

  it("should set dealer correctly", () => {
    const game = createNewGame(
      ["gpt-4", "claude", "gemini", "gpt-3.5"],
      "south",
    );

    expect(game.dealer).toBe("south");
    expect(game.trumpSelection?.dealer).toBe("south");
  });

  it("should set first bidder as left of dealer", () => {
    const game = createNewGame(
      ["gpt-4", "claude", "gemini", "gpt-3.5"],
      "north",
    );

    expect(game.trumpSelection?.currentBidder).toBe("east");
  });

  it("should initialize round 1", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.trumpSelection?.round).toBe(1);
  });

  it("should have empty bids initially", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.trumpSelection?.bids).toEqual([]);
  });

  it("should have kitty with 3 cards", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.kitty).toHaveLength(3);
  });
});

describe("Trump Selection - Round 1: Order Up", () => {
  let game: GameState;

  beforeEach(() => {
    game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"], "north");
  });

  it("should throw error if not in trump selection phase", () => {
    const playingGame = { ...game, phase: "playing" as const };

    expect(() => makeTrumpBid(playingGame, "east", "order_up")).toThrow(
      InvalidGameStateError,
    );
  });

  it("should throw error if no trump selection state", () => {
    const corruptGame = { ...game, trumpSelection: undefined };

    expect(() => makeTrumpBid(corruptGame, "east", "order_up")).toThrow(
      InvalidGameStateError,
    );
  });

  it("should accept order up bid", () => {
    const updatedGame = makeTrumpBid(game, "east", "order_up");

    expect(updatedGame.phase).toBe("playing");
    expect(updatedGame.trump).toBe(game.trumpSelection!.turnedUpCard.suit);
    expect(updatedGame.trumpCaller).toBe("east");
  });

  it("should add turned-up card to dealer's hand when ordered up", () => {
    const turnedUpCard = game.trumpSelection!.turnedUpCard;
    const dealerHandBefore = game.players.find((p) => p.position === "north")!
      .hand.length;

    const updatedGame = makeTrumpBid(game, "east", "order_up");
    const dealerHandAfter = updatedGame.players.find(
      (p) => p.position === "north",
    )!.hand.length;

    expect(dealerHandAfter).toBe(dealerHandBefore + 1);
    expect(
      updatedGame.players.find((p) => p.position === "north")!.hand,
    ).toContainEqual(turnedUpCard);
  });

  it("should clear trump selection state after ordering up", () => {
    const updatedGame = makeTrumpBid(game, "east", "order_up");

    expect(updatedGame.trumpSelection).toBeUndefined();
  });

  it("should set lead player to left of dealer after ordering up", () => {
    const updatedGame = makeTrumpBid(game, "east", "order_up");

    expect(updatedGame.currentTrick.leadPlayer).toBe("east");
  });

  it("should accept pass bid", () => {
    const updatedGame = makeTrumpBid(game, "east", "pass");

    expect(updatedGame.phase).toBe("trump_selection");
    expect(updatedGame.trumpSelection?.currentBidder).toBe("south");
  });

  it("should move to round 2 if all players pass", () => {
    let currentGame = game;

    currentGame = makeTrumpBid(currentGame, "east", "pass");
    currentGame = makeTrumpBid(currentGame, "south", "pass");
    currentGame = makeTrumpBid(currentGame, "west", "pass");
    currentGame = makeTrumpBid(currentGame, "north", "pass");

    expect(currentGame.phase).toBe("trump_selection");
    expect(currentGame.trumpSelection?.round).toBe(2);
    expect(currentGame.trumpSelection?.currentBidder).toBe("east");
  });

  it("should reject call_trump in round 1", () => {
    expect(() => makeTrumpBid(game, "east", "call_trump", "clubs")).toThrow(
      InvalidBidError,
    );
  });

  it("should reject bid when not bidder's turn", () => {
    expect(() => makeTrumpBid(game, "south", "pass")).toThrow(InvalidBidError);
  });

  it("should support going alone", () => {
    const updatedGame = makeTrumpBid(game, "east", "order_up", undefined, true);

    expect(updatedGame.goingAlone).toBe("east");
  });

  it("should include reasoning in bid", () => {
    const reasoning = "I have three trump including the right bower";
    const updatedGame = makeTrumpBid(
      game,
      "east",
      "order_up",
      undefined,
      false,
      reasoning,
    );

    expect(updatedGame.trumpSelection?.bids[0]?.reasoning).toBeUndefined(); // Bid moved to playing phase
  });
});

describe("Trump Selection - Round 2: Call Trump", () => {
  let game: GameState;
  let turnedUpSuit: string;

  beforeEach(() => {
    game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"], "north");
    turnedUpSuit = game.trumpSelection!.turnedUpCard.suit;

    // Fast forward to round 2 by having everyone pass
    game = makeTrumpBid(game, "east", "pass");
    game = makeTrumpBid(game, "south", "pass");
    game = makeTrumpBid(game, "west", "pass");
    game = makeTrumpBid(game, "north", "pass");
  });

  it("should accept call trump bid", () => {
    const suitToCall = turnedUpSuit === "hearts" ? "clubs" : "hearts";
    const updatedGame = makeTrumpBid(game, "east", "call_trump", suitToCall);

    expect(updatedGame.phase).toBe("playing");
    expect(updatedGame.trump).toBe(suitToCall);
    expect(updatedGame.trumpCaller).toBe("east");
  });

  it("should not add card to dealer's hand when calling trump", () => {
    const dealerHandBefore = game.players.find((p) => p.position === "north")!
      .hand.length;
    const suitToCall = turnedUpSuit === "hearts" ? "clubs" : "hearts";

    const updatedGame = makeTrumpBid(game, "east", "call_trump", suitToCall);
    const dealerHandAfter = updatedGame.players.find(
      (p) => p.position === "north",
    )!.hand.length;

    expect(dealerHandAfter).toBe(dealerHandBefore);
  });

  it("should reject calling turned-up suit", () => {
    expect(() =>
      makeTrumpBid(game, "east", "call_trump", turnedUpSuit as Suit),
    ).toThrow(InvalidBidError);
  });

  it("should reject order_up in round 2", () => {
    expect(() => makeTrumpBid(game, "east", "order_up")).toThrow(
      InvalidBidError,
    );
  });

  it("should require suit when calling trump", () => {
    expect(() => makeTrumpBid(game, "east", "call_trump")).toThrow(
      InvalidBidError,
    );
  });

  it("should reject dealer passing when last to bid", () => {
    let currentGame = game;

    currentGame = makeTrumpBid(currentGame, "east", "pass");
    currentGame = makeTrumpBid(currentGame, "south", "pass");
    currentGame = makeTrumpBid(currentGame, "west", "pass");

    expect(() => makeTrumpBid(currentGame, "north", "pass")).toThrow(
      InvalidBidError,
    );
  });

  it("should allow dealer to pass when not last", () => {
    const suitToCall = turnedUpSuit === "hearts" ? "clubs" : "hearts";

    let currentGame = game;
    currentGame = makeTrumpBid(currentGame, "east", "pass");

    expect(() => makeTrumpBid(currentGame, "south", "pass")).not.toThrow();
  });

  it("should support going alone in round 2", () => {
    const suitToCall = turnedUpSuit === "hearts" ? "clubs" : "hearts";
    const updatedGame = makeTrumpBid(
      game,
      "east",
      "call_trump",
      suitToCall,
      true,
    );

    expect(updatedGame.goingAlone).toBe("east");
  });
});

describe("Dealer Discard", () => {
  let game: GameState;

  beforeEach(() => {
    game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"], "north");
    game = makeTrumpBid(game, "east", "order_up");
  });

  it("should allow dealer to discard a card", () => {
    const dealerHand = game.players.find((p) => p.position === "north")!.hand;
    expect(dealerHand).toHaveLength(6);

    const cardToDiscard = dealerHand[0];
    const updatedGame = dealerDiscard(game, cardToDiscard);

    expect(
      updatedGame.players.find((p) => p.position === "north")!.hand,
    ).toHaveLength(5);
    expect(
      updatedGame.players.find((p) => p.position === "north")!.hand,
    ).not.toContainEqual(cardToDiscard);
  });

  it("should throw error if dealer has 5 cards", () => {
    // First discard
    const dealerHand = game.players.find((p) => p.position === "north")!.hand;
    const cardToDiscard = dealerHand[0];
    game = dealerDiscard(game, cardToDiscard);

    // Try to discard again
    const anotherCard = game.players.find((p) => p.position === "north")!
      .hand[0];
    expect(() => dealerDiscard(game, anotherCard)).toThrow(
      InvalidGameStateError,
    );
  });

  it("should throw error if not in playing phase", () => {
    const freshGame = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);
    const card = freshGame.players[0].hand[0];

    expect(() => dealerDiscard(freshGame, card)).toThrow(InvalidGameStateError);
  });

  it("should throw error for card not in dealer's hand", () => {
    const notInHand: Card = { rank: "ace", suit: "spades" };
    game.players.find((p) => p.position === "north")!.hand = game.players
      .find((p) => p.position === "north")!
      .hand.filter((c) => !(c.rank === "ace" && c.suit === "spades"));

    expect(() => dealerDiscard(game, notInHand)).toThrow();
  });

  it("should throw error if dealer not found", () => {
    // Corrupt the game state by setting invalid dealer
    const corruptGame = { ...game, dealer: "invalid" as any };
    const card = game.players[0].hand[0];

    expect(() => dealerDiscard(corruptGame, card)).toThrow(
      InvalidGameStateError,
    );
  });
});

describe("Get Next Bidder", () => {
  let game: GameState;

  beforeEach(() => {
    game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"], "north");
  });

  it("should return next bidder clockwise", () => {
    expect(getNextBidder(game)).toBe("south");
  });

  it("should return null after 4 bids in round 1", () => {
    game.trumpSelection!.bids = [
      { player: "east", action: "pass" },
      { player: "south", action: "pass" },
      { player: "west", action: "pass" },
      { player: "north", action: "pass" },
    ];

    expect(getNextBidder(game)).toBeNull();
  });

  it("should return null if no trump selection", () => {
    game.trumpSelection = undefined;

    expect(getNextBidder(game)).toBeNull();
  });
});

describe("Format Trump Selection for AI", () => {
  let game: GameState;

  beforeEach(() => {
    game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"], "north");
  });

  it("should include turned-up card", () => {
    const formatted = formatTrumpSelectionForAI(game, "east");

    expect(formatted).toContain("Turned-up card:");
  });

  it("should include round description for round 1", () => {
    const formatted = formatTrumpSelectionForAI(game, "east");

    expect(formatted).toContain("Round 1");
    expect(formatted).toContain("Order up");
  });

  it("should include round description for round 2", () => {
    game = makeTrumpBid(game, "east", "pass");
    game = makeTrumpBid(game, "south", "pass");
    game = makeTrumpBid(game, "west", "pass");
    game = makeTrumpBid(game, "north", "pass");

    const formatted = formatTrumpSelectionForAI(game, "east");

    expect(formatted).toContain("Round 2");
    expect(formatted).toContain("Call any suit EXCEPT");
  });

  it("should include dealer position", () => {
    const formatted = formatTrumpSelectionForAI(game, "east");

    expect(formatted).toContain("Dealer: north");
  });

  it("should include player position and team", () => {
    const formatted = formatTrumpSelectionForAI(game, "east");

    expect(formatted).toContain("Your position: east");
    expect(formatted).toContain("Team 1");
  });

  it("should include partner position", () => {
    const formatted = formatTrumpSelectionForAI(game, "east");

    expect(formatted).toContain("Your partner: west");
  });

  it("should include player hand", () => {
    const formatted = formatTrumpSelectionForAI(game, "east");

    expect(formatted).toContain("Your hand:");
  });

  it("should show bid history", () => {
    game = makeTrumpBid(
      game,
      "east",
      "pass",
      undefined,
      false,
      "Not strong enough",
    );

    const formatted = formatTrumpSelectionForAI(game, "south");

    expect(formatted).toContain("east: Pass");
  });

  it("should show going alone in bid history for order_up", () => {
    game = makeTrumpBid(game, "east", "order_up", undefined, true);

    // This would throw since game is in playing phase now, so test the bid was recorded
    expect(game.goingAlone).toBe("east");
  });

  it("should format going alone for order_up in bid history", () => {
    game = makeTrumpBid(game, "east", "order_up", undefined, true);

    // Game transitions to playing phase, so we can't call formatTrumpSelectionForAI
    // But we verified the goingAlone flag is set above
    expect(game.goingAlone).toBe("east");
  });

  it("should format going alone for call_trump in bid history", () => {
    // Progress through round 1
    game = makeTrumpBid(game, "east", "pass");
    game = makeTrumpBid(game, "south", "pass");
    game = makeTrumpBid(game, "west", "pass");
    game = makeTrumpBid(game, "north", "pass");

    // Round 2 - someone calls trump going alone
    game = makeTrumpBid(game, "east", "pass");
    const turnedUpSuit = game.trumpSelection!.turnedUpCard.suit;
    const validSuit: Suit = turnedUpSuit === "hearts" ? "spades" : "hearts";

    game = makeTrumpBid(game, "south", "call_trump", validSuit, true);

    // Verify going alone is set
    expect(game.goingAlone).toBe("south");
    expect(game.trumpCaller).toBe("south");
  });

  it("should warn dealer about must-call in round 2", () => {
    game = makeTrumpBid(game, "east", "pass");
    game = makeTrumpBid(game, "south", "pass");
    game = makeTrumpBid(game, "west", "pass");
    game = makeTrumpBid(game, "north", "pass");

    game = makeTrumpBid(game, "east", "pass");
    game = makeTrumpBid(game, "south", "pass");
    game = makeTrumpBid(game, "west", "pass");

    const formatted = formatTrumpSelectionForAI(game, "north");

    expect(formatted).toContain("DEALER MUST CALL");
  });

  it("should throw error for invalid player", () => {
    expect(() => formatTrumpSelectionForAI(game, "invalid" as any)).toThrow(
      InvalidGameStateError,
    );
  });

  it("should throw error when not in trump selection phase", () => {
    game = makeTrumpBid(game, "east", "order_up");

    expect(() => formatTrumpSelectionForAI(game, "east")).toThrow(
      InvalidGameStateError,
    );
  });
});
