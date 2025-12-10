import {
  startNewHand,
  completeGameTracking,
  type TrackedGameState,
} from "../game-tracker";
import type { StreamContext, PhaseResult } from "./types";

/**
 * Handle hand_complete phase - start a new hand
 */
export async function handleHandComplete(ctx: StreamContext): Promise<PhaseResult> {
  const game = startNewHand(ctx.game);

  ctx.sendEvent("round_complete", {
    gameState: game,
    phase: "hand_complete",
    decisions: [],
    handScores: game.scores,
    gameScores: game.gameScores,
    handNumber: game.handNumber,
  });

  return { game, decisions: [] };
}

/**
 * Handle game_complete phase - finalize the game
 */
export async function handleGameComplete(ctx: StreamContext): Promise<PhaseResult> {
  const game = ctx.game;

  // Complete game tracking if not already done
  completeGameTracking(game, game.gameScores[0], game.gameScores[1]);

  ctx.sendEvent("round_complete", {
    gameState: game,
    phase: "game_complete",
    decisions: [],
    gameScores: game.gameScores,
    winningTeam: game.gameScores[0] > game.gameScores[1] ? 0 : 1,
  });

  return { game, decisions: [] };
}
