import { ref, computed } from "vue";
import type { GameState } from "~/lib/game/types";

/**
 * Main game state management composable
 * Provides centralized state storage and validation
 */

const gameState = ref<GameState | null>(null);
const modelIds = ref<[string, string, string, string] | null>(null);

export function useGameState() {
  /**
   * Initialize the game state
   */
  function setGameState(state: GameState) {
    gameState.value = state;
  }

  /**
   * Set model IDs for the game
   */
  function setModelIds(ids: [string, string, string, string]) {
    modelIds.value = ids;
  }

  /**
   * Clear the game state (for resetting)
   */
  function clearGameState() {
    gameState.value = null;
    modelIds.value = null;
  }

  /**
   * Check if game state is initialized
   */
  const isInitialized = computed(() => gameState.value !== null);

  /**
   * Check if game is complete
   */
  const isGameComplete = computed(() => gameState.value?.phase === "complete");

  /**
   * Current game phase
   */
  const currentPhase = computed(() => gameState.value?.phase || null);

  /**
   * Current scores
   */
  const scores = computed(() => gameState.value?.scores || [0, 0]);

  /**
   * Current trump suit
   */
  const trump = computed(() => gameState.value?.trump || null);

  /**
   * Validate game state structure
   */
  function validateGameState(state: any): state is GameState {
    return (
      state &&
      typeof state.id === "string" &&
      typeof state.phase === "string" &&
      Array.isArray(state.players) &&
      state.players.length === 4 &&
      Array.isArray(state.scores) &&
      state.scores.length === 2
    );
  }

  return {
    // State
    gameState: computed(() => gameState.value),
    modelIds: computed(() => modelIds.value),

    // Actions
    setGameState,
    setModelIds,
    clearGameState,

    // Computed
    isInitialized,
    isGameComplete,
    currentPhase,
    scores,
    trump,

    // Utilities
    validateGameState,
  };
}
