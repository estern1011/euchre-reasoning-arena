<template>
    <div class="game-container">
        <header class="game-header">
            <h1><span class="bracket">&lt;</span>euchre.<span class="accent">arena</span><span class="bracket"> /&gt;</span></h1>
            <span class="live-badge">
                <span class="live-dot"></span>
                LIVE
            </span>
        </header>

        <div class="game-content">
            <!-- Left Panel: Arena -->
            <div class="arena-panel">
                <div class="panel-header">
                    <span class="comment">// </span>arena
                </div>

                <!-- Game State Display & Controls -->
                <div class="game-state-header">
                    <GameStateDisplay
                        :current-phase="currentPhase"
                        :current-trick="currentTrick"
                        :trump-suit="trumpSuit"
                        :last-trick-winner="lastTrickWinner"
                    />
                    <GameControls
                        :disabled="!gameState || isLoading"
                        @play-next="handlePlayNextRound"
                    />
                </div>

                <!-- Table View -->
                <div class="table-view">
                    <div class="table-header"><span class="keyword">const</span> table = {</div>

                    <GameBoard
                        :player-hands="playerHands"
                        :played-cards="playedCards"
                        :formatted-models="formattedModelsByPosition"
                        :turned-up-card="turnedUpCard"
                        :current-player="currentPlayer"
                        :is-streaming="isStreaming"
                    />

                    <!-- Game Controls -->
                    <div class="game-controls">
                        <div v-if="errorMessage" class="alert error mb-4">
                            {{ errorMessage }}
                        </div>
                    </div>
                    <div class="closing-brace">}</div>
                </div>
            </div>

            <!-- Right Panel: Intelligence -->
            <div class="intelligence-panel">
                <div class="panel-header">
                    <span class="comment">// </span>intelligence
                </div>

                <!-- Activity Log -->
                <ActivityLog :entries="activityLog" />

                <!-- Real-Time Streaming Reasoning -->
                <StreamingReasoning
                    :player="currentThinkingPlayer"
                    :reasoning="currentThinkingPlayer ? (streamingReasoning[currentThinkingPlayer] ?? '') : ''"
                />

                <!-- Reasoning History Button -->
                <div class="history-section">
                    <button
                        class="history-button"
                        type="button"
                        @click="showReasoningModal = true"
                    >
                        <span class="button-text">viewHistory()</span>
                        <span class="badge">{{ allDecisions.length }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Reasoning Modal -->
        <ReasoningModal
            :is-open="showReasoningModal"
            :decisions="allDecisions"
            @close="showReasoningModal = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from "vue";
import ReasoningModal from "~/components/ReasoningModal.vue";
import GameStateDisplay from "~/components/GameStateDisplay.vue";
import GameControls from "~/components/GameControls.vue";
import GameBoard from "~/components/GameBoard.vue";
import ActivityLog from "~/components/ActivityLog.vue";
import StreamingReasoning from "~/components/StreamingReasoning.vue";
import { useGameState } from "~/composables/useGameState";
import { useGameFlow } from "~/composables/useGameFlow";
import { useCardDisplay } from "~/composables/useCardDisplay";
import { usePlayerInfo } from "~/composables/usePlayerInfo";
import { useErrorHandling } from "~/composables/useErrorHandling";
import { useGameStore } from "~/stores/game";
import { useGameStreaming } from "~/composables/useGameStreaming";
import type { Position } from "~/types/game";
import { formatSuit } from "../../lib/game/formatting";
import {
    formatCardPlayEntry,
    formatTrumpBidEntry,
    formatIllegalAttemptEntry,
    formatRoundSummaryEntry,
    formatErrorEntry,
} from "~/utils/activityLog";

// Composables
const { gameState, trump, scores, setGameState } = useGameState();
const {
    initializeGame,
    playNextRound,
    isLoading,
    roundSummary: currentRoundSummary,
} = useGameFlow();
const { playedCards } = useCardDisplay();
const { formattedModelsByPosition, currentPlayer, isCurrentPlayer } = usePlayerInfo();
const { currentError, getUserFriendlyMessage } = useErrorHandling();

// Local ref for currentRoundDecisions (writable for SSE streaming)
const currentRoundDecisions = ref<any[]>([]);

// Get model assignments from Pinia store
const gameStore = useGameStore();
const modelIdsArray = computed(() => gameStore.modelIdsArray);

// Activity log for tracking game events
const activityLog = ref<string[]>([]);

// Computed values for display
const currentPhase = computed(() => {
    if (!gameState.value) return "LOADING";
    if (gameState.value.phase === "trump_selection") return "TRUMP SELECTION";
    if (gameState.value.phase === "playing") return "PLAYING";
    return "COMPLETE";
});

const currentTrick = computed(() => {
    return gameState.value?.completedTricks?.length || 0;
});

const trumpSuit = computed(() => {
    if (!trump.value) return "?";
    return formatSuit(trump.value);
});

const lastTrickWinner = computed(() => {
    const tricks = gameState.value?.completedTricks || [];
    if (tricks.length === 0) return "N/A";
    return tricks[tricks.length - 1]?.winner?.toUpperCase() || "N/A";
});

// Player hands
const playerHands = computed(() => {
    if (!gameState.value) return { north: [], east: [], south: [], west: [] };
    const hands = { north: [], east: [], south: [], west: [] } as Record<Position, typeof gameState.value.players[0]['hand']>;
    gameState.value.players.forEach(player => {
        hands[player.position] = player.hand;
    });
    return hands;
});

// Turned-up card during trump selection
const turnedUpCard = computed(() => {
    return gameState.value?.trumpSelection?.turnedUpCard || null;
});

// Error message for display
const errorMessage = computed(() => {
    if (!currentError.value) return null;
    return getUserFriendlyMessage(currentError.value);
});

// Handle game initialization
const handleInitializeGame = async () => {
    try {
        await initializeGame(modelIdsArray.value);
        activityLog.value.push("Game initialized successfully");
    } catch (e) {
        console.error("Failed to initialize game:", e);
    }
};

// Local state for SSE streaming
const { isStreaming, streamGameRound } = useGameStreaming();
const streamingReasoning = ref<Record<Position, string>>({} as Record<Position, string>);
const currentThinkingPlayer = ref<Position | null>(null);
const showReasoningModal = ref(false);
const allDecisions = ref<any[]>([]);

// Handle playing next round with SSE streaming
const handlePlayNextRound = async () => {
    if (!gameState.value || isStreaming.value) return;

    currentRoundDecisions.value = [];

    try {
        for await (const message of streamGameRound(gameState.value)) {
            switch (message.type) {
                case 'player_thinking':
                    currentThinkingPlayer.value = message.player!;
                    streamingReasoning.value[message.player!] = '';
                    break;

                case 'reasoning_token':
                    if (message.player && message.token) {
                        if (!streamingReasoning.value[message.player]) {
                            streamingReasoning.value[message.player] = '';
                        }
                        streamingReasoning.value[message.player] += message.token;
                    }
                    break;

                case 'illegal_attempt':
                    const illegalStep = activityLog.value.length + 1;
                    activityLog.value.push(
                        formatIllegalAttemptEntry(
                            illegalStep,
                            message.player!,
                            message.attemptedCard!,
                            message.isFallback || false
                        )
                    );
                    break;

                case 'decision_made':
                    const step = activityLog.value.length + 1;
                    
                    if (message.card) {
                        activityLog.value.push(
                            formatCardPlayEntry(step, message.player!, message.card)
                        );
                    } else {
                        activityLog.value.push(
                            formatTrumpBidEntry(step, message.player!, message.action!)
                        );
                    }

                    const decisionWithReasoning = {
                        ...message,
                        reasoning: message.reasoning || streamingReasoning.value[message.player!] || 'No reasoning provided'
                    };
                    currentRoundDecisions.value.push(decisionWithReasoning);
                    allDecisions.value.push(decisionWithReasoning);
                    break;

                case 'round_complete':
                    setGameState(message.gameState!);
                    activityLog.value.push(formatRoundSummaryEntry(message.roundSummary!));
                    return;

                case 'error':
                    console.error('SSE error:', message.message);
                    throw new Error(message.message);
            }
        }
    } catch (error) {
        console.error('Streaming Error:', error);
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
        activityLog.value.push(formatErrorEntry(errorMsg));
    }
};

// Cleanup on unmount
onUnmounted(() => {
    // Cleanup if needed
});

// Initialize game on mount
onMounted(() => {
    handleInitializeGame();
});
</script>

<style scoped>
.game-container {
    height: 100vh;
    overflow: hidden;
    position: relative;
    background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
        linear-gradient(rgba(255, 255, 255, 0.1) 2px, transparent 2px);
    background-size: 20px 20px;
    background-color: #0a0a0a;
    color: #fff;
    font-family: "Courier New", Consolas, Monaco, monospace;
    display: flex;
    flex-direction: column;
}

.game-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
    );
    pointer-events: none;
    z-index: 1;
}

