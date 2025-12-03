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

                <!-- Game State Header -->
                <div class="game-state-header">
                    <div class="state-info">
                        <span class="state-item"
                            ><span class="state-label">phase:</span> <span class="state-value">"{{ currentPhase.toLowerCase() }}"</span></span
                        >
                        <span class="divider">,</span>
                        <span class="state-item"
                            ><span class="state-label">trick:</span> <span class="state-value">{{ currentTrick }}</span></span
                        >
                        <span class="divider">,</span>
                        <span class="state-item"
                            ><span class="state-label">trump:</span> <span class="trump-suit">{{
                                trumpSuit
                            }}</span></span
                        >
                        <span class="divider">,</span>
                        <span class="state-item"
                            ><span class="state-label">winner:</span> <span class="state-value">"{{ lastTrickWinner.toLowerCase() }}"</span></span
                        >
                    </div>
                </div>

                <!-- Table View -->
                <div class="table-view">
                    <div class="table-header"><span class="keyword">const</span> table = {</div>

                    <div class="card-table">
                        <!-- North Position -->
                        <div class="player-position north">
                            <div v-if="isCurrentPlayer('north')" class="thinking-box">
                                <div class="position-label">NORTH</div>
                                <div class="thinking-text">THINKING...</div>
                            </div>
                            <div v-else class="player-info">
                                <div class="player-name">NORTH</div>
                                <div class="model-name">{{ formattedModelsByPosition.north }}</div>
                                <div class="status">WAITING</div>
                            </div>
                            <div v-if="playerHands.north.length > 0" class="hand-cards">
                                <Card
                                    v-for="(card, index) in playerHands.north"
                                    :key="`north-${index}`"
                                    :suit="card.suit"
                                    :rank="card.rank"
                                    :faceDown="true"
                                    size="sm"
                                />
                            </div>
                        </div>

                        <!-- West Position -->
                        <div class="player-position west">
                            <button class="prompt-button" type="button">
                                <svg
                                    class="gear-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path
                                        d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-6.364 0L3.515 15.879m12.728 0l-4.243-4.243m-6.364 0L3.515 8.121"
                                    ></path>
                                </svg>
                                PROMPT
                            </button>
                            <div v-if="playedCards.west" class="played-card">
                                <Card
                                    :suit="playedCards.west.suit"
                                    :rank="playedCards.west.rank"
                                />
                            </div>
                            <div class="player-info">
                                <div class="player-name">WEST</div>
                                <div class="model-name">{{ formattedModelsByPosition.west }}</div>
                                <div class="status">{{ isCurrentPlayer('west') ? '● THINKING' : 'WAITING' }}</div>
                            </div>
                            <div v-if="playerHands.west.length > 0" class="hand-cards">
                                <Card
                                    v-for="(card, index) in playerHands.west"
                                    :key="`west-${index}`"
                                    :suit="card.suit"
                                    :rank="card.rank"
                                    :faceDown="true"
                                    size="sm"
                                />
                            </div>
                        </div>

                        <!-- Center - Played Cards Area -->
                        <div class="center-area">
                            <div v-if="playedCards.center" class="center-card">
                                <Card
                                    :suit="playedCards.center.suit"
                                    :rank="playedCards.center.rank"
                                />
                            </div>
                            <div v-if="turnedUpCard" class="turned-up-card-display">
                                <div class="card-label">Turned up:</div>
                                <Card
                                    :suit="turnedUpCard.suit"
                                    :rank="turnedUpCard.rank"
                                    size="md"
                                />
                            </div>
                        </div>

                        <!-- East Position -->
                        <div class="player-position east">
                            <button class="prompt-button" type="button">
                                <svg
                                    class="gear-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path
                                        d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-6.364 0L3.515 15.879m12.728 0l-4.243-4.243m-6.364 0L3.515 8.121"
                                    ></path>
                                </svg>
                                PROMPT
                            </button>
                            <div v-if="playedCards.east" class="played-card">
                                <Card
                                    :suit="playedCards.east.suit"
                                    :rank="playedCards.east.rank"
                                />
                            </div>
                            <div class="player-info">
                                <div class="player-name">EAST</div>
                                <div class="model-name">{{ formattedModelsByPosition.east }}</div>
                                <div class="status">{{ isCurrentPlayer('east') ? '● THINKING' : 'WAITING' }}</div>
                            </div>
                            <div v-if="playerHands.east.length > 0" class="hand-cards">
                                <Card
                                    v-for="(card, index) in playerHands.east"
                                    :key="`east-${index}`"
                                    :suit="card.suit"
                                    :rank="card.rank"
                                    :faceDown="true"
                                    size="sm"
                                />
                            </div>
                        </div>

                        <!-- South Position -->
                        <div class="player-position south">
                            <button class="prompt-button" type="button">
                                <svg
                                    class="gear-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path
                                        d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-6.364 0L3.515 15.879m12.728 0l-4.243-4.243m-6.364 0L3.515 8.121"
                                    ></path>
                                </svg>
                                PROMPT
                            </button>
                            <div class="player-info">
                                <div class="player-name">SOUTH</div>
                                <div class="model-name">{{ formattedModelsByPosition.south }}</div>
                                <div class="status">{{ isCurrentPlayer('south') ? '● THINKING' : 'WAITING' }}</div>
                            </div>
                            <div v-if="playerHands.south.length > 0" class="hand-cards">
                                <Card
                                    v-for="(card, index) in playerHands.south"
                                    :key="`south-${index}`"
                                    :suit="card.suit"
                                    :rank="card.rank"
                                    :faceDown="true"
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Game Controls -->
                    <div class="game-controls">
                        <div v-if="errorMessage" class="alert error mb-4">
                            {{ errorMessage }}
                        </div>
                        <button
                            class="primary-button"
                            type="button"
                            @click="handlePlayNextRound"
                            :disabled="!gameState || isLoading"
                        >
                            <span class="button-text">playNextRound()</span>
                            <span class="button-arrow">→</span>
                        </button>
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
                <div class="activity-log">
                    <div class="log-header">
                        <span class="keyword">const</span> activityLog = [
                    </div>
                    <div class="log-entries">
                        <div
                            v-for="(entry, index) in activityLog"
                            :key="index"
                            class="log-entry"
                        >
                            {{ entry }}
                        </div>
                        <div v-if="activityLog.length === 0" class="log-entry">
                            Waiting for game to start...
                        </div>
                    </div>
                </div>

                <!-- Real-Time Streaming Reasoning -->
                <div v-if="currentThinkingPlayer && streamingReasoning[currentThinkingPlayer]" class="streaming-reasoning">
                    <div class="streaming-header">
                        <span class="keyword">const</span> liveThinking = {
                    </div>
                    <div class="streaming-content">
                        <div class="streaming-box">
                            <div class="streaming-player">
                                <span class="player-label">{{ currentThinkingPlayer.toUpperCase() }}</span>
                                <span class="streaming-indicator">● LIVE</span>
                            </div>
                            <div class="streaming-text">
                                {{ streamingReasoning[currentThinkingPlayer] }}<span class="cursor">▋</span>
                            </div>
                        </div>
                    </div>
                    <div class="closing-brace">}</div>
                </div>

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
import Card from "~/components/Card.vue";
import ReasoningModal from "~/components/ReasoningModal.vue";
import { useGameState } from "~/composables/useGameState";
import { useGameFlow } from "~/composables/useGameFlow";
import { useCardDisplay } from "~/composables/useCardDisplay";
import { usePlayerInfo } from "~/composables/usePlayerInfo";
import { useErrorHandling } from "~/composables/useErrorHandling";
import { useGameStore } from "~/stores/game";

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
    const symbols: Record<string, string> = {
        hearts: "♥",
        diamonds: "♦",
        clubs: "♣",
        spades: "♠",
    };
    return symbols[trump.value] || trump.value;
});

