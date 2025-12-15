import { createNewGame } from "../../lib/game/game";
import type { GameState } from "../../lib/game/types";
import { getDefaultModelIdsArray } from "../../lib/config/defaults";
import { PlayNextRoundRequestSchema } from "../schemas/game-schemas";
import {
  handleTrumpSelection,
  handlePlayingPhase,
  handleHandComplete,
  handleGameComplete,
  type StreamContext,
} from "../services/stream-handlers";
import type { PromptOptions } from "../services/ai-agent/prompts";

/**
 * SSE streaming endpoint for real-time AI reasoning
 * Returns pure structured data - frontend handles display formatting
 *
 * Refactored to use modular phase handlers for clarity and testability.
 */

export default defineEventHandler(async (event) => {
  const rawBody = await readBody(event);

  // Validate request body with Zod
  const parseResult = PlayNextRoundRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request body",
      data: parseResult.error.flatten(),
    });
  }

  const body = parseResult.data;

  // Extract options (with defaults)
  const promptOptions: PromptOptions = {
    promptPresets: body.options?.promptPresets ?? {
      north: 'neutral',
      east: 'neutral',
      south: 'neutral',
      west: 'neutral',
    },
    agentReflections: body.options?.agentReflections,
  };

  // Initialize game state
  const game: GameState = body.gameState
    ? (body.gameState as GameState)
    : createNewGame(body.modelIds || getDefaultModelIdsArray());

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: Record<string, unknown>) => {
        const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      const ctx: StreamContext = { sendEvent, game, promptOptions };

      try {
        await processGamePhase(ctx);
        controller.close();
      } catch (error: any) {
        console.error("SSE Stream Error:", error);
        sendEvent("error", { message: error.message || "An error occurred" });
        controller.close();
      }
    },
  });

  return sendStream(event, stream);
});

/**
 * Route to the appropriate phase handler based on current game state
 */
async function processGamePhase(ctx: StreamContext): Promise<void> {
  switch (ctx.game.phase) {
    case "trump_selection":
      await handleTrumpSelection(ctx);
      break;

    case "playing":
      await handlePlayingPhase(ctx);
      break;

    case "hand_complete":
      await handleHandComplete(ctx);
      break;

    case "game_complete":
      await handleGameComplete(ctx);
      break;

    default:
      throw new Error(`Unknown game phase: ${ctx.game.phase}`);
  }
}