.game-container > * {
    position: relative;
    z-index: 2;
}

.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

.game-header h1 {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    margin: 0;
    color: #e5e7eb;
}

.bracket {
    color: #6b7280;
}

.accent {
    color: #a3e635;
}

.live-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    letter-spacing: 1px;
}

.live-dot {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
}

.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid rgba(59, 130, 246, 0.5);
    padding: 0.5rem 1rem;
    border-radius: 0px;
    font-family: "Courier New", monospace;
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    box-shadow: 4px 4px 0px rgba(59, 130, 246, 0.2);
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.game-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

/* Panel Styling */
.arena-panel,
.intelligence-panel {
    border: 3px solid rgba(163, 230, 53, 0.3);
    border-radius: 0px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
        8px 8px 0px rgba(163, 230, 53, 0.2),
        0 0 40px rgba(0, 0, 0, 0.8);
    position: relative;
}

.arena-panel::before,
.intelligence-panel::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    background: linear-gradient(45deg,
        rgba(163, 230, 53, 0.1) 0%,
        transparent 50%,
        rgba(192, 132, 252, 0.1) 100%
    );
    z-index: -1;
    pointer-events: none;
}

.panel-header {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: #9ca3af;
}

.comment {
    color: #6b7280;
}

.keyword {
    color: #c084fc;
}

