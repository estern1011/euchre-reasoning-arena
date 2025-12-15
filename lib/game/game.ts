import type {
  GameState,
  Player,
  Trick,
  Card,
  Suit,
  Position,
  CardPlay,
  TrumpBidAction,
  TrumpBid,
} from "./types";
import {
  createDeck,
  shuffleDeck,
  compareCards,
  effectiveSuit,
  removeCardFromHand,
  followsSuit,
  cardToString,
} from "./card";
import { positionToIndex, indexToPosition } from "./utils";
import {
  InvalidPlayError,
  InvalidGameStateError,
  InvalidBidError,
} from "./errors";

// Game constants
const PLAYERS_PER_GAME = 4;
const CARDS_PER_HAND = 5;
const BIDS_PER_ROUND = 4;
const TRICKS_PER_HAND = 5;
const KITTY_SIZE = 3;
const DEFAULT_WINNING_SCORE = 10;

/**
 * Create a new game with shuffled and dealt cards, starting in trump selection phase
 * @param modelIds - Model IDs for each position [north, east, south, west]
 * @param dealer - Starting dealer position (default: north)
 * @param winningScore - Points needed to win the game (default: 10)
 * @param existingGameScores - Existing game scores if continuing a game
 * @param handNumber - Current hand number if continuing a game
 */
export function createNewGame(
  modelIds: [string, string, string, string],
  dealer: Position = "north",
  winningScore: number = DEFAULT_WINNING_SCORE,
  existingGameScores?: [number, number],
  handNumber: number = 1,
): GameState {
  const deck = shuffleDeck(createDeck());

  const positions: Position[] = ["north", "east", "south", "west"];
  const players: Player[] = positions.map((position, index) => {
    const modelId = modelIds[index];
    if (!modelId) {
      throw new Error(`Missing modelId for player ${index}`);
    }
    return {
      position,
      team: (index % 2) as 0 | 1, // 0 and 2 are team 0, 1 and 3 are team 1
      hand: deck.slice(index * CARDS_PER_HAND, (index + 1) * CARDS_PER_HAND),
      modelId,
    };
  });

  // Card after dealing all hands is turned up for bidding
  const turnedUpCard = deck[PLAYERS_PER_GAME * CARDS_PER_HAND];
  if (!turnedUpCard) {
    throw new Error("Deck too small for turned up card");
  }

  // First bidder is left of dealer (clockwise)
  const dealerIndex = positionToIndex(dealer);
  const firstBidder = indexToPosition((dealerIndex + 1) % PLAYERS_PER_GAME);

  // Remaining cards are the kitty
  const kitty = deck.slice(
    PLAYERS_PER_GAME * CARDS_PER_HAND + 1,
    PLAYERS_PER_GAME * CARDS_PER_HAND + 1 + KITTY_SIZE,
  );

  return {
    id: crypto.randomUUID(),
    phase: "trump_selection",
    players,
    trump: null,
    dealer,
    trumpSelection: {
      turnedUpCard,
      dealer,
      currentBidder: firstBidder,
      round: 1,
      bids: [],
    },
    kitty,
    currentTrick: {
      leadPlayer: firstBidder, // Will be updated after trump selection
      plays: [],
      winner: undefined,
    },
    completedTricks: [],
    scores: [0, 0],
    // Multi-hand game tracking
    handNumber,
    gameScores: existingGameScores || [0, 0],
    winningScore,
  };
}

/**
 * Set the trump suit for the game (legacy - prefer using makeTrumpBid)
 */
export function setTrump(game: GameState, trump: Suit): GameState {
  return {
    ...game,
    trump,
  };
}

/**
 * Get the next bidder in trump selection
 */
