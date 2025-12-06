<template>
    <div class="game-container">
        <header class="game-header">
            <div class="header-left">
                <h1><span class="bracket">&lt;</span>euchre.<span class="accent">arena</span><span class="bracket"> /&gt;</span></h1>
            </div>
            <div class="header-center">
                <div class="mode-switcher">
                    <button
                        :class="['mode-tab', { active: viewMode === 'arena' }]"
                        @click="setViewMode('arena')"
                    >
                        // Arena
                    </button>
                    <button
                        :class="['mode-tab', { active: viewMode === 'intelligence' }]"
                        @click="setViewMode('intelligence')"
                    >
                        // Intelligence
                    </button>
                </div>
            </div>
            <div class="header-right"></div>
        </header>

        <div class="game-content">
            <!-- Left Panel: Changes based on mode -->
            <main class="main-panel" aria-label="Game board">
                <!-- Arena Mode: Show Game Board -->
                <template v-if="viewMode === 'arena'">
                    <div class="panel-header">
                        <span class="comment">// </span>arena
                    </div>

                    <!-- Table View / Game Summary -->
                    <div v-if="!gameStore.isGameComplete" class="table-view">
                        <!-- Game Info (top left) -->
                        <div class="game-info-overlay">
                            <div class="game-info-box" :class="{ 'game-complete': gameStore.isGameComplete }">
                                <LiveStatusBanner />
                                <GameMetaInfo />
                            </div>
                        </div>

                        <!-- Controls (top right) -->
                        <div class="game-controls-overlay">
                            <GameControls
                                :disabled="!gameStore.gameState || gameStore.isStreaming"
                                @play-next="handlePlayNext"
                            />
                        </div>

                        <GameBoard
                            :player-hands="gameStore.playerHands"
                            :played-cards="gameStore.activePlayedCards"
                            :formatted-models="formattedModelsByPosition"
                            :turned-up-card="gameStore.turnedUpCard"
                            :current-player="gameStore.currentThinkingPlayer"
                            :is-streaming="gameStore.isStreaming"
                            :going-alone="gameStore.goingAlone"
                            :dealer="gameStore.dealer"
                            :tricks-won="tricksWonByPlayer"
                        />
                    </div>

                    <!-- Game Summary (shown when game is complete) -->
                    <GameSummary
                        v-else
                        :game-state="gameStore.gameState!"
                        :model-ids="gameStore.modelIds"
                        @new-game="handleNewGame"
                    />
                </template>

                <!-- Intelligence Mode: Show Multi-Agent Reasoning Grid -->
                <template v-else>
                    <div class="panel-header">
                        <span class="comment">// </span>intelligence
                    </div>

                    <MultiAgentReasoning
                        :reasoning="gameStore.streamingReasoning"
                        :current-player="gameStore.currentThinkingPlayer"
                        :model-ids="gameStore.modelIds"
                    />

                    <!-- Reasoning History Button -->
                    <div class="history-section-inline">
                        <button
                            class="history-button"
                            type="button"
                            @click="showReasoningModal = true"
                        >
                            <span class="button-text">viewHistory()</span>
                            <span class="badge">{{ gameStore.totalDecisions }}</span>
                        </button>
                    </div>
                </template>
            </main>

            <!-- Right Panel: Changes based on mode -->
            <aside class="side-panel" aria-label="Game information">
                <!-- Arena Mode: Show Intelligence sidebar -->
                <template v-if="viewMode === 'arena'">
                    <div class="panel-header">
                        <span class="comment">// </span>intelligence
                    </div>

                    <!-- Activity Log (on top) -->
                    <ActivityLog :entries="activityLog" class="activity-log-fixed" />

                    <!-- Real-Time Streaming Reasoning -->
                    <StreamingReasoning
                        :player="gameStore.displayedReasoningPlayer"
                        :reasoning="gameStore.displayedReasoningPlayer ? (gameStore.streamingReasoning[gameStore.displayedReasoningPlayer] ?? '') : ''"
                        class="reasoning-fixed"
                    />

                    <!-- Reasoning History Button -->
                    <div class="history-section">
                        <button
                            class="history-button"
                            type="button"
                            @click="showReasoningModal = true"
                        >
                            <span class="button-text">viewHistory()</span>
                            <span class="cursor-prompt">&gt;_</span>
                        </button>
                    </div>
                </template>

                <!-- Intelligence Mode: Show Compact Arena sidebar -->
                <template v-else>
                    <div class="panel-header">
                        <span class="comment">// </span>arena
                    </div>

                    <!-- Game Info Box & Controls (compact) -->
                    <div class="game-info-container compact">
                        <div class="game-info-box">
                            <LiveStatusBanner />
                            <GameMetaInfo />
                        </div>
                        <GameControls
                            :disabled="!gameStore.gameState || gameStore.isStreaming || gameStore.isGameComplete"
                            @play-next="handlePlayNext"
                        />
                    </div>

                    <!-- Compact Arena View -->
                    <CompactArena
                        :player-hands="gameStore.playerHands"
                        :played-cards="gameStore.activePlayedCards"
                        :current-player="gameStore.currentThinkingPlayer"
                        :trump-suit="trumpSuit"
                        :current-trick="currentTrick"
                        :turned-up-card="gameStore.turnedUpCard"
                    />

                    <!-- Activity Log (condensed) -->
                    <ActivityLog :entries="activityLog" />
                </template>
            </aside>
        </div>

        <!-- Reasoning Modal -->
        <ReasoningModal
            :is-open="showReasoningModal"
            @close="showReasoningModal = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
