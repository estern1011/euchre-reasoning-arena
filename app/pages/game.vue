<template>
    <div class="game-container">
        <header class="game-header">
            <h1>EUCHRE REASONING ARENA</h1>
            <UBadge color="primary" variant="subtle" size="lg">
                <span class="live-dot"></span>
                LIVE
            </UBadge>
        </header>

        <div class="game-content">
            <!-- Left Panel: Arena -->
            <div class="arena-panel">
                <div class="panel-header">ARENA</div>

                <!-- Game State Header -->
                <div class="game-state-header">
                    <div class="state-info">
                        <span class="phase"
                            >PHASE: {{ currentPhase }} (TRICK
                            {{ currentTrick }})</span
                        >
                        <span class="divider">|</span>
                        <span class="trump"
                            >TRUMP:
                            <span class="trump-suit">{{
                                trumpSuit
                            }}</span></span
                        >
                        <span class="divider">|</span>
                        <span class="winner"
                            >WINNER: {{ lastTrickWinner }}</span
                        >
                    </div>
                </div>

                <!-- Table View -->
                <div class="table-view">
                    <div class="table-header">TABLE VIEW</div>

                    <div class="card-table">
                        <!-- North Position -->
                        <div class="player-position north">
                            <div class="thinking-box">
                                <div class="position-label">NORTH</div>
                                <div class="thinking-text">THINKING...</div>
                            </div>
                        </div>

                        <!-- West Position -->
                        <div class="player-position west">
                            <button class="prompt-button">
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
                                <span>PROMPT</span>
                            </button>
                            <div class="played-card">
                                <Card
                                    :suit="playedCards.west.suit"
                                    :rank="playedCards.west.rank"
                                />
                            </div>
                            <div class="player-info">
                                <div class="player-name">WEST</div>
                                <div class="model-name">FAST-MODEL-V2</div>
                                <div class="status">STATUS</div>
                            </div>
                        </div>

                        <!-- Center - Played Cards Area -->
                        <div class="center-area">
                            <div class="center-card">
                                <Card
                                    :suit="playedCards.center.suit"
                                    :rank="playedCards.center.rank"
                                />
                            </div>
                        </div>

                        <!-- East Position -->
                        <div class="player-position east">
                            <button class="prompt-button">
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
                                <span>PROMPT</span>
                            </button>
                            <div class="played-card">
                                <Card
                                    :suit="playedCards.east.suit"
                                    :rank="playedCards.east.rank"
                                />
                            </div>
                            <div class="player-info">
                                <div class="player-name">EAST</div>
                                <div class="model-name">FAST-MODEL-V2</div>
                                <div class="status">STATUS</div>
                            </div>
                        </div>

                        <!-- South Position -->
                        <div class="player-position south">
                            <button class="prompt-button">
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
                                <span>PROMPT</span>
                            </button>
                            <div class="player-info">
                                <div class="player-name">SOUTH</div>
                                <div class="model-name">
                                    EXPERIMENTAL-CLAUDE-3
                                </div>
                                <div class="status">STATUS</div>
                            </div>
                        </div>
                    </div>

                    <!-- Game Controls -->
                    <div class="game-controls">
                        <UAlert
                            v-if="error"
                            color="red"
                            variant="soft"
                            :title="error"
                            class="mb-4"
                        />
                        <UButton
                            block
                            size="xl"
                            color="primary"
                            variant="solid"
                            @click="playNextTrick"
                            :loading="isLoading"
                            :disabled="!gameState"
                            class="play-next-button"
                        >
                            PLAY NEXT TRICK
                        </UButton>
                    </div>
                </div>
            </div>

            <!-- Right Panel: Intelligence -->
            <div class="intelligence-panel">
                <div class="panel-header">INTELLIGENCE</div>

                <!-- Activity Log -->
                <div class="activity-log">
                    <div class="log-header">ACTIVITY LOG</div>
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

                <!-- Live Model Reasoning -->
                <div class="live-reasoning">
                    <div class="reasoning-header">LIVE MODEL REASONING</div>

                    <div class="reasoning-content">
                        <div
                            v-for="(decision, index) in decisions"
                            :key="index"
                            :class="[
                                'model-reasoning',
                                { active: index === decisions.length - 1 },
                            ]"
                        >
                            <div class="model-header">
                                <span class="model-position">{{
                                    decision.player.toUpperCase()
                                }}</span>
                                <span
                                    :class="[
                                        'indicator',
                                        {
                                            active:
                                                index === decisions.length - 1,
                                        },
                                    ]"
                                    >●</span
                                >
                            </div>
                            <div class="model-details">
                                <div class="model-id">
                                    MODEL: {{ decision.modelId }} | DURATION:
                                    {{ (decision.duration / 1000).toFixed(2) }}s
                                </div>
                                <div class="action">
                                    <template v-if="'card' in decision">
                                        ACTION: PLAYED {{ decision.card.rank
                                        }}{{
                                            decision.card.suit === "hearts"
                                                ? "♥"
                                                : decision.card.suit ===
                                                    "diamonds"
                                                  ? "♦"
                                                  : decision.card.suit ===
                                                      "clubs"
                                                    ? "♣"
                                                    : "♠"
                                        }}
                                    </template>
                                    <template v-else>
                                        ACTION:
                                        {{ decision.action.toUpperCase() }}
                                    </template>
                                </div>
                            </div>
                            <div class="reasoning-text">
                                <p>{{ decision.reasoning }}</p>
                            </div>
                        </div>
                        <div
                            v-if="decisions.length === 0"
                            class="model-reasoning"
                        >
                            <div class="reasoning-text">
                                <p>
                                    No reasoning available yet. Click "Play Next
                                    Trick" to start.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Card from "~/components/Card.vue";