export function getNextBidder(game: GameState): Position | null {
  if (!game.trumpSelection) return null;

  const { currentBidder, round, bids } = game.trumpSelection;

  // Count bids in current round only
  const bidsThisRound =
    round === 1
      ? bids.filter((b) => b.action === "order_up" || b.action === "pass")
      : bids
          .filter(
            (b) =>
              b.action === "call_trump" || (b.action === "pass" && round === 2),
          )
          .slice(-4); // Only count last 4 bids for round 2

  // In round 2, we need to count bids since round 2 started (after first round)
  const round2Bids = round === 2 ? bids.slice(BIDS_PER_ROUND) : [];
  const bidsToCount = round === 1 ? bidsThisRound : round2Bids;

  if (bidsToCount.length >= BIDS_PER_ROUND) {
    return null; // Round complete
  }

  // Next bidder is clockwise
  const currentIndex = positionToIndex(currentBidder);
  return indexToPosition((currentIndex + 1) % PLAYERS_PER_GAME);
}

/**
 * Make a trump selection bid
 */
export function makeTrumpBid(
  game: GameState,
  player: Position,
  action: TrumpBidAction,
  suit?: Suit,
  goingAlone: boolean = false,
  reasoning?: string,
): GameState {
  if (game.phase !== "trump_selection") {
    throw new InvalidGameStateError("Not in trump selection phase");
  }

  if (!game.trumpSelection) {
    throw new InvalidGameStateError("No trump selection state");
  }

  if (player !== game.trumpSelection.currentBidder) {
    throw new InvalidBidError(
      `Not ${player}'s turn to bid (expected ${game.trumpSelection.currentBidder})`,
      player,
      action,
    );
  }

  // Validate bid action
  const { round, turnedUpCard, dealer, bids } = game.trumpSelection;

  if (round === 1 && action === "call_trump") {
    throw new InvalidBidError(
      "Cannot call trump in round 1 (use order_up or pass)",
      player,
      action,
    );
  }

  if (round === 2 && action === "order_up") {
    throw new InvalidBidError(
      "Cannot order up in round 2 (use call_trump or pass)",
      player,
      action,
    );
  }

  if (action === "call_trump" && !suit) {
    throw new InvalidBidError(
      "Must specify suit when calling trump",
      player,
      action,
    );
  }

  if (action === "call_trump" && suit === turnedUpCard.suit) {
    throw new InvalidBidError(
      `Cannot call turned-up suit (${turnedUpCard.suit}) in round 2`,
      player,
      action,
    );
  }

  // Dealer cannot pass in round 2 if last to bid
  const round2Bids = round === 2 ? bids.slice(BIDS_PER_ROUND) : [];

  if (
    round === 2 &&
    player === dealer &&
    round2Bids.length === BIDS_PER_ROUND - 1 &&
    action === "pass"
  ) {
    throw new InvalidBidError(
      "Dealer cannot pass in round 2 when last to bid (must call trump)",
      player,
      action,
    );
  }

  const bid: TrumpBid = {
    player,
    action,
    suit,
    goingAlone,
    reasoning,
  };

  const updatedBids = [...bids, bid];

  // If someone ordered up or called trump
  if (action === "order_up" || action === "call_trump") {
    let trumpSuit: Suit;
    if (action === "order_up") {
      trumpSuit = turnedUpCard.suit;
    } else if (suit) {
      trumpSuit = suit;
    } else {
      throw new Error("Must specify suit when calling trump");
    }

    // If ordered up, add turned-up card to dealer's hand
    let updatedPlayers = game.players;
    if (action === "order_up") {
      const dealerIndex = game.players.findIndex((p) => p.position === dealer);
      const dealerPlayer = game.players[dealerIndex];
      if (!dealerPlayer) {
        throw new Error("Dealer not found");
      }
      updatedPlayers = [...game.players];
      updatedPlayers[dealerIndex] = {
        ...dealerPlayer,
        hand: [...dealerPlayer.hand, turnedUpCard],
      };
    }

    // Move to playing phase
    const leadPlayer = indexToPosition(
      (positionToIndex(dealer) + 1) % PLAYERS_PER_GAME,
    );

    return {
      ...game,
      phase: "playing",
      trump: trumpSuit,
      trumpCaller: player,
      goingAlone: goingAlone ? player : undefined,
      trumpSelection: undefined, // Clear trump selection state
      players: updatedPlayers,
      currentTrick: {
        leadPlayer,
        plays: [],
        winner: undefined,
      },
    };
  }

  // Everyone passed in round 1 - move to round 2
  if (
    round === 1 &&
    updatedBids.length === BIDS_PER_ROUND &&
    updatedBids.every((b) => b.action === "pass")
  ) {
    const firstBidderRound2 = indexToPosition(
      (positionToIndex(dealer) + 1) % PLAYERS_PER_GAME,
    );

    return {
      ...game,
      trumpSelection: {
        ...game.trumpSelection,
        round: 2,
        currentBidder: firstBidderRound2,
        bids: updatedBids,
      },
    };
  }

  // Continue to next bidder
  const nextBidder = getNextBidder({
    ...game,
    trumpSelection: {
      ...game.trumpSelection,
      bids: updatedBids,
    },
  });

  if (!nextBidder) {
    throw new InvalidGameStateError("No next bidder found");
  }

  return {
    ...game,
    trumpSelection: {
      ...game.trumpSelection,
      currentBidder: nextBidder,
      bids: updatedBids,
    },
  };
}

