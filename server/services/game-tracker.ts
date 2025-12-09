/**
 * GameTracker service for Metacognition Arena
 * Manages database state across SSE requests and handles decision logging
 *
 * This service bridges the game engine with the database logger,
 * providing a clean interface for tracking decisions and outcomes.
 */

import { POSITION_INDEX, type GameState, type Position, type Card } from "../../lib/game/types";
import {
  createGame,
  completeGame,
  createHand,
  updateHand,
  logDecision,
  updateDecisionOutcome,
  logToolExecution,
  calculateCalibrationStats,
  saveCalibrationAnalysis,
  isDbAvailable,
  type DecisionRecord,
  type ToolExecutionRecord,
} from "../db/logger";

// Extend game state with DB tracking IDs
export interface TrackedGameState extends GameState {
  _dbGameId?: number | null;
  _dbHandId?: number | null;
  _dbDecisionIds?: Record<string, number>; // Map of decision key to DB ID
  _gameStartTime?: number;
  _presetName?: string;
}

/**
 * Initialize tracking for a new game
 * Creates the game and first hand records in the database
 */
export function initializeGameTracking(
  game: GameState,
  presetName?: string
): TrackedGameState {
  const trackedGame = game as TrackedGameState;

  if (!isDbAvailable()) {
    return trackedGame;
  }

  const now = Date.now();

  // Create game record
  const gameId = createGame({
    northModel: game.players[0]!.modelId,
    eastModel: game.players[1]!.modelId,
    southModel: game.players[2]!.modelId,
    westModel: game.players[3]!.modelId,
    winningScore: 10,
    presetName,
    startedAt: now,
  });

  trackedGame._dbGameId = gameId;
  trackedGame._gameStartTime = now;
  trackedGame._presetName = presetName;
  trackedGame._dbDecisionIds = {};

  // Create first hand record
  if (gameId) {
    const handId = createHand({
      gameId,
      handNumber: game.handNumber,
      dealerPosition: POSITION_INDEX[game.dealer],
      createdAt: now,
    });
    trackedGame._dbHandId = handId;

    // Store turned up card if available
    const turnedUpCard = game.trumpSelection?.turnedUpCard;
    if (turnedUpCard && handId) {
      updateHand(handId, {
        turnedUpCard: `${turnedUpCard.rank}${turnedUpCard.suit}`,
      });
    }
  }

  console.log(`[GameTracker] Initialized game ${gameId}, hand ${trackedGame._dbHandId}`);
  return trackedGame;
}

/**
 * Ensure game tracking is initialized
 * Returns the tracked game state, initializing if needed
 */
export function ensureTracking(
  game: GameState,
  presetName?: string
): TrackedGameState {
  const trackedGame = game as TrackedGameState;

  // Already tracking this game
  if (trackedGame._dbGameId !== undefined) {
    return trackedGame;
  }

  return initializeGameTracking(game, presetName);
}

/**
 * Log a trump bid decision
 */
export function logTrumpBidDecision(
  game: TrackedGameState,
  position: Position,
  modelId: string,
  decision: {
    action: string;
    suit?: string;
    goingAlone?: boolean;
    reasoning: string;
    confidence: number;
    duration?: number;
    toolRequested?: string;
    toolUsed?: string;
  }
): number | null {
  if (!isDbAvailable() || !game._dbHandId) {
    return null;
  }

  const decisionId = logDecision({
    handId: game._dbHandId,
    decisionType: "trump_bid",
    agentPosition: position,
    modelId,
    action: decision.suit
      ? `${decision.action}:${decision.suit}${decision.goingAlone ? ":alone" : ""}`
      : decision.action,
    reasoning: decision.reasoning,
    confidence: decision.confidence,
    toolRequested: decision.toolRequested,
    toolUsed: decision.toolUsed,
    wasLegal: true,
    trumpRound: game.trumpSelection?.round || 1,
    decisionTimeMs: decision.duration,
    createdAt: Date.now(),
  });

  // Store decision ID for later outcome update
  if (decisionId && game._dbDecisionIds) {
    const key = `trump_bid_${position}_${game.handNumber}`;
    game._dbDecisionIds[key] = decisionId;
  }

  return decisionId;
}

/**
 * Log a discard decision
 */