import ReasoningModal from "~/components/ReasoningModal.vue";
import LiveStatusBanner from "~/components/LiveStatusBanner.vue";
import GameMetaInfo from "~/components/GameMetaInfo.vue";
import GameControls from "~/components/GameControls.vue";
import GameBoard from "~/components/GameBoard.vue";
import GameSummary from "~/components/GameSummary.vue";
import ActivityLog from "~/components/ActivityLog.vue";
import StreamingReasoning from "~/components/StreamingReasoning.vue";
import MultiAgentReasoning from "~/components/MultiAgentReasoning.vue";
import CompactArena from "~/components/CompactArena.vue";
import { usePlayerInfo } from "~/composables/usePlayerInfo";
import { useGameStore, type ViewMode } from "~/stores/game";
import { useGameStreaming } from "~/composables/useGameStreaming";
import { useGameApi } from "~/composables/useGameApi";
import { formatSuit } from "../../lib/game/formatting";
import { startNewHand } from "../../lib/game/game";
import {
    formatCardPlayEntry,
    formatTrumpBidEntry,
    formatDiscardEntry,
    formatIllegalAttemptEntry,
    formatErrorEntry,
    formatTrumpSelectionComplete,
    formatTrickComplete,
    formatHandComplete,
    formatGameComplete,
    formatNewHandStart,
    formatGameInitialized,
} from "~/utils/activityLog";
import type { SSEMessage, SSERoundComplete } from "../../lib/types/sse";
import type { Position } from "../../lib/game/types";



// Pinia store - single source of truth
const gameStore = useGameStore();

// Composables
const { initializeGame, isCreatingGame } = useGameApi();
const { formattedModelsByPosition } = usePlayerInfo();
const { streamGameRound } = useGameStreaming();

// View mode (arena or intelligence)
const viewMode = computed(() => gameStore.viewMode);
const setViewMode = (mode: ViewMode) => gameStore.setViewMode(mode);

// Activity log for tracking game events
const activityLog = ref<string[]>([]);

// Reasoning modal
const showReasoningModal = ref(false);

// Computed values for display (still needed for CompactArena)
const currentTrick = computed(() => {
    return gameStore.completedTricks?.length || 0;
});

const trumpSuit = computed(() => {
    if (!gameStore.trump) return "?";
    return formatSuit(gameStore.trump);
});