.prompt-button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.7rem;
    font-family: "Courier New", monospace;
    font-size: 0.75rem;
    background: rgba(10, 10, 10, 0.8);
    color: #9ca3af;
    border: 2px solid rgba(107, 114, 128, 0.5);
    border-radius: 0px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 3px 3px 0px rgba(75, 85, 99, 0.3);
}

.prompt-button:hover {
    background: rgba(75, 85, 99, 0.3);
    border-color: #9ca3af;
    color: #e5e7eb;
    box-shadow: 4px 4px 0px rgba(75, 85, 99, 0.4);
    transform: translate(-1px, -1px);
}

.prompt-button:active {
    box-shadow: 1px 1px 0px rgba(75, 85, 99, 0.3);
    transform: translate(2px, 2px);
}

.prompt-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.primary-button {
    width: 100%;
    padding: 1.25rem 1.5rem;
    font-family: "Courier New", monospace;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    color: #a3e635;
    background: rgba(163, 230, 53, 0.08);
    border: 3px solid rgba(163, 230, 53, 0.5);
    border-radius: 0px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 8px 8px 0px rgba(163, 230, 53, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.primary-button:hover:not(:disabled) {
    background: rgba(163, 230, 53, 0.12);
    border-color: rgba(163, 230, 53, 0.7);
    box-shadow: 12px 12px 0px rgba(163, 230, 53, 0.4);
    transform: translate(-4px, -4px);
    color: #fff;
}

.primary-button:active:not(:disabled) {
    box-shadow: 4px 4px 0px rgba(163, 230, 53, 0.3);
    transform: translate(4px, 4px);
}

.primary-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
}

.button-text {
    font-size: 1rem;
}

.button-arrow {
    font-size: 1.5rem;
    transition: transform 0.2s ease;
}

.primary-button:hover:not(:disabled) .button-arrow {
    transform: translateX(4px);
}

.alert {
    padding: 0.85rem 1rem;
    border-radius: 0.5rem;
    font-family: "Courier New", monospace;
    border: 1px solid;
}

.alert.error {
    background: rgba(248, 113, 113, 0.08);
    border-color: #f87171;
    color: #fecdd3;
}

/* Table View */
.table-view {
    flex: 1;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
}

.table-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    padding: 0 1rem;
    color: #e5e7eb;
}

.closing-brace {
    font-size: 0.875rem;
    color: #e5e7eb;
    padding: 1rem 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.game-state-header {
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

/* Intelligence Panel */
.intelligence-panel {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 80px);
}

.history-section {
    flex: 1;
    padding: 1rem;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 2rem;
}

.history-button {
    width: 100%;
    max-width: 300px;
    padding: 1rem 1.5rem;
    font-family: "Courier New", monospace;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    color: #a3e635;
    background: rgba(163, 230, 53, 0.08);
    border: 2px solid rgba(163, 230, 53, 0.4);
    border-radius: 0px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 6px 6px 0px rgba(163, 230, 53, 0.25);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.history-button:hover {
    background: rgba(163, 230, 53, 0.15);
    border-color: rgba(163, 230, 53, 0.6);
    box-shadow: 8px 8px 0px rgba(163, 230, 53, 0.35);
    transform: translate(-2px, -2px);
    color: #fff;
}

.history-button:active {
    box-shadow: 3px 3px 0px rgba(163, 230, 53, 0.25);
    transform: translate(3px, 3px);
}

.history-button .badge {
    background: rgba(163, 230, 53, 0.2);
    border: 1px solid rgba(163, 230, 53, 0.4);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: bold;
    min-width: 32px;
    text-align: center;
}

/* Game Controls */
.game-controls {
    padding: 1.5rem 2rem;
}

.error-message {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #fca5a5;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    text-align: center;
}
</style>
