import { describe, it, expect, beforeEach } from "vitest";
import type { GameState, Card, Position, Trick } from "../types";
import {
  createNewGame,
  createGameWithTrump,
  setTrump,
  getLeadSuit,
  determineTrickWinner,
  validatePlay,
  getNextPlayer,
  playCard,
  calculateScores,
  isGameComplete,
  getWinningTeam,
  formatGameStateForAI,
} from "../game";
import { InvalidGameStateError } from "../errors";

describe("Create New Game", () => {
  it("should create game with 4 players", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.players).toHaveLength(4);
    expect(game.players[0].position).toBe("north");
    expect(game.players[1].position).toBe("east");
    expect(game.players[2].position).toBe("south");
    expect(game.players[3].position).toBe("west");
  });

  it("should assign correct teams", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.players[0].team).toBe(0); // North
    expect(game.players[1].team).toBe(1); // East
    expect(game.players[2].team).toBe(0); // South
    expect(game.players[3].team).toBe(1); // West
  });

  it("should deal 5 cards to each player", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    game.players.forEach((player) => {
      expect(player.hand).toHaveLength(5);
    });
  });

  it("should assign model IDs correctly", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.players[0].modelId).toBe("gpt-4");
    expect(game.players[1].modelId).toBe("claude");
    expect(game.players[2].modelId).toBe("gemini");
    expect(game.players[3].modelId).toBe("gpt-3.5");
  });

  it("should initialize with no trump", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.trump).toBeNull();
  });

  it("should initialize with empty trick history", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.completedTricks).toEqual([]);
    expect(game.currentTrick.plays).toEqual([]);
  });

  it("should start with first bidder as lead player (left of dealer)", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    // With north as dealer (default), first bidder/lead is east
    expect(game.currentTrick.leadPlayer).toBe("east");
  });

  it("should initialize scores to 0-0", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game.scores).toEqual([0, 0]);
  });

  it("should generate unique game ID", () => {
    const game1 = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);
    const game2 = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(game1.id).not.toBe(game2.id);
  });
});

describe("Set Trump", () => {
  it("should set trump suit", () => {
    const game = createGameWithTrump(
      ["gpt-4", "claude", "gemini", "gpt-3.5"],
      "hearts",
    );

    expect(game.trump).toBe("hearts");
  });

  it("should not mutate original game", () => {
    const game1 = createGameWithTrump(
      ["gpt-4", "claude", "gemini", "gpt-3.5"],
      "hearts",
    );
    const game2 = setTrump(game1, "clubs");

    expect(game1.trump).toBe("hearts");
    expect(game2.trump).toBe("clubs");
  });
});

describe("Get Lead Suit", () => {
  it("should return null for empty trick", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [],
      winner: undefined,
    };

    expect(getLeadSuit(trick, "hearts")).toBeNull();
  });

  it("should return suit of first card played", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [{ player: "north", card: { rank: "ace", suit: "spades" } }],
      winner: undefined,
    };

    expect(getLeadSuit(trick, "hearts")).toBe("spades");
  });

  it("should handle left bower as trump suit", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [
        { player: "north", card: { rank: "jack", suit: "diamonds" } }, // Left bower when hearts is trump
      ],
      winner: undefined,
    };

    expect(getLeadSuit(trick, "hearts")).toBe("hearts");
  });
});

