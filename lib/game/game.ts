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
const TRICKS_PER_GAME = 5;
const KITTY_SIZE = 3;

/**
 * Create a new game with shuffled and dealt cards, starting in trump selection phase
 */
export function createNewGame(
  modelIds: [string, string, string, string],
  dealer: Position = "north",
): GameState {
  const deck = shuffleDeck(createDeck());

  const positions: Position[] = ["north", "east", "south", "west"];
  const players: Player[] = positions.map((position, index) => ({
    position,
    team: (index % 2) as 0 | 1, // 0 and 2 are team 0, 1 and 3 are team 1
    hand: deck.slice(index * CARDS_PER_HAND, (index + 1) * CARDS_PER_HAND),
    modelId: modelIds[index],
  }));

  // Card after dealing all hands is turned up for bidding
  const turnedUpCard = deck[PLAYERS_PER_GAME * CARDS_PER_HAND];

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
    const trumpSuit = action === "order_up" ? turnedUpCard.suit : suit!;

    // If ordered up, add turned-up card to dealer's hand
    let updatedPlayers = game.players;
    if (action === "order_up") {
      const dealerIndex = game.players.findIndex((p) => p.position === dealer);
      updatedPlayers = [...game.players];
      updatedPlayers[dealerIndex] = {
        ...updatedPlayers[dealerIndex],
        hand: [...updatedPlayers[dealerIndex].hand, turnedUpCard],
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
              return `  ${b.player}: Pass`;
            } else if (b.action === "order_up") {
              return `  ${b.player}: Order up ${turnedUpCard.suit}${b.goingAlone ? " (going alone)" : ""}`;
            } else {
              return `  ${b.player}: Call ${b.suit} as trump${b.goingAlone ? " (going alone)" : ""}`;
            }
          })
          .join("\n")
      : "  (no bids yet)";

  const roundDesc =
    round === 1
      ? `Round 1: Order up the ${cardToString(turnedUpCard)} or pass`
      : `Round 2: Call any suit EXCEPT ${turnedUpCard.suit} (or pass${playerPosition === dealer ? " - DEALER MUST CALL if last" : ""})`;

  return `
Trump Selection - ${roundDesc}
Turned-up card: ${cardToString(turnedUpCard)}
Dealer: ${dealer}
Your position: ${playerPosition} (Team ${player.team})
Your partner: ${partner?.position}
Your hand: ${player.hand.map(cardToString).join(", ")}

Bidding so far:
${bidHistory}

Your turn: What do you bid?
  `.trim();
}

/**
 * Get the current lead suit of a trick (returns null if no cards played)
 */
export function getLeadSuit(trick: Trick, trump: Suit): Suit | null {
  if (trick.plays.length === 0) return null;
  return effectiveSuit(trick.plays[0].card, trump);
}

/**
 * Determine the winner of a completed trick
 */
export function determineTrickWinner(trick: Trick, trump: Suit): Position {
  if (trick.plays.length !== PLAYERS_PER_GAME) {
    throw new InvalidGameStateError(
      "Trick must have 4 plays to determine winner",
    );
  }

  const leadSuit = getLeadSuit(trick, trump)!;

  let winningPlay = trick.plays[0];

  for (let i = 1; i < trick.plays.length; i++) {
    const comparison = compareCards(
      trick.plays[i].card,
      winningPlay.card,
      trump,
      leadSuit,
    );

    if (comparison > 0) {
      winningPlay = trick.plays[i];
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
  const leadCard =
    game.currentTrick.plays.length > 0 ? game.currentTrick.plays[0].card : null;

  // If not leading, must follow suit if possible
  if (leadCard && game.trump) {
    const leadSuit = effectiveSuit(leadCard, game.trump);
    const canFollow = playerObj.hand.some(
      (c) => effectiveSuit(c, game.trump!) === leadSuit,
    );

    if (canFollow && !followsSuit(card, leadCard, game.trump)) {
      return { valid: false, error: "Must follow suit if possible" };
    }
  }

  return { valid: true };
}

/**
 * Get the next player to play in the current trick
 */
export function getNextPlayer(game: GameState): Position {
  const trick = game.currentTrick;

  // If trick is empty, lead player goes first
  if (trick.plays.length === 0) {
    return trick.leadPlayer;
  }

  // Otherwise, go clockwise from lead player
  const leadIndex = positionToIndex(trick.leadPlayer);
  const nextIndex = (leadIndex + trick.plays.length) % PLAYERS_PER_GAME;
  return indexToPosition(nextIndex);
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
    throw new InvalidPlayError(validation.error!, player, card);
  }

  // Find player and remove card from hand
  const playerIndex = game.players.findIndex((p) => p.position === player);
  const updatedPlayers = [...game.players];
  updatedPlayers[playerIndex] = {
    ...updatedPlayers[playerIndex],
    hand: removeCardFromHand(updatedPlayers[playerIndex].hand, card),
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

  if (updatedTrick.plays.length === PLAYERS_PER_GAME) {
    // Determine winner
    const winner = determineTrickWinner(updatedTrick, game.trump!);
    updatedTrick.winner = winner;

    // Add to completed tricks
    completedTricks = [...game.completedTricks, updatedTrick];

    // Start new trick with winner as lead
    currentTrick = {
      leadPlayer: winner,
      plays: [],
      winner: undefined,
    };

    // Update scores if all tricks are complete
    if (completedTricks.length === TRICKS_PER_GAME) {
      scores = calculateScores(game.players, completedTricks);
    }
  }

  return {
    ...game,
    players: updatedPlayers,
    currentTrick,
    completedTricks,
    scores,
  };
}

/**
 * Calculate scores based on completed tricks
 * Returns [team0Score, team1Score]
 */
export function calculateScores(
  players: Player[],
  completedTricks: Trick[],
): [number, number] {
  const team0Tricks = completedTricks.filter((trick) => {
    const winner = players.find((p) => p.position === trick.winner);
    return winner?.team === 0;
  }).length;

  const team1Tricks = TRICKS_PER_GAME - team0Tricks;

  // Simple scoring: 1 point per trick won (majority)
  // In real Euchre, scoring is more complex, but this works for demo
  const team0Score = team0Tricks >= 3 ? 1 : 0;
  const team1Score = team1Tricks >= 3 ? 1 : 0;

  return [team0Score, team1Score];
}

/**
 * Check if the game/hand is complete (all 5 tricks played)
 */
export function isGameComplete(game: GameState): boolean {
  return game.completedTricks.length === TRICKS_PER_GAME;
}

/**
 * Get the winning team (0 or 1) - only valid if game is complete
 */
export function getWinningTeam(game: GameState): 0 | 1 | null {
  if (!isGameComplete(game)) return null;

  if (game.scores[0] > game.scores[1]) return 0;
  if (game.scores[1] > game.scores[0]) return 1;
  return null; // Tie (shouldn't happen in Euchre)
}

/**
 * Format game state for AI prompt
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
Tricks completed: ${game.completedTricks.length}/${TRICKS_PER_GAME}
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
): GameState {
  const game = createNewGame(modelIds, dealer);

  // Skip trump selection phase
  return {
    ...game,
    phase: "playing",
    trump,
    trumpCaller: dealer,
    trumpSelection: undefined,
  };
}