// Calculate tricks won by each player from completedTricks
const tricksWonByPlayer = computed(() => {
    const counts = { north: 0, south: 0, east: 0, west: 0 };
    for (const trick of gameStore.completedTricks) {
        if (trick.winner && counts[trick.winner] !== undefined) {
            counts[trick.winner]++;
        }
    }
    return counts;
});

// Handle game initialization
const handleInitializeGame = async () => {
    try {
        const result = await initializeGame(
            gameStore.modelIdsArray,
            undefined,
            gameStore.configuredWinningScore
        );
        activityLog.value.push(formatGameInitialized());
        
        // Start recording the first hand
        const gs = result.gameState;
        gameStore.startNewHandRecord(
            gs.handNumber,
            gs.dealer,
            gs.trumpSelection?.turnedUpCard || null
        );
    } catch (e) {
        console.error("Failed to initialize game:", e);
    }
};

// Handle playing next round with SSE streaming
const handlePlayNextRound = async () => {
    if (!gameStore.gameState || gameStore.isStreaming) return;

    // Clear streaming state and start
    gameStore.clearStreamingState();
    gameStore.startStreaming();

    try {
        for await (const message of streamGameRound(gameStore.gameState)) {
            switch (message.type) {
                case 'player_thinking':
                    gameStore.setThinkingPlayer(message.player!);
                    break;

                case 'reasoning_token':
                    if (message.player && message.token) {
                        gameStore.appendReasoning(message.player, message.token);
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
                    const reasoning = message.reasoning || gameStore.streamingReasoning[message.player!] || 'No reasoning provided';

                    if (message.action === 'discard' && message.card) {
                        // Dealer discarding after order_up
                        activityLog.value.push(
                            formatDiscardEntry(step, message.player!, message.card)
                        );
                    } else if (message.card) {
                        // Card play
                        activityLog.value.push(
                            formatCardPlayEntry(step, message.player!, message.card)
                        );
                        gameStore.recordCardPlayed(message.player!, message.card);
                        
                        // Record to game history
                        gameStore.recordPlay({
                            player: message.player!,
                            card: message.card,
                            modelId: message.modelId!,
                            reasoning,
                            duration: message.duration!,
                        });
                    } else {
                        // Trump decision
                        activityLog.value.push(
                            formatTrumpBidEntry(step, message.player!, message.action!)
                        );
                        
                        // For order_up, the trump suit is the turned-up card's suit
                        const trumpSuit = message.action === 'order_up'
                            ? gameStore.turnedUpCard?.suit
                            : message.suit;
                        
                        // Record to game history
                        if (message.action === 'pass' || message.action === 'order_up' || message.action === 'call_trump') {
                            gameStore.recordTrumpDecision({
                                player: message.player!,
                                modelId: message.modelId!,
                                action: message.action as 'pass' | 'order_up' | 'call_trump',
                                suit: trumpSuit,
                                goingAlone: message.goingAlone,
                                reasoning,
                                duration: message.duration!,
                            });
                        }
                    }

                    break;

                case 'round_complete':
                    gameStore.setGameState(message.gameState!);

                    // Format activity log entry based on phase
                    if (message.phase === 'trump_selection_round_1' || message.phase === 'trump_selection_round_2') {
                        activityLog.value.push(formatTrumpSelectionComplete({
                            selectionRound: message.selectionRound || 1,
                            allPassed: message.allPassed || false,
                            trumpSelectionResult: message.trumpSelectionResult,
                        }));
                    } else if (message.phase === 'game_complete') {
                        activityLog.value.push(formatTrickComplete({
                            trickNumber: message.trickNumber!,
                            trickWinner: message.trickWinner!,
                        }));
                        activityLog.value.push(formatGameComplete({
                            gameScores: message.gameScores!,
                            winningTeam: message.winningTeam!,
                        }));
                        // Record trick winner and hand completion to history
                        if (message.trickNumber && message.trickWinner) {
                            gameStore.recordTrickWinner(message.trickNumber, message.trickWinner);
                        }
                        const finalWinningTeam = message.winningTeam === 0 ? 'NS' : 'EW';
                        gameStore.recordHandComplete(finalWinningTeam, message.handScores || [0, 0]);
                    } else if (message.phase === 'hand_complete') {
                        activityLog.value.push(formatTrickComplete({
                            trickNumber: message.trickNumber!,
                            trickWinner: message.trickWinner!,
                        }));
                        activityLog.value.push(formatHandComplete({
                            handNumber: message.handNumber!,
                            handScores: message.handScores!,
                            gameScores: message.gameScores!,
                        }));
                        // Record trick winner and hand completion to history
                        if (message.trickNumber && message.trickWinner) {
                            gameStore.recordTrickWinner(message.trickNumber, message.trickWinner);
                        }
                        const handWinningTeam = message.handScores![0] > message.handScores![1] ? 'NS' : 'EW';
                        gameStore.recordHandComplete(handWinningTeam, message.handScores!);
                    } else if (message.phase === 'playing_trick') {
                        activityLog.value.push(formatTrickComplete({
                            trickNumber: message.trickNumber!,
                            trickWinner: message.trickWinner!,
                        }));
                        // Record trick winner to history
                        if (message.trickNumber && message.trickWinner) {
                            gameStore.recordTrickWinner(message.trickNumber, message.trickWinner);
                        }
                    }

                    // Set trick winner for UI display
                    if (message.trickWinner) {
                        gameStore.setTrickWinner(message.trickWinner as Position);
                    }
                    break;

                case 'error':
                    console.error('SSE error:', message.message);
                    throw new Error(message.message);
            }
        }
    } catch (error) {
        console.error('Streaming Error:', error);
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
        activityLog.value.push(formatErrorEntry(errorMsg));
    } finally {
        gameStore.stopStreaming();
    }
};

// Handle starting a new hand when current hand is complete
const handleStartNextHand = () => {
    if (!gameStore.gameState || gameStore.phase !== 'hand_complete') return;

    try {
        const newGameState = startNewHand(gameStore.gameState);
        gameStore.setGameState(newGameState);
        gameStore.clearStreamingState();
        
        // Start recording the new hand
        gameStore.startNewHandRecord(
            newGameState.handNumber,
            newGameState.dealer,
            newGameState.trumpSelection?.turnedUpCard || null
        );
        activityLog.value.push(formatNewHandStart(newGameState.handNumber, newGameState.dealer));
    } catch (error) {
        console.error('Failed to start new hand:', error);
        activityLog.value.push(formatErrorEntry('Failed to start new hand'));
    }
};

// Unified play handler that handles both rounds and hand transitions
const handlePlayNext = async () => {
    if (!gameStore.gameState || gameStore.isStreaming) return;

    // If hand is complete, start new hand first
    if (gameStore.phase === 'hand_complete') {
        handleStartNextHand();
        // After starting new hand, continue to play if auto-mode is on
        if (!gameStore.autoMode) return;
    }

    // Now play the next round
    await handlePlayNextRound();
};

// Auto-mode orchestration
let autoModeTimeoutId: ReturnType<typeof setTimeout> | null = null;

const scheduleNextAutoPlay = () => {
    if (!gameStore.autoMode || gameStore.isStreaming || gameStore.isGameComplete) {
        return;
    }

    // Clear any existing timeout
    if (autoModeTimeoutId) {
        clearTimeout(autoModeTimeoutId);
    }

    // Schedule next play after delay
    autoModeTimeoutId = setTimeout(async () => {
        // Double-check conditions before playing
        if (gameStore.autoMode && !gameStore.isStreaming && !gameStore.isGameComplete) {
            await handlePlayNext();
        }
    }, gameStore.autoModeDelay);
};

// Watch for auto-mode changes and streaming completion
watch(
    () => [gameStore.autoMode, gameStore.isStreaming] as const,
    ([autoMode, isStreaming]) => {
        if (autoMode && !isStreaming && !gameStore.isGameComplete) {
            scheduleNextAutoPlay();
        } else if (!autoMode && autoModeTimeoutId) {
            // Auto-mode turned off, cancel pending timeout
            clearTimeout(autoModeTimeoutId);
            autoModeTimeoutId = null;
        }
    },
    { immediate: true }
);

// Clean up on unmount
onUnmounted(() => {
    if (autoModeTimeoutId) {
        clearTimeout(autoModeTimeoutId);
    }
});

// Handle new game - reset and navigate to index
const handleNewGame = () => {
    gameStore.reset();
    navigateTo('/');
};

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
        linear-gradient(90deg, rgba(56, 189, 186, 0.08) 1px, transparent 1px),
        linear-gradient(rgba(56, 189, 186, 0.08) 1px, transparent 1px);
    background-size: 30px 30px;
    background-color: #0a1414;
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
    padding: 1rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    flex: 1;
}

