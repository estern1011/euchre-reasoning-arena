import { createNewGame } from "../../lib/game/game";
import type { GameState } from "../../lib/game/types";
import { NewGameRequestSchema } from "../schemas/game-schemas";
import { getDefaultModelIdsArray } from "../../lib/config/defaults";

/**
 * API endpoint to create a new game
 */

interface NewGameResponse {
  gameState: GameState;
  message: string;
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
  const modelIds = body.modelIds || getDefaultModelIdsArray();
  const dealer = body.dealer || "north";

  const gameState = createNewGame(modelIds, dealer);

  return {
    gameState,
    message: `New game created with ${modelIds.join(", ")}. Dealer: ${dealer}. First bidder: ${gameState.trumpSelection?.currentBidder}`,
  };
});