const lastTrickWinner = computed(() => {
    const tricks = gameState.value?.completedTricks || [];
    if (tricks.length === 0) return "N/A";
    return tricks[tricks.length - 1]?.winner?.toUpperCase() || "N/A";
});

// Player hands
const playerHands = computed(() => {
    if (!gameState.value) return { north: [], east: [], south: [], west: [] };
    const hands: Record<string, any[]> = { north: [], east: [], south: [], west: [] };
    gameState.value.players.forEach(player => {
        hands[player.position] = player.hand;
    });
    return hands;
});

// Turned-up card during trump selection
const turnedUpCard = computed(() => {
    return gameState.value?.trumpSelection?.turnedUpCard || null;
});

// Helper to format card display
const formatCard = (card: any) => {
    if (!card) return '';
    const suitSymbols: Record<string, string> = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠',
    };
    return `${card.rank}${suitSymbols[card.suit] || card.suit}`;
};

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
const isStreamingActive = ref(false);
const streamingReasoning = ref<Record<string, string>>({});  // Real-time reasoning tokens per player
const currentThinkingPlayer = ref<string | null>(null);  // Track which player is currently thinking
const showReasoningModal = ref(false);
const allDecisions = ref<any[]>([]);  // All decisions across all rounds

// Handle playing next round with SSE streaming
const handlePlayNextRound = async () => {
    if (!gameState.value || isStreamingActive.value) return;

    isStreamingActive.value = true;
    currentRoundDecisions.value = [];  // Clear previous round's decisions
    // Don't clear streamingReasoning or currentThinkingPlayer - keep last player's thoughts visible

    try {
        // Use fetch with streaming response
        const response = await fetch('/api/stream-next-round', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameState: gameState.value }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body');
        }

        // Buffer for incomplete SSE messages
        let buffer = '';

        // Read the stream
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode and parse SSE messages
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim() || !line.startsWith('data: ')) continue;

                try {
                    // Extract JSON from SSE format: "data: {...}"
                    const jsonStr = line.substring(6); // Remove "data: " prefix
                    const message = JSON.parse(jsonStr);

                    switch (message.type) {
                        case 'player_thinking':
                            // Player started thinking - clear their reasoning and set as current
                            currentThinkingPlayer.value = message.player;
                            // Clear reasoning for THIS player only (not all players)
                            streamingReasoning.value[message.player] = '';
                            break;

                        case 'reasoning_token':
                            // Real-time token streaming
                            if (message.player && message.token) {
                                // Accumulate tokens for the player
                                if (!streamingReasoning.value[message.player]) {
                                    streamingReasoning.value[message.player] = '';
                                }
                                streamingReasoning.value[message.player] += message.token;
                            }
                            break;

                        case 'illegal_attempt':
                            // Show illegal attempt in activity log
                            const illegalStep = activityLog.value.length + 1;
                            const illegalPlayer = message.player.toUpperCase();
                            const attemptedCard = `${message.attemptedCard.rank}${message.attemptedCard.suit === "hearts" ? "♥" : message.attemptedCard.suit === "diamonds" ? "♦" : message.attemptedCard.suit === "clubs" ? "♣" : "♠"}`;

                            if (message.isFallback) {
                                activityLog.value.push(
                                    `${String(illegalStep).padStart(2, "0")} | [${illegalPlayer}] ⚠️ ILLEGAL → Chose ${attemptedCard}, retry failed, using fallback`
                                );
                            } else {
                                activityLog.value.push(
                                    `${String(illegalStep).padStart(2, "0")} | [${illegalPlayer}] ⚠️ RETRY → Chose ${attemptedCard} (illegal), retrying...`
                                );
                            }
                            break;

                        case 'decision_made':
                            // Add decision to log
                            const step = activityLog.value.length + 1;
                            const player = message.player.toUpperCase();

                            if (message.card) {
                                const card = `${message.card.rank}${message.card.suit === "hearts" ? "♥" : message.card.suit === "diamonds" ? "♦" : message.card.suit === "clubs" ? "♣" : "♠"}`;
                                activityLog.value.push(
                                    `${String(step).padStart(2, "0")} | [${player}] ACTION: PLAYED ${card}`,
                                );
                            } else {
                                activityLog.value.push(
                                    `${String(step).padStart(2, "0")} | [${player}] ACTION: ${message.action.toUpperCase()}`,
                                );
                            }

                            // Add decision to the current round decisions array
                            // If reasoning is empty but we have streamed reasoning, use that
                            const decisionWithReasoning = {
                                ...message,
                                reasoning: message.reasoning || streamingReasoning.value[message.player] || 'No reasoning provided'
                            };
                            currentRoundDecisions.value.push(decisionWithReasoning);
                            allDecisions.value.push(decisionWithReasoning);
                            break;

                        case 'round_complete':
                            // Update game state
                            setGameState(message.gameState);
                            activityLog.value.push(message.roundSummary);
                            // Don't clear currentThinkingPlayer - keep last reasoning visible
                            isStreamingActive.value = false;
                            return;

                        case 'error':
                            console.error('SSE error:', message.message);
                            // Don't clear currentThinkingPlayer on error - keep last reasoning visible
                            isStreamingActive.value = false;
                            throw new Error(message.message);
                    }
                } catch (parseError) {
                    console.error('SSE Parse Error:', parseError);
                }
            }
        }
    } catch (error) {
        console.error('Streaming Error:', error);
        // Don't clear currentThinkingPlayer on error - keep last reasoning visible
        isStreamingActive.value = false;

        // Set a user-friendly error message
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
        activityLog.value.push(`ERROR: ${errorMsg}`);
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

/* Game State Header */
.game-state-header {
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.2);
}

