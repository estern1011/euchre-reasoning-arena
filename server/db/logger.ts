/**
 * Decision and game logging for Metacognition Arena
 * Tracks all AI decisions with confidence scores and tool usage
 *
 * All functions are no-ops when database is unavailable (Vercel production)
 */

import { POSITION_INDEX, type Position } from "../../lib/game/types";
import getDb, { isDatabaseAvailable } from "./client";

export interface GameRecord {
  id?: number;
  northModel: string;
  eastModel: string;
  southModel: string;
  westModel: string;
  winningScore: number;
  presetName?: string;
  startedAt: number;
}

export interface HandRecord {
  id?: number;
  gameId: number;
  handNumber: number;
  trumpSuit?: string;
  trumpMakerPosition?: number;
  turnedUpCard?: string;
  dealerPosition: number;
  dealerDiscardCard?: string;
  createdAt: number;
}

export interface DecisionRecord {
  id?: number;
  handId: number;
  decisionType: "trump_bid" | "card_play" | "discard";
  agentPosition: Position;
  modelId: string;
  action: string;
  reasoning: string;
  confidence: number;
  toolRequested?: string;
  toolUsed?: string;
  wasLegal: boolean;
  wasSuccessful?: boolean; // Did this decision lead to good outcome?
  trickNumber?: number;
  trumpRound?: number;
  decisionTimeMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  gameState?: string;
  legalOptions?: string[];
  createdAt: number;
}

export interface ToolExecutionRecord {
  id?: number;
  decisionId: number;
  toolName: string;
  agentPosition: Position;
  success: boolean;
  result: string;
  costPoints: number;
  executionTimeMs: number;
  decisionChanged?: boolean;
  improvedOutcome?: boolean;
  createdAt: number;
}

export interface CalibrationBucket {
  confidenceRange: string;
  totalDecisions: number;
  successfulDecisions: number;
  successRate: number;
}

export interface ModelCalibrationStats {
  modelId: string;
  position: Position;
  totalDecisions: number;
  averageConfidence: number;
  actualSuccessRate: number;
  calibrationScore: number;
  brierScore: number; // Lower is better
  toolUsageRate: number;
  buckets: CalibrationBucket[];
}

// ============================================================================
// Game & Hand Management
// ============================================================================

/** Create a new game record */
export function createGame(game: GameRecord): number | null {
  const db = getDb();
  if (!db) return null;

  const stmt = db.prepare(`
    INSERT INTO games (
      north_model, east_model, south_model, west_model,
      winning_score, preset_name, started_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    game.northModel,
    game.eastModel,
    game.southModel,
    game.westModel,
    game.winningScore,
    game.presetName || null,
    game.startedAt,
  );

  return result.lastInsertRowid as number;
}

/** Complete a game with final scores and metrics */
export function completeGame(
  gameId: number,
  data: {
    team1Score: number;
    team2Score: number;
    winner: "team1" | "team2";
    totalHands: number;
    completedAt: number;
    durationMs: number;
    totalInputTokens?: number;
    totalOutputTokens?: number;
    estimatedCostUsd?: number;
  },
): void {
  const db = getDb();
  if (!db) return;

  const stmt = db.prepare(`
    UPDATE games SET
      team1_score = ?,
      team2_score = ?,
      winner = ?,
      total_hands = ?,
      completed_at = ?,
      duration_ms = ?,
      total_input_tokens = ?,
      total_output_tokens = ?,
      estimated_cost_usd = ?
    WHERE id = ?
  `);

  stmt.run(
    data.team1Score,
    data.team2Score,
    data.winner,
    data.totalHands,
    data.completedAt,
    data.durationMs,
    data.totalInputTokens || 0,
    data.totalOutputTokens || 0,
    data.estimatedCostUsd || 0,
    gameId,
  );
}

/** Create a new hand record */
export function createHand(hand: HandRecord): number | null {
  const db = getDb();
  if (!db) return null;

  const stmt = db.prepare(`
    INSERT INTO hands (
      game_id, hand_number, dealer_position, created_at
    ) VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(hand.gameId, hand.handNumber, hand.dealerPosition, hand.createdAt);

  return result.lastInsertRowid as number;
}

/** Update hand with trump and outcome info */
export function updateHand(
  handId: number,
  data: {
    trumpSuit?: string;
    trumpMakerPosition?: number;
    turnedUpCard?: string;
    team1Tricks?: number;
    team2Tricks?: number;
    team1Points?: number;
    team2Points?: number;
    euchred?: boolean;
    goingAlone?: boolean;
    goingAlonePosition?: number;
    dealerDiscardCard?: string;
  },
): void {
  const db = getDb();
  if (!db) return;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.trumpSuit !== undefined) {
    fields.push("trump_suit = ?");
    values.push(data.trumpSuit);
  }
  if (data.trumpMakerPosition !== undefined) {
    fields.push("trump_maker_position = ?");
    values.push(data.trumpMakerPosition);
  }
  if (data.turnedUpCard !== undefined) {
    fields.push("turned_up_card = ?");
    values.push(data.turnedUpCard);
  }
  if (data.team1Tricks !== undefined) {
    fields.push("team1_tricks = ?");
    values.push(data.team1Tricks);
  }
  if (data.team2Tricks !== undefined) {
    fields.push("team2_tricks = ?");
    values.push(data.team2Tricks);
  }
  if (data.team1Points !== undefined) {
    fields.push("team1_points = ?");
    values.push(data.team1Points);
  }
  if (data.team2Points !== undefined) {
    fields.push("team2_points = ?");
    values.push(data.team2Points);
  }
  if (data.euchred !== undefined) {
    fields.push("euchred = ?");
    values.push(data.euchred ? 1 : 0);
  }
  if (data.goingAlone !== undefined) {
    fields.push("going_alone = ?");
    values.push(data.goingAlone ? 1 : 0);
  }
  if (data.goingAlonePosition !== undefined) {
    fields.push("going_alone_position = ?");
    values.push(data.goingAlonePosition);
  }
  if (data.dealerDiscardCard !== undefined) {
    fields.push("dealer_discard_card = ?");
    values.push(data.dealerDiscardCard);
  }

  if (fields.length === 0) return;

  values.push(handId);
  const stmt = db.prepare(`UPDATE hands SET ${fields.join(", ")} WHERE id = ?`);
  stmt.run(...values);
}