.header-center {
    display: flex;
    justify-content: center;
    flex: 1;
}

.header-right {
    flex: 1;
}

.mode-switcher {
    display: flex;
    gap: 0;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(56, 189, 186, 0.2);
    border-radius: 8px;
    padding: 2px;
}

.mode-tab {
    padding: 0.6rem 1.25rem;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: transparent;
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.025em;
}

.mode-tab:hover:not(.active) {
    color: #38bdb8;
    background: rgba(56, 189, 186, 0.1);
    border-color: rgba(56, 189, 186, 0.3);
}

.mode-tab.active {
    color: #0a1414;
    background: #38bdb8;
    border-color: #38bdb8;
    box-shadow: 0 0 20px rgba(56, 189, 186, 0.5);
    text-shadow: none;
}

.game-header h1 {
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    margin: 0;
    color: var(--color-text);
    white-space: nowrap;
}

.bracket {
    color: var(--color-text-muted);
}

.accent {
    color: #38bdb8;
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
    background: var(--color-live);
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
.main-panel {
    border: 2px solid rgba(56, 189, 186, 0.4);
    border-radius: 12px;
    background: rgba(10, 20, 20, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
        0 0 40px rgba(0, 0, 0, 0.6),
        0 0 15px rgba(56, 189, 186, 0.15),
        inset 0 0 30px rgba(56, 189, 186, 0.03);
    position: relative;
}

.side-panel {
    border: 2px solid rgba(56, 189, 186, 0.4);
    border-radius: 12px;
    background: rgba(10, 20, 20, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
        0 0 40px rgba(0, 0, 0, 0.6),
        0 0 20px rgba(56, 189, 186, 0.1),
        inset 0 0 30px rgba(56, 189, 186, 0.02);
    position: relative;
}

.main-panel::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg,
        rgba(56, 189, 186, 0.05) 0%,
        transparent 50%,
        rgba(56, 189, 186, 0.05) 100%
    );
    z-index: -1;
    pointer-events: none;
}

.side-panel::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg,
        rgba(56, 189, 186, 0.05) 0%,
        transparent 50%,
        rgba(56, 189, 186, 0.05) 100%
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
    color: var(--color-text-secondary);
}

