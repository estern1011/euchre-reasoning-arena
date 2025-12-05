import { computed } from "vue";
import { useGameStore } from "../stores/game";
import { useErrorHandling } from "./useErrorHandling";
import type { GameState, Position } from "../../lib/game/types";

/**
 * Game flow control composable
 * Handles game initialization, round progression, and reset
 * Uses Nuxt's useState for SSR-safe singleton state
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

export function useGameFlow() {
  // Use Nuxt's useState for SSR-safe singleton state
  const isLoading = useState<boolean>("game-flow-loading", () => false);
  const currentRoundDecisions = useState<AIDecision[]>("game-flow-decisions", () => []);
  const roundSummary = useState<string>("game-flow-summary", () => "");

  const gameStore = useGameStore();
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

      gameStore.setGameState(response.gameState);
      // Response now returns structured metadata instead of formatted message
      // Frontend handles display formatting
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
    if (!gameStore.gameState) {
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
            gameState: gameStore.gameState,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to play round: ${res.statusText}`);
        }

        return res.json() as Promise<PlayNextRoundResponse>;
      });

      // Update game state
      gameStore.setGameState(response.gameState);
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
    gameStore.reset();
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
    () => gameStore.phase === "trump_selection",
  );

  /**
   * Check if we're in playing phase
   */
  const isPlaying = computed(() => gameStore.phase === "playing");

  /**
   * Check if game is complete
   */
  const isComplete = computed(() => gameStore.phase === "game_complete");

  /**
   * Check if hand is complete (not game)
   */
  const isHandComplete = computed(() => gameStore.phase === "hand_complete");

  return {
    // State
    isLoading: computed(() => isLoading.value),
    currentRoundDecisions: computed(() => currentRoundDecisions.value),
    roundSummary: computed(() => roundSummary.value),

    // Computed
    isTrumpSelection,
    isPlaying,
    isComplete,
    isHandComplete,

    // Actions
    initializeGame,
    playNextRound,
    resetGame,
  };
}