.state-info {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
}

.state-item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.state-label {
    color: #a3e635;
    font-weight: 500;
}

.state-value {
    color: #fbbf24;
}

.divider {
    color: #6b7280;
}

.trump-suit {
    color: #ef4444;
    font-size: 1rem;
    font-weight: 600;
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

.card-table {
    position: relative;
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 0px;
    flex: 1;
    display: grid;
    grid-template-areas:
        ". north ."
        "west center east"
        ". south .";
    grid-template-columns: 130px 1fr 130px;
    grid-template-rows: 80px 1fr 80px;
    padding: 0.5rem;
    gap: 0.5rem;
}

.player-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: relative;
}

.played-card {
    position: absolute;
}

.player-position.north .played-card {
    bottom: -70px;
    left: 50%;
    transform: translateX(-50%);
}

.player-position.south .played-card {
    top: -70px;
    left: 50%;
    transform: translateX(-50%);
}

.player-position.west .played-card {
    right: -85px;
    top: 50%;
    transform: translateY(-50%);
}

.player-position.east .played-card {
    left: -85px;
    top: 50%;
    transform: translateY(-50%);
}

.player-position.north {
    grid-area: north;
}

.player-position.west {
    grid-area: west;
}

.player-position.east {
    grid-area: east;
}

.player-position.south {
    grid-area: south;
}