.comment {
    color: var(--color-text-muted);
}

.keyword {
    color: var(--color-keyword);
}

.prompt-button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.7rem;
    font-family: "Courier New", monospace;
    font-size: 0.75rem;
    background: rgba(10, 10, 10, 0.8);
    color: var(--color-text-secondary);
    border: 2px solid rgba(107, 114, 128, 0.5);
    border-radius: 0px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 3px 3px 0px rgba(75, 85, 99, 0.3);
}

.prompt-button:hover {
    background: rgba(75, 85, 99, 0.3);
    border-color: var(--color-text-secondary);
    color: var(--color-text);
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
    color: #38bdb8;
    background: rgba(56, 189, 186, 0.08);
    border: 3px solid rgba(56, 189, 186, 0.5);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 4px 4px 0px rgba(56, 189, 186, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.primary-button:hover:not(:disabled) {
    background: rgba(56, 189, 186, 0.12);
    border-color: rgba(56, 189, 186, 0.7);
    box-shadow: 6px 6px 0px rgba(56, 189, 186, 0.3);
    transform: translate(-2px, -2px);
    color: #fff;
}

.primary-button:active:not(:disabled) {
    box-shadow: 2px 2px 0px rgba(56, 189, 186, 0.2);
    transform: translate(2px, 2px);
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
    position: relative;
    min-height: 0; /* Allow flex child to shrink */
    overflow: hidden;
}

.game-info-overlay {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 10;
}

.game-controls-overlay {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 10;
}

.game-info-container {
    padding: 0.75rem 1rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.game-info-box {
    border: 2px solid rgba(56, 189, 186, 0.5);
    background: rgba(10, 20, 20, 0.9);
    padding: 0.5rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-width: clamp(220px, 25vw, 320px);
    border-radius: 8px;
    box-shadow:
        0 0 20px rgba(56, 189, 186, 0.2),
        0 0 40px rgba(56, 189, 186, 0.1),
        inset 0 0 20px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
}

.game-info-box.game-complete {
    border-color: rgba(56, 189, 186, 0.6);
    background: rgba(56, 189, 186, 0.05);
    box-shadow: 0 0 20px rgba(56, 189, 186, 0.2);
}

.game-controls-row {
    display: flex;
    align-items: center;
}

.game-info-container.compact {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
}

.game-info-container.compact .game-info-box {
    width: 100%;
}

/* Side Panel */
.side-panel {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 80px);
    overflow: hidden;
}

/* Fixed height panels for activity log and reasoning */
.activity-log-fixed {
    height: 180px;
    min-height: 180px;
    max-height: 180px;
    overflow-y: auto;
    flex-shrink: 0;
}

.reasoning-fixed {
    flex: 1;
    min-height: 150px;
    overflow-y: auto;
}

.new-game-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    background: rgba(56, 189, 186, 0.1);
    border: 2px solid rgba(56, 189, 186, 0.4);
    color: #38bdb8;
    font-family: "Courier New", monospace;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 0;
    box-shadow: 4px 4px 0px rgba(56, 189, 186, 0.2);
}

.new-game-button:hover {
    background: rgba(56, 189, 186, 0.2);
    border-color: rgba(56, 189, 186, 0.6);
    color: #fff;
    box-shadow: 6px 6px 0px rgba(56, 189, 186, 0.3);
    transform: translate(-2px, -2px);
}

.new-game-button:active {
    box-shadow: 2px 2px 0px rgba(56, 189, 186, 0.2);
    transform: translate(2px, 2px);
}

.button-text {
    letter-spacing: 0.025em;
}

.button-arrow {
    font-size: 1.25rem;
    transition: transform 0.2s ease;
}

.new-game-button:hover .button-arrow {
    transform: translateX(4px);
}

.history-section,
.history-section-inline {
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
}

.history-button {
    padding: 0.75rem 1.25rem;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    color: #38bdb8;
    background: rgba(56, 189, 186, 0.05);
    border: 2px solid rgba(56, 189, 186, 0.3);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
}

.history-button:hover {
    background: rgba(56, 189, 186, 0.1);
    border-color: rgba(56, 189, 186, 0.5);
    color: #fff;
}

.history-button:active {
    background: rgba(56, 189, 186, 0.15);
}

.history-button .badge {
    background: rgba(56, 189, 186, 0.15);
    border: 1px solid rgba(56, 189, 186, 0.3);
    padding: 0.15rem 0.5rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    min-width: 24px;
    text-align: center;
}

.cursor-prompt {
    font-family: "Courier New", monospace;
    color: #38bdb8;
    font-weight: 600;
}

/* Game Controls */
.game-controls {
    padding: 1.5rem 2rem;
}

.error-message {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid var(--color-error);
    border-radius: 4px;
    color: #fca5a5;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    text-align: center;
}
</style>