/**
 * Dealer discards a card after ordering up (dealer must discard down to 5 cards)
 */
export function dealerDiscard(game: GameState, card: Card): GameState {
  if (game.phase !== "playing") {
    throw new InvalidGameStateError("Can only discard after trump is set");
  }

  const dealerObj = game.players.find((p) => p.position === game.dealer);
  if (!dealerObj) {
    throw new InvalidGameStateError("Dealer not found");
  }

  if (dealerObj.hand.length !== 6) {
    throw new InvalidGameStateError(
      "Dealer does not have 6 cards (discard only needed after order up)",
    );
  }

  // Remove card from dealer's hand
  const updatedPlayers = game.players.map((p) =>
    p.position === game.dealer
      ? { ...p, hand: removeCardFromHand(p.hand, card) }
      : p,
  );

  return {
    ...game,
    players: updatedPlayers,
  };
}

/**
 * Format trump selection state for AI prompt
 */
export function formatTrumpSelectionForAI(
  game: GameState,
  playerPosition: Position,
): string {
  if (!game.trumpSelection) {
    throw new InvalidGameStateError("Not in trump selection phase");
  }

  const { turnedUpCard, dealer, round, bids } = game.trumpSelection;
  const player = game.players.find((p) => p.position === playerPosition);

  if (!player) {
    throw new InvalidGameStateError(`Player not found: ${playerPosition}`);
  }

  const partner = game.players.find(
    (p) => p.team === player.team && p.position !== playerPosition,
  );

  const bidHistory =
    bids.length > 0
      ? bids
          .map((b) => {
            if (b.action === "pass") {
              return `  ${b.player}: pass`;
            } else if (b.action === "order_up") {
              return `  ${b.player}: order_up${b.goingAlone ? " (alone)" : ""}`;
            } else {
              return `  ${b.player}: call_trump ${b.suit}${b.goingAlone ? " (alone)" : ""}`;
            }
          })
          .join("\n")
      : "  (none yet)";

  const isDealer = playerPosition === dealer;
  const isLastBidderRound2 = round === 2 && bids.slice(BIDS_PER_ROUND).length === BIDS_PER_ROUND - 1;

  return `
Turned-up card: ${cardToString(turnedUpCard)}
Dealer: ${dealer}${isDealer ? " (you)" : ""}
Your position: ${playerPosition} (Team ${player.team})
Your partner: ${partner?.position}
Your hand: ${player.hand.map(cardToString).join(", ")}
${isDealer && isLastBidderRound2 ? "NOTE: You are dealer and MUST call trump (cannot pass).\n" : ""}
Bids so far:
${bidHistory}
  `.trim();
}

/**
 * Get the current lead suit of a trick (returns null if no cards played)
 */
export function getLeadSuit(trick: Trick, trump: Suit): Suit | null {
  const firstPlay = trick.plays[0];
  if (!firstPlay) return null;
  return effectiveSuit(firstPlay.card, trump);
}