export function logDiscardDecision(
  game: TrackedGameState,
  position: Position,
  modelId: string,
  decision: {
    card: Card;
    reasoning: string;
    confidence: number;
    duration?: number;
  }
): number | null {
  if (!isDbAvailable() || !game._dbHandId) {
    return null;
  }

  const decisionId = logDecision({
    handId: game._dbHandId,
    decisionType: "discard",
    agentPosition: position,
    modelId,
    action: `${decision.card.rank}${decision.card.suit}`,
    reasoning: decision.reasoning,
    confidence: decision.confidence,
    wasLegal: true,
    decisionTimeMs: decision.duration,
    createdAt: Date.now(),
  });

  // Update hand with discard info
  if (game._dbHandId) {
    updateHand(game._dbHandId, {
      dealerDiscardCard: `${decision.card.rank}${decision.card.suit}`,
    });
  }

  return decisionId;
}

/**
 * Log a card play decision
 */
export function logCardPlayDecision(
  game: TrackedGameState,
  position: Position,
  modelId: string,
  decision: {
    card: Card;
    reasoning: string;
    confidence: number;
    duration?: number;
    toolRequested?: string;
    toolUsed?: string;
    illegalAttempt?: { card: Card };
    isFallback?: boolean;
  }
): number | null {
  if (!isDbAvailable() || !game._dbHandId) {
    return null;
  }

  const trickNumber = game.completedTricks.length + 1;

  const decisionId = logDecision({
    handId: game._dbHandId,
    decisionType: "card_play",
    agentPosition: position,
    modelId,
    action: `${decision.card.rank}${decision.card.suit}`,
    reasoning: decision.reasoning,
    confidence: decision.confidence,
    toolRequested: decision.toolRequested,
    toolUsed: decision.toolUsed,
    wasLegal: !decision.isFallback,
    trickNumber,
    decisionTimeMs: decision.duration,
    createdAt: Date.now(),
  });

  // Store decision ID for later outcome update
  if (decisionId && game._dbDecisionIds) {
    const key = `card_play_${position}_${game.handNumber}_${trickNumber}`;
    game._dbDecisionIds[key] = decisionId;
  }

  return decisionId;
}

/**
 * Log a tool execution
 */
export function logTool(
  game: TrackedGameState,
  decisionId: number,
  position: Position,
  tool: {
    name: string;
    success: boolean;
    result: string;
    cost: number;
    duration: number;
  }
): number | null {
  if (!isDbAvailable()) {
    return null;
  }

  return logToolExecution({
    decisionId,
    toolName: tool.name,
    agentPosition: position,
    success: tool.success,
    result: tool.result,
    costPoints: tool.cost,
    executionTimeMs: tool.duration,
    createdAt: Date.now(),
  });
}

/**
 * Update decision outcomes after a trick completes
 * Marks winners' decisions as successful, losers' as not
 */
export function updateTrickOutcomes(
  game: TrackedGameState,
  trickWinner: Position,
  trickNumber: number
): void {
  if (!isDbAvailable() || !game._dbDecisionIds) {
    return;
  }

  // Determine which team won this trick
  const winningTeam = trickWinner === "north" || trickWinner === "south" ? 1 : 2;

  // Update all card play decisions for this trick
  const positions: Position[] = ["north", "east", "south", "west"];
  for (const pos of positions) {
    const key = `card_play_${pos}_${game.handNumber}_${trickNumber}`;
    const decisionId = game._dbDecisionIds[key];

    if (decisionId) {
      const playerTeam = pos === "north" || pos === "south" ? 1 : 2;
      const wasSuccessful = playerTeam === winningTeam;
      updateDecisionOutcome(decisionId, wasSuccessful);
    }
  }
}

/**
 * Update trump bid outcomes when trump is set
 * The maker's bid is successful if trump gets set
 */