describe("Determine Trick Winner", () => {
  it("should correctly identify winner with trump", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [
        { player: "north", card: { rank: "ace", suit: "spades" } },
        { player: "east", card: { rank: "9", suit: "hearts" } }, // Trump
        { player: "south", card: { rank: "king", suit: "spades" } },
        { player: "west", card: { rank: "queen", suit: "spades" } },
      ],
      winner: undefined,
    };

    expect(determineTrickWinner(trick, "hearts")).toBe("east");
  });

  it("should correctly identify winner when following suit", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [
        { player: "north", card: { rank: "10", suit: "spades" } },
        { player: "east", card: { rank: "ace", suit: "spades" } }, // Highest spade
        { player: "south", card: { rank: "king", suit: "spades" } },
        { player: "west", card: { rank: "queen", suit: "clubs" } }, // Didn't follow
      ],
      winner: undefined,
    };

    expect(determineTrickWinner(trick, "hearts")).toBe("east");
  });

  it("should right bower beat left bower", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [
        { player: "north", card: { rank: "jack", suit: "hearts" } }, // Right bower
        { player: "east", card: { rank: "jack", suit: "diamonds" } }, // Left bower
        { player: "south", card: { rank: "ace", suit: "hearts" } },
        { player: "west", card: { rank: "king", suit: "hearts" } },
      ],
      winner: undefined,
    };

    expect(determineTrickWinner(trick, "hearts")).toBe("north");
  });

  it("should throw error for incomplete trick", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [{ player: "north", card: { rank: "ace", suit: "spades" } }],
      winner: undefined,
    };

    expect(() => determineTrickWinner(trick, "hearts")).toThrow();
  });

  it("should determine winner for 3-card trick when going alone", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [
        { player: "north", card: { rank: "10", suit: "spades" } },
        { player: "east", card: { rank: "ace", suit: "spades" } }, // Highest spade
        { player: "south", card: { rank: "king", suit: "spades" } },
        // West skipped (partner of going alone player)
      ],
      winner: undefined,
    };

    expect(determineTrickWinner(trick, "hearts", true)).toBe("east");
  });

  it("should throw error for 4-card trick when expecting going alone", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [
        { player: "north", card: { rank: "ace", suit: "spades" } },
        { player: "east", card: { rank: "9", suit: "hearts" } },
        { player: "south", card: { rank: "king", suit: "spades" } },
        { player: "west", card: { rank: "queen", suit: "spades" } },
      ],
      winner: undefined,
    };

    expect(() => determineTrickWinner(trick, "hearts", true)).toThrow(
      InvalidGameStateError,
    );
  });

  it("should throw error for 3-card trick when not going alone", () => {
    const trick: Trick = {
      leadPlayer: "north",
      plays: [
        { player: "north", card: { rank: "ace", suit: "spades" } },
        { player: "east", card: { rank: "9", suit: "hearts" } },
        { player: "south", card: { rank: "king", suit: "spades" } },
      ],
      winner: undefined,
    };

    expect(() => determineTrickWinner(trick, "hearts", false)).toThrow(
      InvalidGameStateError,
    );
  });
});

describe("Validate Play", () => {
  let game: GameState;

  beforeEach(() => {
    game = createGameWithTrump(
      ["gpt-4", "claude", "gemini", "gpt-3.5"],
      "hearts",
    );
  });

  it("should reject play when trump not set", () => {
    game.trump = null;
    const card = game.players[0].hand[0];

    const result = validatePlay(card, "north", game);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Trump");
  });

  it("should reject play out of turn", () => {
    const card = game.players[0].hand[0]; // North's card (but east leads)

    const result = validatePlay(card, "north", game);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("turn");
  });

  it("should reject card not in hand", () => {
    // Ensure this card is definitely not in east's hand
    const notInHand: Card = { rank: "ace", suit: "spades" };
    game.players[1].hand = game.players[1].hand.filter(
      (c) => !(c.rank === "ace" && c.suit === "spades"),
    );

    const result = validatePlay(notInHand, "east", game);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("not in hand");
  });

  it("should accept valid lead card", () => {
    const card = game.players[1].hand[0]; // East leads

    const result = validatePlay(card, "east", game);

    expect(result.valid).toBe(true);
  });

  it("should reject play for non-existent player", () => {
    const card = game.players[0].hand[0];
    // Temporarily remove all players to simulate player not found
    const emptyGame = { ...game, players: [] };

    const result = validatePlay(card, "north", emptyGame);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Player not found");
  });

  it("should accept valid play when player can't follow suit", () => {
    // Set up a trick where east led
    game.currentTrick.plays = [
      { player: "east", card: { rank: "ace", suit: "spades" } },
    ];

    // Give south a hand with no spades (can't follow suit)
    game.players[2].hand = [
      { rank: "ace", suit: "hearts" },
      { rank: "king", suit: "diamonds" },
    ];

    const result = validatePlay({ rank: "ace", suit: "hearts" }, "south", game);

    expect(result.valid).toBe(true);
  });

  it("should reject play when player doesn't follow suit but could", () => {
    // Set up a trick where east led spades
    game.currentTrick.plays = [
      { player: "east", card: { rank: "ace", suit: "spades" } },
    ];

    // Give south a hand with spades (can follow suit)
    game.players[2].hand = [
      { rank: "9", suit: "spades" },
      { rank: "king", suit: "diamonds" },
    ];

    // Try to play a non-spade when they have spades
    const result = validatePlay(
      { rank: "king", suit: "diamonds" },
      "south",
      game,
    );

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Must follow suit");
  });
});