/**
 * Determine the winner of a completed trick
 * When going alone, trick has 3 plays instead of 4
 */
export function determineTrickWinner(
  trick: Trick,
  trump: Suit,
  goingAlone: boolean = false,
): Position {
  const expectedPlays = goingAlone ? 3 : PLAYERS_PER_GAME;

  if (trick.plays.length !== expectedPlays) {
    throw new InvalidGameStateError(
      `Trick must have ${expectedPlays} plays to determine winner (${goingAlone ? "going alone" : "normal"})`,
    );
  }

  const leadSuit = getLeadSuit(trick, trump);
  if (!leadSuit) {
    throw new InvalidGameStateError("Trick has no lead card");
  }

  const firstPlay = trick.plays[0];
  if (!firstPlay) {
    throw new InvalidGameStateError("Trick has no plays");
  }
  let winningPlay = firstPlay;

  for (let i = 1; i < trick.plays.length; i++) {
    const currentPlay = trick.plays[i];
    if (!currentPlay) continue;
    const comparison = compareCards(
      currentPlay.card,
      winningPlay.card,
      trump,
      leadSuit,
    );

    if (comparison > 0) {
      winningPlay = currentPlay;
    }
  }

  return winningPlay.player;
}

/**
 * Check if a card play is legal
 */
export function validatePlay(
  card: Card,
  player: Position,
  game: GameState,
): { valid: boolean; error?: string } {
  if (game.phase !== "playing") {
    return { valid: false, error: "Not in playing phase" };
  }

  if (!game.trump) {
    return { valid: false, error: "Trump has not been set" };
  }

  const playerObj = game.players.find((p) => p.position === player);
  if (!playerObj) {
    return { valid: false, error: "Player not found" };
  }

  // Check if it's this player's turn
  const expectedPlayer = getNextPlayer(game);
  if (player !== expectedPlayer) {
    return {
      valid: false,
      error: `Not ${player}'s turn (expected ${expectedPlayer})`,
    };
  }

  // Check if card is in hand
  const hasCard = playerObj.hand.some(
    (c) => c.suit === card.suit && c.rank === card.rank,
  );
  if (!hasCard) {
    return { valid: false, error: "Card not in hand" };
  }

  // Check suit-following rules
  const firstPlay = game.currentTrick.plays[0];
  const leadCard = firstPlay?.card ?? null;

  // If not leading, must follow suit if possible
  const trump = game.trump;
  if (leadCard && trump) {
    const leadSuit = effectiveSuit(leadCard, trump);
    const canFollow = playerObj.hand.some(
      (c) => effectiveSuit(c, trump) === leadSuit,
    );

    if (canFollow && !followsSuit(card, leadCard, trump)) {
      return { valid: false, error: "Must follow suit if possible" };
    }
  }

  return { valid: true };
}

/**
 * Get all legal cards the player can play for the current trick
 */
export function getValidCardsForPlay(
  game: GameState,
  player: Position,
): Card[] {
  const playerObj = game.players.find((p) => p.position === player);
  if (!playerObj) {
    return [];
  }

  // If not in playing phase or no trump yet, allow any card from hand
  const trump = game.trump;
  if (game.phase !== "playing" || !trump) {
    return playerObj.hand;
  }

  // If leading the trick, any card is legal
  if (game.currentTrick.plays.length === 0) {
    return playerObj.hand;
  }

  // Otherwise must follow suit if possible
  const leadPlay = game.currentTrick.plays[0];
  if (!leadPlay) {
    return playerObj.hand;
  }
  const leadCard = leadPlay.card;
  const leadSuit = effectiveSuit(leadCard, trump);
  const canFollow = playerObj.hand.some(
    (c) => effectiveSuit(c, trump) === leadSuit,
  );

  if (canFollow) {
    return playerObj.hand.filter(
      (c) => effectiveSuit(c, trump) === leadSuit,
    );
  }

  // No card of the lead suit; any card is legal
  return playerObj.hand;
}

/**
 * Get the next player to play in the current trick
 * Skips partner if someone is going alone
 */