// Game state from API
const gameState = ref<any>(null);
const decisions = ref<any[]>([]);
const activityLog = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Get model assignments from route or use defaults
const route = useRoute();
const modelIds = ref([
    route.query.north || "anthropic/claude-haiku-4.5",
    route.query.east || "google/gemini-2.5-flash",
    route.query.south || "openai/gpt-5-mini",
    route.query.west || "xai/grok-4.1-fast-non-reasoning",
]);

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
    if (!gameState.value?.trump) return "?";
    const symbols: Record<string, string> = {
        hearts: "♥",
        diamonds: "♦",
        clubs: "♣",
        spades: "♠",
    };
    return symbols[gameState.value.trump] || gameState.value.trump;
});

const lastTrickWinner = computed(() => {
    const tricks = gameState.value?.completedTricks || [];
    if (tricks.length === 0) return "N/A";
    return tricks[tricks.length - 1]?.winner?.toUpperCase() || "N/A";
});

// Sample cards for demonstration (will be replaced with actual game state)
const playedCards = ref({
    west: { suit: "clubs" as const, rank: "9" as const },
    east: { suit: "hearts" as const, rank: "Q" as const },
    south: { suit: "hearts" as const, rank: "J" as const },
    center: { suit: "hearts" as const, rank: "J" as const },
});

// Initialize game
const initializeGame = async () => {
    isLoading.value = true;
    error.value = null;

    try {
        const response = await $fetch("/api/new-game", {
            method: "POST",
            body: {
                modelIds: modelIds.value,
            },
        });

        gameState.value = response.gameState;
        activityLog.value.push(`Game started - ${response.message}`);
    } catch (e: any) {
        error.value = e.message || "Failed to initialize game";
        console.error("Failed to initialize game:", e);
    } finally {
        isLoading.value = false;
    }
};