export function updateTrumpBidOutcomes(
  game: TrackedGameState,
  trumpMaker: Position
): void {
  if (!isDbAvailable() || !game._dbDecisionIds || !game._dbHandId) {
    return;
  }

  // Mark the trump maker's bid as successful
  const makerKey = `trump_bid_${trumpMaker}_${game.handNumber}`;
  const makerId = game._dbDecisionIds[makerKey];
  if (makerId) {
    updateDecisionOutcome(makerId, true);
  }

  // Mark all pass bids as "successful" too (they made correct assessment)
  // Bids before the maker are passes that were strategically correct
  const positions: Position[] = ["north", "east", "south", "west"];
  for (const pos of positions) {
    if (pos === trumpMaker) continue;
    const key = `trump_bid_${pos}_${game.handNumber}`;
    const decisionId = game._dbDecisionIds[key];
    // Pass decisions - mark as successful since they correctly assessed their hand
    if (decisionId) {
      updateDecisionOutcome(decisionId, true);
    }
  }

  // Update hand with trump info
  if (game._dbHandId && game.trump) {
    updateHand(game._dbHandId, {
      trumpSuit: game.trump,
      trumpMakerPosition: POSITION_INDEX[trumpMaker],
      goingAlone: !!game.goingAlone, // goingAlone is Position or undefined, convert to boolean
      goingAlonePosition: game.goingAlone ? POSITION_INDEX[game.goingAlone] : undefined,
    });
  }
}

/**
 * Create a new hand record when starting a new hand
 */
export function startNewHand(game: TrackedGameState): TrackedGameState {
  if (!isDbAvailable() || !game._dbGameId) {
    return game;
  }

  const handId = createHand({
    gameId: game._dbGameId,
    handNumber: game.handNumber,
    dealerPosition: POSITION_INDEX[game.dealer],
    createdAt: Date.now(),
  });

  game._dbHandId = handId;
  game._dbDecisionIds = {}; // Reset decision tracking for new hand

  // Store turned up card if available
  const turnedUpCard = game.trumpSelection?.turnedUpCard;
  if (turnedUpCard && handId) {
    updateHand(handId, {
      turnedUpCard: `${turnedUpCard.rank}${turnedUpCard.suit}`,
    });
  }

  console.log(`[GameTracker] Started new hand ${handId}`);
  return game;
}

/**
 * Complete a hand with final scores
 */
export function completeHandTracking(
  game: TrackedGameState,
  team1Tricks: number,
  team2Tricks: number,
  team1Points: number,
  team2Points: number
): void {
  if (!isDbAvailable() || !game._dbHandId) {
    return;
  }

  // Determine if the making team was euchred
  const makerTeam = game.trumpCaller === "north" || game.trumpCaller === "south" ? 1 : 2;
  const makerTricks = makerTeam === 1 ? team1Tricks : team2Tricks;
  const euchred = makerTricks < 3;

  updateHand(game._dbHandId, {
    team1Tricks,
    team2Tricks,
    team1Points,
    team2Points,
    euchred,
  });
}

/**
 * Complete game tracking
 * Calculates calibration stats and saves everything
 */
export function completeGameTracking(
  game: TrackedGameState,
  team1Score: number,
  team2Score: number
): void {
  if (!isDbAvailable() || !game._dbGameId) {
    return;
  }

  const now = Date.now();
  const duration = game._gameStartTime ? now - game._gameStartTime : 0;
  const winner: "team1" | "team2" = team1Score > team2Score ? "team1" : "team2";

  // Complete the game record
  completeGame(game._dbGameId, {
    team1Score,
    team2Score,
    winner,
    totalHands: game.handNumber,
    completedAt: now,
    durationMs: duration,
  });

  // Calculate and save calibration stats
  const calibrationStats = calculateCalibrationStats(game._dbGameId);
  if (calibrationStats.length > 0) {
    saveCalibrationAnalysis(game._dbGameId, calibrationStats);
  }

  console.log(
    `[GameTracker] Completed game ${game._dbGameId}: ${winner} wins ${team1Score}-${team2Score}`
  );
}

/**
 * Check if a game needs tracking initialization
 */
export function needsTracking(game: GameState): boolean {
  const tracked = game as TrackedGameState;
  return tracked._dbGameId === undefined;
}

/**
 * Get the current DB game ID (for debugging)
 */
export function getGameId(game: GameState): number | null {
  return (game as TrackedGameState)._dbGameId ?? null;
}

/**
 * Get the current DB hand ID (for debugging)
 */
export function getHandId(game: GameState): number | null {
  return (game as TrackedGameState)._dbHandId ?? null;
}