export function getNextPlayer(game: GameState): Position {
  const trick = game.currentTrick;

  // If trick is empty, lead player goes first
  if (trick.plays.length === 0) {
    return trick.leadPlayer;
  }

  // Find the partner of the player going alone (if any)
  let partnerToSkip: Position | undefined;
  if (game.goingAlone) {
    const goingAlonePlayer = game.players.find(
      (p) => p.position === game.goingAlone,
    );
    if (goingAlonePlayer) {
      const partner = game.players.find(
        (p) =>
          p.team === goingAlonePlayer.team && p.position !== game.goingAlone,
      );
      partnerToSkip = partner?.position;
    }
  }

  // Get all players in clockwise order starting from lead
  const leadIndex = positionToIndex(trick.leadPlayer);
  const allPlayers: Position[] = [];
  for (let i = 0; i < PLAYERS_PER_GAME; i++) {
    const pos = indexToPosition((leadIndex + i) % PLAYERS_PER_GAME);
    // Skip the partner if going alone
    if (!partnerToSkip || pos !== partnerToSkip) {
      allPlayers.push(pos);
    }
  }

  // Return the player at index equal to number of plays already made
  const nextPlayer = allPlayers[trick.plays.length];
  if (!nextPlayer) {
    throw new Error("No next player - trick may be complete");
  }
  return nextPlayer;
}

/**
 * Play a card in the current trick
 */
export function playCard(
  game: GameState,
  player: Position,
  card: Card,
  reasoning?: string,
): GameState {
  // Validate the play
  const validation = validatePlay(card, player, game);
  if (!validation.valid) {
    throw new InvalidPlayError(validation.error ?? "Invalid play", player, card);
  }

  // Find player and remove card from hand
  const playerIndex = game.players.findIndex((p) => p.position === player);
  const playerObj = game.players[playerIndex];
  if (!playerObj) {
    throw new Error(`Player ${player} not found`);
  }
  const updatedPlayers = [...game.players];
  updatedPlayers[playerIndex] = {
    ...playerObj,
    hand: removeCardFromHand(playerObj.hand, card),
  };

  // Add play to current trick
  const cardPlay: CardPlay = {
    player,
    card,
    reasoning,
  };

  const updatedTrick: Trick = {
    ...game.currentTrick,
    plays: [...game.currentTrick.plays, cardPlay],
  };

  // Check if trick is complete
  let completedTricks = game.completedTricks;
  let currentTrick = updatedTrick;
  let scores = game.scores;
  let gameScores = game.gameScores;
  let phase = game.phase;

  const expectedPlays = game.goingAlone ? 3 : PLAYERS_PER_GAME;

  if (updatedTrick.plays.length === expectedPlays) {
    // Determine winner - trump must be set during play phase
    if (!game.trump) {
      throw new Error("Trump must be set during playing phase");
    }
    const winner = determineTrickWinner(
      updatedTrick,
      game.trump,
      !!game.goingAlone,
    );
    updatedTrick.winner = winner;

    // Add to completed tricks
    completedTricks = [...game.completedTricks, updatedTrick];

    // Start new trick with winner as lead
    currentTrick = {
      leadPlayer: winner,
      plays: [],
      winner: undefined,
    };

    // Update scores if all tricks are complete (hand is done)
    if (completedTricks.length === TRICKS_PER_HAND) {
      scores = calculateScores(game, completedTricks);

      // Add hand scores to game scores
      gameScores = [
        game.gameScores[0] + scores[0],
        game.gameScores[1] + scores[1],
      ];

      // Determine if game is complete or just hand is complete
      if (
        gameScores[0] >= game.winningScore ||
        gameScores[1] >= game.winningScore
      ) {
        phase = "game_complete";
      } else {
        phase = "hand_complete";
      }
    }
  }

  return {
    ...game,
    phase,
    players: updatedPlayers,
    currentTrick,
    completedTricks,
    scores,
    gameScores,
  };
}