// ============================================================================
// Decision Logging
// ============================================================================

/** Log a decision with confidence score and outcome */
export function logDecision(decision: DecisionRecord): number | null {
  const db = getDb();
  if (!db) return null;

  const stmt = db.prepare(`
    INSERT INTO decisions (
      hand_id, decision_type, agent_position, model_id,
      action, reasoning, confidence, tool_requested, tool_used,
      was_legal, was_successful, trick_number, trump_round,
      decision_time_ms, input_tokens, output_tokens,
      game_state, legal_options, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    decision.handId,
    decision.decisionType,
    POSITION_INDEX[decision.agentPosition],
    decision.modelId,
    decision.action,
    decision.reasoning,
    decision.confidence,
    decision.toolRequested || null,
    decision.toolUsed || null,
    decision.wasLegal ? 1 : 0,
    decision.wasSuccessful !== undefined ? (decision.wasSuccessful ? 1 : 0) : null,
    decision.trickNumber || null,
    decision.trumpRound || null,
    decision.decisionTimeMs || null,
    decision.inputTokens || null,
    decision.outputTokens || null,
    decision.gameState || null,
    decision.legalOptions ? JSON.stringify(decision.legalOptions) : null,
    decision.createdAt,
  );

  return result.lastInsertRowid as number;
}

/** Update decision outcome after the fact (e.g., after trick is complete) */
export function updateDecisionOutcome(decisionId: number, wasSuccessful: boolean): void {
  const db = getDb();
  if (!db) return;

  const stmt = db.prepare("UPDATE decisions SET was_successful = ? WHERE id = ?");
  stmt.run(wasSuccessful ? 1 : 0, decisionId);
}

/** Log a tool execution */
export function logToolExecution(tool: ToolExecutionRecord): number | null {
  const db = getDb();
  if (!db) return null;

  const stmt = db.prepare(`
    INSERT INTO tool_executions (
      decision_id, tool_name, agent_position,
      success, result, cost_points, execution_time_ms,
      decision_changed, improved_outcome, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    tool.decisionId,
    tool.toolName,
    POSITION_INDEX[tool.agentPosition],
    tool.success ? 1 : 0,
    tool.result,
    tool.costPoints,
    tool.executionTimeMs,
    tool.decisionChanged !== undefined ? (tool.decisionChanged ? 1 : 0) : null,
    tool.improvedOutcome !== undefined ? (tool.improvedOutcome ? 1 : 0) : null,
    tool.createdAt,
  );

  return result.lastInsertRowid as number;
}

// ============================================================================
// Calibration Analysis
// ============================================================================

/** Calculate calibration stats for a model in a game */
export function calculateCalibrationStats(gameId: number): ModelCalibrationStats[] {
  const db = getDb();
  if (!db) return [];

  // Get all decisions for this game with their outcomes
  const decisions = db.prepare(`
    SELECT
      d.agent_position,
      d.model_id,
      d.confidence,
      d.was_successful,
      d.tool_requested
    FROM decisions d
    JOIN hands h ON d.hand_id = h.id
    WHERE h.game_id = ? AND d.was_successful IS NOT NULL
  `).all(gameId) as Array<{
    agent_position: number;
    model_id: string;
    confidence: number;
    was_successful: number;
    tool_requested: string | null;
  }>;

  // Group by position
  const byPosition = new Map<number, typeof decisions>();
  for (const d of decisions) {
    if (!byPosition.has(d.agent_position)) {
      byPosition.set(d.agent_position, []);
    }
    byPosition.get(d.agent_position)!.push(d);
  }

  const positions: Position[] = ["north", "east", "south", "west"];
  const stats: ModelCalibrationStats[] = [];

  for (const [posIdx, posDecisions] of byPosition) {
    if (posDecisions.length === 0) continue;

    const modelId = posDecisions[0]!.model_id;
    const position = positions[posIdx]!;

    // Calculate overall stats
    const totalDecisions = posDecisions.length;
    const avgConfidence = posDecisions.reduce((s, d) => s + d.confidence, 0) / totalDecisions;
    const successfulDecisions = posDecisions.filter(d => d.was_successful).length;
    const actualSuccessRate = successfulDecisions / totalDecisions;

    // Calculate Brier score (lower is better)
    // Brier = mean((confidence/100 - outcome)^2)
    const brierScore = posDecisions.reduce((sum, d) => {
      const predicted = d.confidence / 100;
      const actual = d.was_successful ? 1 : 0;
      return sum + Math.pow(predicted - actual, 2);
    }, 0) / totalDecisions;

    // Calibration score = 100 - (Brier * 100) - encourages good calibration
    const calibrationScore = Math.max(0, 100 - brierScore * 100);

    // Tool usage rate
    const toolUsageRate = posDecisions.filter(d => d.tool_requested && d.tool_requested !== "none").length / totalDecisions;

    // Calculate buckets for calibration curve
    const buckets = calculateBuckets(posDecisions);

    stats.push({
      modelId,
      position,
      totalDecisions,
      averageConfidence: Math.round(avgConfidence * 10) / 10,
      actualSuccessRate: Math.round(actualSuccessRate * 1000) / 10,
      calibrationScore: Math.round(calibrationScore * 10) / 10,
      brierScore: Math.round(brierScore * 1000) / 1000,
      toolUsageRate: Math.round(toolUsageRate * 1000) / 10,
      buckets,
    });
  }

  return stats;
}

/** Calculate confidence buckets for calibration curve */
function calculateBuckets(decisions: Array<{ confidence: number; was_successful: number }>): CalibrationBucket[] {
  const bucketRanges = [
    { min: 0, max: 20, label: "0-20%" },
    { min: 20, max: 40, label: "20-40%" },
    { min: 40, max: 60, label: "40-60%" },
    { min: 60, max: 80, label: "60-80%" },
    { min: 80, max: 100, label: "80-100%" },
  ];

  return bucketRanges.map(range => {
    const inBucket = decisions.filter(d => d.confidence >= range.min && d.confidence < range.max);
    const successful = inBucket.filter(d => d.was_successful).length;

    return {
      confidenceRange: range.label,
      totalDecisions: inBucket.length,
      successfulDecisions: successful,
      successRate: inBucket.length > 0 ? Math.round((successful / inBucket.length) * 1000) / 10 : 0,
    };
  });
}

/** Save calibration analysis to database */
export function saveCalibrationAnalysis(gameId: number, stats: ModelCalibrationStats[]): void {
  const db = getDb();
  if (!db) return;

  const positions: Position[] = ["north", "east", "south", "west"];
  const stmt = db.prepare(`
    INSERT INTO calibration_analysis (
      game_id, agent_position, model_id,
      total_decisions, average_confidence, actual_success_rate, calibration_score,
      low_conf_decisions, low_conf_success_rate,
      medium_conf_decisions, medium_conf_success_rate,
      high_conf_decisions, high_conf_success_rate,
      total_tool_requests, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of stats) {
    const lowBuckets = s.buckets.filter(b => b.confidenceRange === "0-20%" || b.confidenceRange === "20-40%");
    const medBuckets = s.buckets.filter(b => b.confidenceRange === "40-60%");
    const highBuckets = s.buckets.filter(b => b.confidenceRange === "60-80%" || b.confidenceRange === "80-100%");

    const lowTotal = lowBuckets.reduce((s, b) => s + b.totalDecisions, 0);
    const lowSuccess = lowBuckets.reduce((s, b) => s + b.successfulDecisions, 0);
    const medTotal = medBuckets.reduce((s, b) => s + b.totalDecisions, 0);
    const medSuccess = medBuckets.reduce((s, b) => s + b.successfulDecisions, 0);
    const highTotal = highBuckets.reduce((s, b) => s + b.totalDecisions, 0);
    const highSuccess = highBuckets.reduce((s, b) => s + b.successfulDecisions, 0);

    stmt.run(
      gameId,
      positions.indexOf(s.position),
      s.modelId,
      s.totalDecisions,
      s.averageConfidence,
      s.actualSuccessRate,
      s.calibrationScore,
      lowTotal,
      lowTotal > 0 ? (lowSuccess / lowTotal) * 100 : null,
      medTotal,
      medTotal > 0 ? (medSuccess / medTotal) * 100 : null,
      highTotal,
      highTotal > 0 ? (highSuccess / highTotal) * 100 : null,
      Math.round(s.toolUsageRate * s.totalDecisions / 100),
      Date.now(),
    );
  }
}

// ============================================================================
// Query Functions for Stats Page
// ============================================================================

/** Get all completed games with calibration data */
export function getAllGamesWithStats(): Array<{
  id: number;
  presetName: string | null;
  winner: string;
  team1Score: number;
  team2Score: number;
  totalHands: number;
  durationMs: number;
  completedAt: number;
  models: { north: string; east: string; south: string; west: string };
  calibration: ModelCalibrationStats[];
}> {
  const db = getDb();
  if (!db) return [];

  const games = db.prepare(`
    SELECT * FROM games WHERE completed_at IS NOT NULL ORDER BY completed_at DESC
  `).all() as Array<{
    id: number;
    preset_name: string | null;
    winner: string;
    team1_score: number;
    team2_score: number;
    total_hands: number;
    duration_ms: number;
    completed_at: number;
    north_model: string;
    east_model: string;
    south_model: string;
    west_model: string;
  }>;

  return games.map(g => ({
    id: g.id,
    presetName: g.preset_name,
    winner: g.winner,
    team1Score: g.team1_score,
    team2Score: g.team2_score,
    totalHands: g.total_hands,
    durationMs: g.duration_ms,
    completedAt: g.completed_at,
    models: {
      north: g.north_model,
      east: g.east_model,
      south: g.south_model,
      west: g.west_model,
    },
    calibration: calculateCalibrationStats(g.id),
  }));
}

/** Get aggregated stats across all games for a model */
export function getModelAggregateStats(modelId: string): {
  gamesPlayed: number;
  wins: number;
  avgCalibrationScore: number;
  avgConfidence: number;
  avgSuccessRate: number;
  avgToolUsage: number;
} | null {
  const db = getDb();
  if (!db) return null;

  const stats = db.prepare(`
    SELECT
      COUNT(DISTINCT h.game_id) as games_played,
      AVG(d.confidence) as avg_confidence,
      AVG(CASE WHEN d.was_successful = 1 THEN 100.0 ELSE 0.0 END) as avg_success_rate,
      AVG(CASE WHEN d.tool_requested IS NOT NULL AND d.tool_requested != 'none' THEN 100.0 ELSE 0.0 END) as avg_tool_usage
    FROM decisions d
    JOIN hands h ON d.hand_id = h.id
    WHERE d.model_id = ? AND d.was_successful IS NOT NULL
  `).get(modelId) as {
    games_played: number;
    avg_confidence: number | null;
    avg_success_rate: number | null;
    avg_tool_usage: number | null;
  } | undefined;

  if (!stats || !stats.games_played) return null;

  // Calculate wins
  const wins = db.prepare(`
    SELECT COUNT(*) as wins
    FROM games g
    WHERE g.completed_at IS NOT NULL
      AND (
        (g.winner = 'team1' AND (g.north_model = ? OR g.south_model = ?))
        OR (g.winner = 'team2' AND (g.east_model = ? OR g.west_model = ?))
      )
  `).get(modelId, modelId, modelId, modelId) as { wins: number };

  const avgConfidence = stats.avg_confidence ?? 50;
  const avgSuccessRate = stats.avg_success_rate ?? 50;

  // Simple calibration score based on how close confidence matches success rate
  const calibrationDiff = Math.abs(avgConfidence - avgSuccessRate);
  const avgCalibrationScore = Math.max(0, 100 - calibrationDiff);

  return {
    gamesPlayed: stats.games_played,
    wins: wins.wins,
    avgCalibrationScore: Math.round(avgCalibrationScore * 10) / 10,
    avgConfidence: Math.round((stats.avg_confidence ?? 50) * 10) / 10,
    avgSuccessRate: Math.round((stats.avg_success_rate ?? 50) * 10) / 10,
    avgToolUsage: Math.round((stats.avg_tool_usage ?? 0) * 10) / 10,
  };
}

/** Check if database is available */
export function isDbAvailable(): boolean {
  return isDatabaseAvailable() && getDb() !== null;
}
