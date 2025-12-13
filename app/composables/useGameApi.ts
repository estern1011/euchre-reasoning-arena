import { useMutation } from "@tanstack/vue-query";
import { useGameStore } from "~/stores/game";
import type { GameState, Position } from "~/types/game";

/**
 * Response type for new game API endpoint
 */
export interface NewGameResponse {
  gameState: GameState;
  metadata: {
    modelIds: [string, string, string, string];
    dealer: Position;
    firstBidder: Position;
  };
}

/**
 * API client functions for game endpoints
 * These are pure functions that return structured data
 */

export interface CreateGameParams {
  modelIds: [string, string, string, string];
  dealer?: Position;
  winningScore?: number;
}

async function createGame(params: CreateGameParams): Promise<NewGameResponse> {
  const response = await fetch("/api/new-game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modelIds: params.modelIds,
      dealer: params.dealer || "north",
      winningScore: params.winningScore || 10,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.statusMessage || `Failed to create game: ${response.statusText}`);
  }

  return response.json();
}

/**
 * TanStack Query composable for game API operations
 */
export function useGameApi() {
  const gameStore = useGameStore();

  // Create new game mutation
  const createGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: (data) => {
      // Update the store with the new game state
      gameStore.setGameState(data.gameState);
    },
    onError: (error) => {
      console.error("Failed to create game:", error);
    },
  });

  /**
   * Initialize a new game
   */
  async function initializeGame(
    modelIds: [string, string, string, string],
    dealer?: Position,
    winningScore?: number
  ): Promise<NewGameResponse> {
    return createGameMutation.mutateAsync({ modelIds, dealer, winningScore });
  }

  return {
    // Mutations
    createGameMutation,

    // Helper functions
    initializeGame,

    // Derived state
    isCreatingGame: createGameMutation.isPending,
    createGameError: createGameMutation.error,
  };
}