/**
 * Calculate scores based on completed tricks using proper Euchre scoring rules
 * Returns [team0Score, team1Score]
 *
 * Scoring rules:
 * - Makers win 3-4 tricks: 1 point
 * - Makers march (all 5 tricks): 2 points
 * - Makers march while going alone: 4 points
 * - Defenders euchre makers (makers win <3 tricks): 2 points
 */
export function calculateScores(
  game: GameState,
  completedTricks: Trick[],
): [number, number] {
  if (!game.trumpCaller) {
    throw new InvalidGameStateError("No trump caller set");
  }

  // Find trump caller's team
  const trumpCallerPlayer = game.players.find(
    (p) => p.position === game.trumpCaller,
  );
  if (!trumpCallerPlayer) {
    throw new InvalidGameStateError("Trump caller not found");
  }

  const makersTeam = trumpCallerPlayer.team;
  const defendersTeam = (makersTeam === 0 ? 1 : 0) as 0 | 1;

  // Count tricks won by each team
  const team0Tricks = completedTricks.filter((trick) => {
    const winner = game.players.find((p) => p.position === trick.winner);
    return winner?.team === 0;
  }).length;

  const team1Tricks = TRICKS_PER_HAND - team0Tricks;

  const makersTricks = makersTeam === 0 ? team0Tricks : team1Tricks;
  const isGoingAlone = game.goingAlone === game.trumpCaller;

  let team0Score = 0;
  let team1Score = 0;

  if (makersTricks >= 3) {
    // Makers won
    let points = 1; // Default: 3-4 tricks

    if (makersTricks === 5) {
      // March
      points = isGoingAlone ? 4 : 2;
    }

    if (makersTeam === 0) {
      team0Score = points;
    } else {
      team1Score = points;
    }
  } else {
    // Defenders euchred the makers
    if (defendersTeam === 0) {
      team0Score = 2;
    } else {
      team1Score = 2;
    }
  }

  return [team0Score, team1Score];
}

/**
 * Check if the current hand is complete (all 5 tricks played)
 */
export function isHandComplete(game: GameState): boolean {
  return game.completedTricks.length === TRICKS_PER_HAND;
}

/**
 * Check if the game is complete (a team has reached the winning score)
 */
export function isGameComplete(game: GameState): boolean {
  return (
    game.gameScores[0] >= game.winningScore ||
    game.gameScores[1] >= game.winningScore
  );
}

/**
 * Get the winning team (0 or 1) - only valid if game is complete
 */
export function getWinningTeam(game: GameState): 0 | 1 | null {
  if (!isGameComplete(game)) return null;

  if (game.gameScores[0] > game.gameScores[1]) return 0;
  if (game.gameScores[1] > game.gameScores[0]) return 1;
  return null; // Tie (shouldn't happen in Euchre)
}

/**
 * Get the next dealer position (clockwise rotation)
 */
export function getNextDealer(currentDealer: Position): Position {
  const dealerIndex = positionToIndex(currentDealer);
  return indexToPosition((dealerIndex + 1) % PLAYERS_PER_GAME);
}

/**
 * Start a new hand after the previous hand is complete.
 * Preserves game scores and model IDs, rotates dealer, and re-deals.
 */
export function startNewHand(game: GameState): GameState {
  if (!isHandComplete(game)) {
    throw new InvalidGameStateError(
      "Cannot start new hand - current hand is not complete"
    );
  }

  if (isGameComplete(game)) {
    throw new InvalidGameStateError(
      "Cannot start new hand - game is already complete"
    );
  }

  // Get model IDs in position order
  const modelIds = game.players
    .sort((a, b) => {
      const order: Position[] = ["north", "east", "south", "west"];
      return order.indexOf(a.position) - order.indexOf(b.position);
    })
    .map((p) => p.modelId) as [string, string, string, string];

  // Rotate dealer clockwise
  const nextDealer = getNextDealer(game.dealer);

  // Create new hand with preserved game state
  return createNewGame(
    modelIds,
    nextDealer,
    game.winningScore,
    game.gameScores,
    game.handNumber + 1
  );
}

/**
 * Format game state for AI prompt (includes full hand - used for general context)
 */
