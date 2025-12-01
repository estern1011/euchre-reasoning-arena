import { createNewGame } from "~/lib/game/game";
import type { GameState, Position } from "~/lib/game/types";

/**
 * API endpoint to create a new game
 */

interface NewGameRequest {
  modelIds: [string, string, string, string];
  dealer?: Position;
}

interface NewGameResponse {
  gameState: GameState;
  message: string;
}

export default defineEventHandler(async (event): Promise<NewGameResponse> => {
  const body = await readBody<NewGameRequest>(event);

  const modelIds = body.modelIds || ["gpt-4", "claude-3-5-sonnet", "gemini-1.5-pro", "gpt-3.5-turbo"];
  const dealer = body.dealer || "north";

  const gameState = createNewGame(modelIds, dealer);

  return {
    gameState,
    message: `New game created with ${modelIds.join(", ")}. Dealer: ${dealer}. First bidder: ${gameState.trumpSelection?.currentBidder}`,
  };
});
