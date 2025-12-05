import { createNewGame } from "../../lib/game/game";
import type { GameState, Position } from "../../lib/game/types";
import { NewGameRequestSchema } from "../schemas/game-schemas";
import { getDefaultModelIdsArray } from "../../lib/config/defaults";

/**
 * API endpoint to create a new game
 * Returns pure structured data - frontend handles display formatting
 */

export interface NewGameResponse {
  gameState: GameState;
  metadata: {
    modelIds: [string, string, string, string];
    dealer: Position;
    firstBidder: Position;
  };
}

export default defineEventHandler(async (event): Promise<NewGameResponse> => {
  const rawBody = await readBody(event);

  // Validate request body with Zod
  const parseResult = NewGameRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request body",
      data: parseResult.error.flatten(),
    });
  }

  const body = parseResult.data;
  const modelIds = (body.modelIds || getDefaultModelIdsArray()) as [string, string, string, string];
  const dealer = (body.dealer || "north") as Position;
  const winningScore = body.winningScore || 10;

  const gameState = createNewGame(modelIds, dealer, winningScore);

  return {
    gameState,
    metadata: {
      modelIds,
      dealer,
      firstBidder: gameState.trumpSelection!.currentBidder,
    },
  };
});