export function formatGameStateForAI(
  game: GameState,
  playerPosition: Position,
): string {
  const player = game.players.find((p) => p.position === playerPosition);
  if (!player)
    throw new InvalidGameStateError(`Player not found: ${playerPosition}`);

  const partner = game.players.find(
    (p) => p.team === player.team && p.position !== playerPosition,
  );

  const currentTrickStr =
    game.currentTrick.plays.length > 0
      ? game.currentTrick.plays
          .map((p) => `  ${p.player}: ${cardToString(p.card)}`)
          .join("\n")
      : "  (no cards played yet)";

  return `
Trump: ${game.trump || "not set"}
Your position: ${playerPosition} (Team ${player.team})
Your partner: ${partner?.position}
Your hand: ${player.hand.map(cardToString).join(", ")}

Current trick (lead: ${game.currentTrick.leadPlayer}):
${currentTrickStr}

Score: Team 0: ${game.scores[0]}, Team 1: ${game.scores[1]}
Tricks completed: ${game.completedTricks.length}/${TRICKS_PER_HAND}
  `.trim();
}

/**
 * Format game state for card play decisions (excludes full hand - valid cards shown separately)
 */
export function formatGameStateForCardPlay(
  game: GameState,
  playerPosition: Position,
): string {
  const player = game.players.find((p) => p.position === playerPosition);
  if (!player)
    throw new InvalidGameStateError(`Player not found: ${playerPosition}`);

  const partner = game.players.find(
    (p) => p.team === player.team && p.position !== playerPosition,
  );

  const currentTrickStr =
    game.currentTrick.plays.length > 0
      ? game.currentTrick.plays
          .map((p) => `  ${p.player}: ${cardToString(p.card)}`)
          .join("\n")
      : "  (leading the trick)";

  // Format completed tricks history
  const completedTricksStr =
    game.completedTricks.length > 0
      ? game.completedTricks
          .map((trick, idx) => {
            const plays = trick.plays
              .map((p) => `${p.player}: ${cardToString(p.card)}`)
              .join(", ");
            return `  Trick ${idx + 1} (won by ${trick.winner}): ${plays}`;
          })
          .join("\n")
      : "";

  const trickHistorySection = completedTricksStr
    ? `\nCompleted tricks:\n${completedTricksStr}\n`
    : "";

  // Determine maker/defender status
  const trumpCallerObj = game.players.find((p) => p.position === game.trumpCaller);
  const isMaker = trumpCallerObj && player.team === trumpCallerObj.team;
  const roleStr = isMaker ? "MAKER (your team called trump)" : "DEFENDER (opponents called trump)";

  // Going alone info
  const goingAloneStr = game.goingAlone
    ? `\nGoing alone: ${game.goingAlone}${game.goingAlone === playerPosition ? " (YOU)" : game.goingAlone === partner?.position ? " (your partner - you're sitting out)" : " (opponent)"}`
    : "";

  return `
Trump: ${game.trump} (called by ${game.trumpCaller})
Your position: ${playerPosition} (Team ${player.team})
Your role: ${roleStr}
Your partner: ${partner?.position}${goingAloneStr}
${trickHistorySection}
Current trick (lead: ${game.currentTrick.leadPlayer}):
${currentTrickStr}

Score: Team 0: ${game.scores[0]}, Team 1: ${game.scores[1]}
Tricks this hand: ${game.completedTricks.length}/${TRICKS_PER_HAND}
  `.trim();
}

/**
 * Helper function to create a game that skips trump selection and starts in playing phase
 * Useful for tests that don't need to test trump selection logic
 */
export function createGameWithTrump(
  modelIds: [string, string, string, string],
  trump: Suit,
  dealer: Position = "north",
  winningScore: number = DEFAULT_WINNING_SCORE,
): GameState {
  const game = createNewGame(modelIds, dealer, winningScore);

  // Skip trump selection phase
  return {
    ...game,
    phase: "playing",
    trump,
    trumpCaller: dealer,
    trumpSelection: undefined,
  };
}