.center-area {
    grid-area: center;
    display: grid;
    grid-template-areas:
        ". card-north ."
        "card-west . card-east"
        ". card-south .";
    grid-template-columns: 90px 90px 90px;
    grid-template-rows: 120px 120px 120px;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.center-card {
    grid-area: card-north;
}

.thinking-box {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    border: 3px solid #3b82f6;
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    box-shadow:
        0 0 40px rgba(59, 130, 246, 0.6),
        0 0 80px rgba(59, 130, 246, 0.4),
        inset 0 0 30px rgba(59, 130, 246, 0.2);
    text-align: center;
    position: relative;
    animation: thinkingGlow 2s ease-in-out infinite;
}

@keyframes thinkingGlow {
    0%, 100% {
        box-shadow:
            0 0 40px rgba(59, 130, 246, 0.6),
            0 0 80px rgba(59, 130, 246, 0.4),
            inset 0 0 30px rgba(59, 130, 246, 0.2);
    }
    50% {
        box-shadow:
            0 0 60px rgba(59, 130, 246, 0.8),
            0 0 120px rgba(59, 130, 246, 0.5),
            inset 0 0 40px rgba(59, 130, 246, 0.3);
    }
}

.position-label {
    color: #93c5fd;
    font-size: 0.75rem;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
}

.thinking-text {
    font-size: 1.25rem;
    font-weight: bold;
    letter-spacing: 2px;
}

.gear-icon {
    width: 16px;
    height: 16px;
    stroke-width: 2;
}

.card-placeholder {
    width: 80px;
    height: 112px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid #444;
    border-radius: 4px;
}

.player-info {
    text-align: center;
    font-size: 0.75rem;
}

.player-name {
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 0.25rem;
}

.model-name {
    color: #9ca3af;
    margin-bottom: 0.25rem;
}

.status {
    color: #6b7280;
    font-size: 0.7rem;
}

.hand-display {
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: #a3e635;
    text-align: center;
    font-family: "Courier New", monospace;
    padding: 0.25rem 0.5rem;
    background: rgba(163, 230, 53, 0.05);
    border: 1px solid rgba(163, 230, 53, 0.2);
    border-radius: 2px;
}

.hand-cards {
    display: flex;
    gap: 4px;
    justify-content: center;
    margin-top: 0.5rem;
    padding: 0.5rem;
    flex-wrap: wrap;
}

.turned-up-card {
    text-align: center;
    font-size: 0.875rem;
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.1);
    border: 2px solid rgba(251, 191, 36, 0.3);
    padding: 0.75rem;
    border-radius: 4px;
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
}