describe("Get Next Player", () => {
  let game: GameState;

  beforeEach(() => {
    game = createGameWithTrump(
      ["gpt-4", "claude", "gemini", "gpt-3.5"],
      "hearts",
    );
  });

  it("should return lead player for empty trick", () => {
    // Lead player is east (left of north dealer)
    expect(getNextPlayer(game)).toBe("east");
  });

  it("should proceed clockwise after lead", () => {
    game.currentTrick.plays = [
      { player: "east", card: game.players[1].hand[0] },
    ];

    expect(getNextPlayer(game)).toBe("south");
  });

  it("should handle full rotation", () => {
    game.currentTrick.plays = [
      { player: "east", card: game.players[1].hand[0] },
      { player: "south", card: game.players[2].hand[0] },
      { player: "west", card: game.players[3].hand[0] },
    ];

    expect(getNextPlayer(game)).toBe("north");
  });

  it("should handle non-north lead player", () => {
    game.currentTrick.leadPlayer = "south";
    game.currentTrick.plays = [];

    expect(getNextPlayer(game)).toBe("south");

    game.currentTrick.plays = [
      { player: "south", card: game.players[2].hand[0] },
    ];
    expect(getNextPlayer(game)).toBe("west");
  });

  it("should skip partner when going alone", () => {
    game.goingAlone = "north"; // North going alone
    game.currentTrick.leadPlayer = "east";
    game.currentTrick.plays = [];

    // Normal order: east -> south -> west -> north
    // With north going alone, skip south (north's partner)
    // Order becomes: east -> west -> north

    expect(getNextPlayer(game)).toBe("east"); // Lead player

    game.currentTrick.plays = [
      { player: "east", card: game.players[1].hand[0] },
    ];
    expect(getNextPlayer(game)).toBe("west"); // Skip south (partner of north)

    game.currentTrick.plays.push({
      player: "west",
      card: game.players[3].hand[0],
    });
    expect(getNextPlayer(game)).toBe("north"); // North goes last
  });

  it("should skip partner when going alone from different position", () => {
    game.goingAlone = "east"; // East going alone
    game.trumpCaller = "east";
    game.currentTrick.leadPlayer = "north";
    game.currentTrick.plays = [];

    // Normal order: north -> east -> south -> west
    // With east going alone, skip west (east's partner)
    // Order becomes: north -> east -> south

    expect(getNextPlayer(game)).toBe("north"); // Lead player

    game.currentTrick.plays = [
      { player: "north", card: game.players[0].hand[0] },
    ];
    expect(getNextPlayer(game)).toBe("east");

    game.currentTrick.plays.push({
      player: "east",
      card: game.players[1].hand[0],
    });
    expect(getNextPlayer(game)).toBe("south"); // Skip west (partner)
  });
});

