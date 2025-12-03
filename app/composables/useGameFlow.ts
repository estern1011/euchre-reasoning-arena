import { ref, computed } from "vue";
import { useGameState } from "./useGameState";
import { useErrorHandling } from "./useErrorHandling";
import type { GameState, Position } from "~/lib/game/types";

/**
 * Game flow control composable
 * Handles game initialization, round progression, and reset
 */

export interface AIDecision {
  player: Position;
  modelId: string;
  reasoning: string;
  duration: number;
}

export interface PlayNextRoundResponse {
  gameState: GameState;
  phase: string;
  decisions: AIDecision[];
  roundSummary: string;
}

const isLoading = ref(false);
const currentRoundDecisions = ref<AIDecision[]>([]);
const roundSummary = ref<string>("");

export function useGameFlow() {
  const { setGameState, setModelIds, clearGameState, gameState } = useGameState();
  const { withRetry, setError } = useErrorHandling();

  /**
   * Initialize a new game
   */
  async function initializeGame(
    modelIdArray: [string, string, string, string],
    dealer?: Position,
  ): Promise<void> {
    try {
      isLoading.value = true;
      currentRoundDecisions.value = [];
      roundSummary.value = "";

      const response = await withRetry(async () => {
        const res = await fetch("/api/new-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelIds: modelIdArray,
            dealer: dealer || "north",
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create game: ${res.statusText}`);
        }

        return res.json();
      });

      setGameState(response.gameState);
      setModelIds(modelIdArray);
      roundSummary.value = response.message || "Game initialized";
    } catch (error) {
      console.error("Failed to initialize game:", error);
      setError(
        "api_error",
        error instanceof Error ? error.message : "Failed to initialize game",
      );
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Play the next round (trump bid or trick)
   */
  async function playNextRound(): Promise<PlayNextRoundResponse | null> {
    if (!gameState.value) {
      setError("unknown", "Game state not initialized", false);
      return null;
    }

    try {
      isLoading.value = true;
      currentRoundDecisions.value = [];

      const response = await withRetry(async () => {
        const res = await fetch("/api/play-next-round", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameState: gameState.value,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to play round: ${res.statusText}`);
        }

        return res.json() as Promise<PlayNextRoundResponse>;
      });

      // Update game state
      setGameState(response.gameState);
      currentRoundDecisions.value = response.decisions;
      roundSummary.value = response.roundSummary;

      return response;
    } catch (error) {
      console.error("Failed to play round:", error);
      setError(
        "api_error",
        error instanceof Error ? error.message : "Failed to play round",
      );
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Reset the game and return to landing page
   */
  function resetGame() {
    clearGameState();
    currentRoundDecisions.value = [];
    roundSummary.value = "";
    isLoading.value = false;

    // Navigate to landing page
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  /**
   * Check if we're in trump selection phase
   */
  const isTrumpSelection = computed(
    () => gameState.value?.phase === "trump_selection",
  );

  /**
   * Check if we're in playing phase
   */
  const isPlaying = computed(() => gameState.value?.phase === "playing");

  /**
   * Check if game is complete
   */
  const isComplete = computed(() => gameState.value?.phase === "complete");

  return {
    // State
    isLoading: computed(() => isLoading.value),
    currentRoundDecisions: computed(() => currentRoundDecisions.value),
    roundSummary: computed(() => roundSummary.value),

    // Computed
    isTrumpSelection,
    isPlaying,
    isComplete,

    // Actions
    initializeGame,
    playNextRound,
    resetGame,
  };
}