.turned-up-card .card-label {
    font-size: 0.7rem;
    color: #9ca3af;
    margin-bottom: 0.25rem;
}

.turned-up-card .card-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #fbbf24;
}

.turned-up-card-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(251, 191, 36, 0.05);
    border: 2px solid rgba(251, 191, 36, 0.2);
    border-radius: 4px;
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.15);
}

.turned-up-card-display .card-label {
    font-size: 0.7rem;
    color: #fbbf24;
    letter-spacing: 1px;
    text-transform: uppercase;
}

/* Intelligence Panel */
.intelligence-panel {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 80px);
}

.activity-log {
    border-bottom: 1px solid #333;
    padding: 1rem;
}

.log-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #e5e7eb;
}

.log-entries {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.log-entry {
    color: #d1d5db;
}

/* Streaming Reasoning */
.streaming-reasoning {
    padding: 1rem;
    border-bottom: 1px solid #374151;
}

.streaming-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #e5e7eb;
}

.streaming-content {
    margin-bottom: 0.5rem;
}

.streaming-box {
    border: 2px solid rgba(163, 230, 53, 0.5);
    border-radius: 4px;
    padding: 1rem;
    background: rgba(163, 230, 53, 0.05);
    box-shadow: 0 0 30px rgba(163, 230, 53, 0.2);
    animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
    0%, 100% {
        border-color: rgba(163, 230, 53, 0.5);
        box-shadow: 0 0 30px rgba(163, 230, 53, 0.2);
    }
    50% {
        border-color: rgba(163, 230, 53, 0.8);
        box-shadow: 0 0 40px rgba(163, 230, 53, 0.3);
    }
}

.streaming-player {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.player-label {
    font-weight: bold;
    letter-spacing: 1px;
    color: #a3e635;
    font-size: 0.875rem;
}

.streaming-indicator {
    color: #a3e635;
    font-size: 0.75rem;
    font-weight: 600;
    animation: pulse 2s ease-in-out infinite;
}

.streaming-text {
    font-size: 0.875rem;
    line-height: 1.6;
    color: #e5e7eb;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: "Courier New", Consolas, Monaco, monospace;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.cursor {
    color: #a3e635;
    animation: blink 1s step-end infinite;
}

@keyframes blink {
    0%, 50% {
        opacity: 1;
    }
    51%, 100% {
        opacity: 0;
    }
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