describe("Play Card", () => {
  let game: GameState;

  beforeEach(() => {
    game = createGameWithTrump(
      ["gpt-4", "claude", "gemini", "gpt-3.5"],
      "hearts",
    );
  });

  it("should add card to current trick", () => {
    const card = game.players[1].hand[0]; // East leads
    const updatedGame = playCard(game, "east", card);

    expect(updatedGame.currentTrick.plays).toHaveLength(1);
    expect(updatedGame.currentTrick.plays[0].card).toEqual(card);
    expect(updatedGame.currentTrick.plays[0].player).toBe("east");
  });

  it("should remove card from player hand", () => {
    const card = game.players[1].hand[0]; // East leads
    const updatedGame = playCard(game, "east", card);

    expect(updatedGame.players[1].hand).toHaveLength(4);
    expect(updatedGame.players[1].hand).not.toContainEqual(card);
  });

  it("should include reasoning if provided", () => {
    const card = game.players[1].hand[0]; // East leads
    const reasoning = "This is a strong card";
    const updatedGame = playCard(game, "east", card, reasoning);

    expect(updatedGame.currentTrick.plays[0].reasoning).toBe(reasoning);
  });

  it("should complete trick after 4 plays", () => {
    let currentGame = game;

    // Ensure all players can play without follow suit issues
    currentGame.players.forEach((_, i) => {
      currentGame.players[i].hand = [
        { rank: "ace", suit: "spades" },
        { rank: "king", suit: "spades" },
        { rank: "queen", suit: "spades" },
        { rank: "10", suit: "spades" },
        { rank: "9", suit: "spades" },
      ];
    });

    // Play 4 cards in proper turn order (starting with east)
    for (let i = 0; i < 4; i++) {
      const currentPlayer = getNextPlayer(currentGame);
      const playerIndex = currentGame.players.findIndex(
        (p) => p.position === currentPlayer,
      );
      const card = currentGame.players[playerIndex].hand[0];

      currentGame = playCard(currentGame, currentPlayer, card);
    }

    expect(currentGame.completedTricks).toHaveLength(1);
    expect(currentGame.currentTrick.plays).toHaveLength(0); // New trick started
  });

  it("should not mutate original game", () => {
    const originalTrickCount = game.currentTrick.plays.length;
    const card = game.players[1].hand[0]; // East leads

    playCard(game, "east", card);

    expect(game.currentTrick.plays).toHaveLength(originalTrickCount);
  });

  it("should throw error for invalid play", () => {
    // Ensure this card is definitely not in east's hand
    const notInHand: Card = { rank: "ace", suit: "spades" };
    game.players[1].hand = game.players[1].hand.filter(
      (c) => !(c.rank === "ace" && c.suit === "spades"),
    );

    expect(() => playCard(game, "east", notInHand)).toThrow();
  });
});