// Play next round (trick or trump selection)
const playNextTrick = async () => {
    if (!gameState.value || isLoading.value) return;

    isLoading.value = true;
    error.value = null;

    try {
        const response = await $fetch("/api/play-next-round", {
            method: "POST",
            body: {
                gameState: gameState.value,
                modelIds: modelIds.value,
            },
        });

        gameState.value = response.gameState;
        decisions.value = response.decisions;

        // Add decisions to activity log
        response.decisions.forEach((decision: any, index: number) => {
            const step = activityLog.value.length + 1;
            const player = decision.player.toUpperCase();

            if ("card" in decision) {
                // Card play
                const card = `${decision.card.rank}${decision.card.suit === "hearts" ? "♥" : decision.card.suit === "diamonds" ? "♦" : decision.card.suit === "clubs" ? "♣" : "♠"}`;
                activityLog.value.push(
                    `${String(step).padStart(2, "0")} | [${player}] ACTION: PLAYED ${card}`,
                );
            } else {
                // Trump bid
                activityLog.value.push(
                    `${String(step).padStart(2, "0")} | [${player}] ACTION: ${decision.action.toUpperCase()}`,
                );
            }
        });

        activityLog.value.push(response.roundSummary);
    } catch (e: any) {
        error.value = e.message || "Failed to play next round";
        console.error("Failed to play next round:", e);
    } finally {
        isLoading.value = false;
    }
};

// Initialize game on mount
onMounted(() => {
    initializeGame();
});
</script>

<style scoped>
.game-container {
    min-height: 100vh;
    background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
        linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 60px 60px;
    background-color: #000;
    color: #fff;
    font-family: "Courier New", monospace;
}

.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    border-bottom: 1px solid #333;
}

.game-header h1 {
    font-size: 1.25rem;
    font-weight: bold;
    letter-spacing: 2px;
    margin: 0;
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
    gap: 1rem;
    padding: 1rem;
    min-height: calc(100vh - 60px);
}

/* Panel Styling */
.arena-panel,
.intelligence-panel {
    border: 1px solid #333;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
}

.panel-header {
    padding: 1rem 1.5rem;
    font-size: 1.125rem;
    font-weight: bold;
    letter-spacing: 2px;
    border-bottom: 1px solid #333;
}

/* Game State Header */
.game-state-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px dashed #333;
    font-size: 0.875rem;
}

.state-info {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.divider {
    color: #666;
}

.trump-suit {
    color: #ef4444;
    font-size: 1.125rem;
}

/* Table View */
.table-view {
    flex: 1;
    padding: 1rem;
}

.table-header {
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
}

.card-table {
    position: relative;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #444;
    border-radius: 8px;
    height: 500px;
    display: grid;
    grid-template-areas:
        ". north ."
        "west center east"
        ". south .";
    grid-template-columns: 1fr 2fr 1fr;
    grid-template-rows: 1fr 2fr 1fr;
    padding: 1rem;
}

.player-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
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
    display: flex;
    align-items: center;
    justify-content: center;
}

.thinking-box {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    border: 2px solid #3b82f6;
    border-radius: 8px;
    padding: 2rem 3rem;
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
    text-align: center;
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

.prompt-button {
    background: rgba(75, 85, 99, 0.3);
    border: 1px solid #4b5563;
    border-radius: 4px;
    color: #9ca3af;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: "Courier New", monospace;
    font-size: 0.75rem;
    transition: all 0.2s;
}

.prompt-button:hover {
    background: rgba(75, 85, 99, 0.5);
    border-color: #6b7280;
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
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
}

.log-entries {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.log-entry {
    color: #d1d5db;
}

.live-reasoning {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
}

.reasoning-header {
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
}

.reasoning-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.model-reasoning {
    border: 1px solid #374151;
    border-radius: 4px;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
}

.model-reasoning.active {
    border-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.model-position {
    font-weight: bold;
    letter-spacing: 1px;
}

.indicator {
    color: #6b7280;
    font-size: 1.5rem;
}

.indicator.active {
    color: #3b82f6;
    animation: pulse 2s ease-in-out infinite;
}

.model-details {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-bottom: 0.75rem;
}

.model-id {
    margin-bottom: 0.25rem;
}

.action {
    color: #d1d5db;
}

.reasoning-text {
    font-size: 0.875rem;
    line-height: 1.5;
    color: #e5e7eb;
}

.reasoning-text p {
    margin-bottom: 0.5rem;
}

/* Game Controls */
.game-controls {
    padding: 1rem 1.5rem;
    border-top: 1px solid #333;
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

.play-next-button {
    font-family: "Courier New", monospace !important;
    font-size: 1.125rem !important;
    font-weight: bold !important;
    letter-spacing: 2px !important;
    padding: 1rem !important;
}
</style>
