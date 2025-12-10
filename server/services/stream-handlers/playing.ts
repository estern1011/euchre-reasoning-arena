import type { Position } from "../../../lib/game/types";
import { playCard, getNextPlayer } from "../../../lib/game/game";
import {
  logCardPlayDecision,
  updateTrickOutcomes,
  completeHandTracking,
  completeGameTracking,
  type TrackedGameState,
} from "../game-tracker";
import type { StreamContext, PhaseResult, DecisionRecord } from "./types";

/**
 * Handle playing phase - one trick at a time
 * Processes all card plays for the current trick
 */
export async function handlePlayingPhase(ctx: StreamContext): Promise<PhaseResult> {
  let game = ctx.game;
  const decisions: DecisionRecord[] = [];
  const expectedPlays = game.goingAlone ? 3 : 4;

  for (let i = 0; i < expectedPlays; i++) {
    const currentPlayer = getNextPlayer(game);
    const playerObj = game.players.find(
      (p: { position: Position }) => p.position === currentPlayer
    )!;

    ctx.sendEvent("player_thinking", {
      player: currentPlayer,
      modelId: playerObj.modelId,
    });

    const { makeCardPlayDecisionStreaming } = await import("../ai-agent");

    // Create tool callbacks for Metacognition Arena
    const toolCallbacks = createToolCallbacks(ctx, currentPlayer, playerObj.modelId);

    const playResult = await makeCardPlayDecisionStreaming(
      game,
      currentPlayer,
      playerObj.modelId,
      (token) => {
        ctx.sendEvent("reasoning_token", {
          player: currentPlayer,
          token,
        });
      },
      undefined, // customPrompt
      toolCallbacks
    );

    // Send illegal attempt event if one occurred
    if (playResult.illegalAttempt) {
      ctx.sendEvent("illegal_attempt", {
        player: currentPlayer,
        modelId: playerObj.modelId,
        attemptedCard: playResult.illegalAttempt.card,
        isFallback: playResult.isFallback,
      });
    }

    ctx.sendEvent("decision_made", {
      player: currentPlayer,
      modelId: playerObj.modelId,
      card: playResult.card,
      reasoning: playResult.reasoning,
      confidence: playResult.confidence,
      duration: playResult.duration,
      illegalAttempt: playResult.illegalAttempt,
      isFallback: playResult.isFallback,
      toolUsed: playResult.toolUsed,
    });

    // Log card play to database
    logCardPlayDecision(game, currentPlayer, playerObj.modelId, {
      card: playResult.card,
      reasoning: playResult.reasoning,
      confidence: playResult.confidence,
      duration: playResult.duration,
      toolUsed: playResult.toolUsed?.tool,
      illegalAttempt: playResult.illegalAttempt,
      isFallback: playResult.isFallback,
    });

    decisions.push({
      player: currentPlayer,
      modelId: playerObj.modelId,
      card: playResult.card,
      reasoning: playResult.reasoning,
      duration: playResult.duration,
    });

    game = playCard(game, currentPlayer, playResult.card, playResult.reasoning);
  }

  // Process trick completion
  const lastTrick = game.completedTricks[game.completedTricks.length - 1];
  if (!lastTrick) {
    throw new Error("No completed trick found after playing cards");
  }

  const trickWinner = lastTrick.winner as Position;
  const trickNumber = game.completedTricks.length;

  // Update decision outcomes now that we know who won the trick
  updateTrickOutcomes(game, trickWinner, trickNumber);

  // Send appropriate completion event based on game state
  sendTrickCompletionEvent(ctx, game, decisions, trickWinner, trickNumber);

  return { game, decisions };
}

/**
 * Create tool callbacks for the Metacognition Arena
 */
function createToolCallbacks(
  ctx: StreamContext,
  currentPlayer: Position,
  modelId: string
) {
  return {
    onToolRequest: (request: { tool: string; player: Position; cost: number }) => {
      ctx.sendEvent("tool_request", {
        player: currentPlayer,
        modelId,
        tool: request.tool,
        cost: request.cost,
      });
    },
    onToolProgress: (message: string) => {
      ctx.sendEvent("tool_progress", {
        player: currentPlayer,
        message,
      });
    },
    onToolResult: (result: any) => {
      ctx.sendEvent("tool_result", {
        player: currentPlayer,
        tool: result.tool,
        result: result.result,
        cost: result.cost,
        duration: result.duration,
      });
    },
    onResponsePhase: () => {
      ctx.sendEvent("response_phase", {
        player: currentPlayer,
      });
    },
  };
}

/**
 * Send the appropriate completion event based on current game state
 */
function sendTrickCompletionEvent(
  ctx: StreamContext,
  game: TrackedGameState,
  decisions: DecisionRecord[],
  trickWinner: Position,
  trickNumber: number
): void {
  if (game.phase === "game_complete") {
    // Complete hand tracking first
    completeHandTracking(
      game,
      game.scores[0],
      game.scores[1],
      game.scores[0],
      game.scores[1]
    );

    // Complete game tracking with calibration calculation
    completeGameTracking(game, game.gameScores[0], game.gameScores[1]);

    ctx.sendEvent("round_complete", {
      gameState: game,
      phase: "game_complete",
      decisions,
      trickWinner,
      trickNumber,
      handScores: game.scores,
      gameScores: game.gameScores,
      handNumber: game.handNumber,
      winningTeam: game.gameScores[0] > game.gameScores[1] ? 0 : 1,
    });
  } else if (game.phase === "hand_complete") {
    // Complete hand tracking
    completeHandTracking(
      game,
      game.scores[0],
      game.scores[1],
      game.scores[0],
      game.scores[1]
    );

    ctx.sendEvent("round_complete", {
      gameState: game,
      phase: "hand_complete",
      decisions,
      trickWinner,
      trickNumber,
      handScores: game.scores,
      gameScores: game.gameScores,
      handNumber: game.handNumber,
    });
  } else {
    // Normal trick complete, hand continues
    ctx.sendEvent("round_complete", {
      gameState: game,
      phase: "playing_trick",
      decisions,
      trickWinner,
      trickNumber,
    });
  }
}