describe("Calculate Scores", () => {
  it("should award 1 point to makers winning 3-4 tricks", () => {
    const game = createGameWithTrump(["a", "b", "c", "d"], "hearts");
    game.trumpCaller = "north"; // Team 0 called trump

    const tricks: Trick[] = [
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "east" }, // Team 1
      { leadPlayer: "north", plays: [], winner: "east" }, // Team 1
    ];

    const scores = calculateScores(game, tricks);

    expect(scores).toEqual([1, 0]); // Makers (Team 0) won 3/5 = 1 point
  });

  it("should award 2 points for march (all 5 tricks)", () => {
    const game = createGameWithTrump(["a", "b", "c", "d"], "hearts");
    game.trumpCaller = "north"; // Team 0 called trump

    const tricks: Trick[] = [
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "south" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "south" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
    ];

    const scores = calculateScores(game, tricks);

    expect(scores).toEqual([2, 0]); // March = 2 points
  });

  it("should award 4 points for going alone march", () => {
    const game = createGameWithTrump(["a", "b", "c", "d"], "hearts");
    game.trumpCaller = "north"; // Team 0 called trump
    game.goingAlone = "north"; // Going alone

    const tricks: Trick[] = [
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
    ];

    const scores = calculateScores(game, tricks);

    expect(scores).toEqual([4, 0]); // Going alone march = 4 points
  });

  it("should award 2 points to defenders for euchring makers", () => {
    const game = createGameWithTrump(["a", "b", "c", "d"], "hearts");
    game.trumpCaller = "north"; // Team 0 called trump

    const tricks: Trick[] = [
      { leadPlayer: "north", plays: [], winner: "east" }, // Team 1
      { leadPlayer: "north", plays: [], winner: "east" }, // Team 1
      { leadPlayer: "north", plays: [], winner: "west" }, // Team 1
      { leadPlayer: "north", plays: [], winner: "west" }, // Team 1
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0 (only 1 trick)
    ];

    const scores = calculateScores(game, tricks);

    expect(scores).toEqual([0, 2]); // Makers euchred = defenders get 2 points
  });

  it("should handle team 1 as makers winning", () => {
    const game = createGameWithTrump(["a", "b", "c", "d"], "hearts");
    game.trumpCaller = "east"; // Team 1 called trump

    const tricks: Trick[] = [
      { leadPlayer: "north", plays: [], winner: "east" }, // Team 1
      { leadPlayer: "north", plays: [], winner: "east" }, // Team 1
      { leadPlayer: "north", plays: [], winner: "west" }, // Team 1
      { leadPlayer: "north", plays: [], winner: "west" }, // Team 1
      { leadPlayer: "north", plays: [], winner: "north" }, // Team 0
    ];

    const scores = calculateScores(game, tricks);

    expect(scores).toEqual([0, 1]); // Team 1 (makers) won 4/5 = 1 point
  });

  it("should handle team 1 going alone march", () => {
    const game = createGameWithTrump(["a", "b", "c", "d"], "hearts");
    game.trumpCaller = "east"; // Team 1 called trump
    game.goingAlone = "east"; // Going alone

    const tricks: Trick[] = [
      { leadPlayer: "east", plays: [], winner: "east" }, // Team 1
      { leadPlayer: "east", plays: [], winner: "west" }, // Team 1
      { leadPlayer: "east", plays: [], winner: "east" }, // Team 1
      { leadPlayer: "east", plays: [], winner: "west" }, // Team 1
      { leadPlayer: "east", plays: [], winner: "east" }, // Team 1
    ];

    const scores = calculateScores(game, tricks);

    expect(scores).toEqual([0, 4]); // Team 1 going alone march = 4 points
  });

  it("should throw error when trump caller is not set", () => {
    const game = createGameWithTrump(["a", "b", "c", "d"], "hearts");
    delete game.trumpCaller; // Remove trump caller

    const tricks: Trick[] = [
      { leadPlayer: "north", plays: [], winner: "north" },
      { leadPlayer: "north", plays: [], winner: "north" },
      { leadPlayer: "north", plays: [], winner: "north" },
      { leadPlayer: "north", plays: [], winner: "east" },
      { leadPlayer: "north", plays: [], winner: "east" },
    ];

    expect(() => calculateScores(game, tricks)).toThrow(InvalidGameStateError);
    expect(() => calculateScores(game, tricks)).toThrow("No trump caller set");
  });

  it("should throw error when trump caller player not found", () => {
    const game = createGameWithTrump(["a", "b", "c", "d"], "hearts");
    game.trumpCaller = "invalid" as any; // Invalid position

    const tricks: Trick[] = [
      { leadPlayer: "north", plays: [], winner: "north" },
      { leadPlayer: "north", plays: [], winner: "north" },
      { leadPlayer: "north", plays: [], winner: "north" },
      { leadPlayer: "north", plays: [], winner: "east" },
      { leadPlayer: "north", plays: [], winner: "east" },
    ];

    expect(() => calculateScores(game, tricks)).toThrow(InvalidGameStateError);
    expect(() => calculateScores(game, tricks)).toThrow(
      "Trump caller not found",
    );
  });
});

describe("Game Completion", () => {
  it("should return false for incomplete game", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(isGameComplete(game)).toBe(false);
  });

  it("should return true after 5 tricks", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    game.completedTricks = Array(5).fill({
      leadPlayer: "north",
      plays: [],
      winner: "north",
    });

    expect(isGameComplete(game)).toBe(true);
  });
});

describe("Get Winning Team", () => {
  it("should return null for incomplete game", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);

    expect(getWinningTeam(game)).toBeNull();
  });

  it("should return team 0 when they win", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);
    game.completedTricks = Array(5).fill({
      leadPlayer: "north",
      plays: [],
      winner: "north",
    });
    game.scores = [1, 0];

    expect(getWinningTeam(game)).toBe(0);
  });

  it("should return team 1 when they win", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);
    game.completedTricks = Array(5).fill({
      leadPlayer: "north",
      plays: [],
      winner: "east",
    });
    game.scores = [0, 1];

    expect(getWinningTeam(game)).toBe(1);
  });
});

describe("Format Game State for AI", () => {
  let game: GameState;

  beforeEach(() => {
    game = createGameWithTrump(
      ["gpt-4", "claude", "gemini", "gpt-3.5"],
      "hearts",
    );
  });

  it("should include trump suit", () => {
    const formatted = formatGameStateForAI(game, "north");

    expect(formatted).toContain("Trump: hearts");
  });

  it("should include player position and team", () => {
    const formatted = formatGameStateForAI(game, "north");

    expect(formatted).toContain("Your position: north");
    expect(formatted).toContain("Team 0");
  });

  it("should include partner position", () => {
    const formatted = formatGameStateForAI(game, "north");

    expect(formatted).toContain("Your partner: south");
  });

  it("should include player hand", () => {
    const formatted = formatGameStateForAI(game, "north");

    expect(formatted).toContain("Your hand:");
  });

  it("should include current trick status", () => {
    const formatted = formatGameStateForAI(game, "north");

    expect(formatted).toContain("Current trick");
  });

  it("should include scores", () => {
    const formatted = formatGameStateForAI(game, "north");

    expect(formatted).toContain("Score: Team 0: 0, Team 1: 0");
  });

  it("should include tricks completed", () => {
    const formatted = formatGameStateForAI(game, "north");

    expect(formatted).toContain("Tricks completed: 0/5");
  });

  it("should show played cards in current trick", () => {
    game.currentTrick.plays = [
      { player: "north", card: { rank: "ace", suit: "spades" } },
    ];

    const formatted = formatGameStateForAI(game, "east");

    expect(formatted).toContain("north:");
    expect(formatted).toContain("A♠"); // Uses cardToString format
  });

  it("should throw error for invalid player", () => {
    expect(() => formatGameStateForAI(game, "invalid" as Position)).toThrow();
  });
});

describe("Complete 5-Trick Game", () => {
  it("should automatically calculate scores when completing 5th trick", () => {
    let game = createGameWithTrump(
      ["gpt-4", "claude", "gemini", "gpt-3.5"],
      "hearts",
    );

    // Give all players the same suit to simplify testing
    game.players.forEach((_, i) => {
      game.players[i].hand = [
        { rank: "ace", suit: "clubs" },
        { rank: "king", suit: "clubs" },
        { rank: "queen", suit: "clubs" },
        { rank: "jack", suit: "clubs" },
        { rank: "10", suit: "clubs" },
      ];
    });

    // Play through 5 complete tricks (20 cards total)
    for (let trick = 0; trick < 5; trick++) {
      for (let play = 0; play < 4; play++) {
        // Use getNextPlayer to determine whose turn it is
        const currentPlayer = getNextPlayer(game);
        const playerIndex = game.players.findIndex(
          (p) => p.position === currentPlayer,
        );
        const card = game.players[playerIndex].hand[0];

        game = playCard(game, currentPlayer, card);
      }
    }

    // Verify the game completed all tricks and scores were calculated
    expect(game.completedTricks).toHaveLength(5);
    expect(game.scores[0] + game.scores[1]).toBeGreaterThanOrEqual(1); // At least one team scored
  });
});

describe("Get Winning Team - Tie Scenario", () => {
  it("should return null for tie game", () => {
    const game = createNewGame(["gpt-4", "claude", "gemini", "gpt-3.5"]);
    game.completedTricks = Array(5).fill({
      leadPlayer: "north",
      plays: [],
      winner: "north",
    });
    game.scores = [0, 0]; // Tie score

    expect(getWinningTeam(game)).toBeNull();
  });
});
