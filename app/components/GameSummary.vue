<template>
    <div class="game-summary">
        <div class="summary-header">
            <h2 class="summary-title">
                <span class="keyword">const</span> gameSummary = <span class="bracket">{</span>
            </h2>
            <button class="new-game-btn" @click="handleNewGame">
                newGame() →
            </button>
        </div>

        <div class="rankings-section">
            <div class="section-label">
                <span class="property">modelRankings:</span>
                <span class="bracket">[</span>
            </div>

            <div class="player-rankings">
                <div
                    v-for="(stat, index) in rankedPlayers"
                    :key="stat.position"
                    :class="['player-stat-card', { 'winner-team': stat.isWinningTeam }]"
                >
                    <div class="rank-badge">{{ index + 1 }}</div>
                    <div class="player-info">
                        <div class="player-header">
                            <span class="player-position">{{ stat.position.toUpperCase() }}</span>
                            <span class="team-badge">Team {{ stat.team + 1 }}</span>
                        </div>
                        <div class="model-name">{{ stat.modelName }}</div>
                    </div>
                    <div class="player-stats">
                        <div class="stat-item">
                            <span class="stat-label">tricks_won:</span>
                            <span class="stat-value">{{ stat.tricksWon }}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">win_rate:</span>
                            <span class="stat-value">{{ stat.winRate }}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">trump_calls:</span>
                            <span class="stat-value">{{ stat.trumpCalls }}</span>
                            <span v-if="stat.trumpCalls > 0" class="stat-detail">({{ stat.trumpCallSuccessRate }}% won)</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">alone:</span>
                            <span class="stat-value">{{ stat.aloneAttempts }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-label">
                <span class="bracket">]</span>
            </div>
        </div>

        <!-- Metacognition Arena Performance Report -->
        <div class="metacognition-section">
            <PostGameReport />
        </div>

        <div class="summary-footer">
            <span class="bracket">}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameState, Position } from '~/types/game';
import { useGameStore } from '~/stores/game';
import PostGameReport from '~/components/PostGameReport.vue';

const emit = defineEmits<{
    newGame: []
}>();

const handleNewGame = () => {
    emit('newGame');
};

interface Props {
    gameState: GameState;
    modelIds: Record<Position, string>;
}

const props = defineProps<Props>();
const gameStore = useGameStore();

interface PlayerStats {
    position: Position;
    team: 0 | 1;
    modelName: string;
    tricksWon: number;
    totalTricks: number;
    winRate: number;
    trumpCalls: number;
    trumpCallWins: number;
    trumpCallSuccessRate: number;
    aloneAttempts: number;
    isWinningTeam: boolean;
}

const winnerTeamName = computed(() => {
    const winner = props.gameState.gameScores[0] > props.gameState.gameScores[1] ? 'Team 1' : 'Team 2';
    return winner;
});

const gameScores = computed(() => props.gameState.gameScores);

// Calculate player statistics from hand history
const playerStats = computed((): PlayerStats[] => {
    const stats: PlayerStats[] = [];
    const winningTeam = props.gameState.gameScores[0] > props.gameState.gameScores[1] ? 0 : 1;
    const handHistory = gameStore.gameHistory.hands;

    for (const player of props.gameState.players) {
        // Count tricks won by this player (from last hand only - completedTricks is per hand)
        const tricksWon = props.gameState.completedTricks.filter(
            trick => trick.winner === player.position
        ).length;

        const totalTricks = props.gameState.completedTricks.length;
        const winRate = totalTricks > 0 ? Math.round((tricksWon / totalTricks) * 100) : 0;

        // Count trump calls and success rate from hand history
        const trumpCalls = handHistory.filter(h => h.trumpCaller === player.position).length;
        const trumpCallWins = handHistory.filter(h => {
            if (h.trumpCaller !== player.position) return false;
            // Determine if the calling team won
            const callerTeam = ['north', 'south'].includes(h.trumpCaller) ? 'NS' : 'EW';
            return callerTeam === h.winningTeam;
        }).length;
        const trumpCallSuccessRate = trumpCalls > 0 ? Math.round((trumpCallWins / trumpCalls) * 100) : 0;

        // Count alone attempts
        const aloneAttempts = handHistory.filter(h => h.goingAlone === player.position).length;

        // Get short model name
        const modelId = props.modelIds[player.position];
        const parts = modelId.split('/');
        const modelName = parts[parts.length - 1] || modelId;

        stats.push({
            position: player.position,
            team: player.team,
            modelName,
            tricksWon,
            totalTricks,
            winRate,
            trumpCalls,
            trumpCallWins,
            trumpCallSuccessRate,
            aloneAttempts,
            isWinningTeam: player.team === winningTeam,
        });
    }

    return stats;
});

// Rank players by tricks won, then by win rate
const rankedPlayers = computed(() => {
    return [...playerStats.value].sort((a, b) => {
        // First by tricks won
        if (b.tricksWon !== a.tricksWon) {
            return b.tricksWon - a.tricksWon;
        }
        // Then by win rate
        return b.winRate - a.winRate;
    });
});
</script>

<style scoped>
.game-summary {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    overflow-y: auto;
}

.summary-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.new-game-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 2px solid rgba(56, 189, 186, 0.5);
    color: var(--color-accent);
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.new-game-btn:hover {
    background: rgba(56, 189, 186, 0.15);
    border-color: rgba(56, 189, 186, 0.8);
    box-shadow: 0 0 15px rgba(56, 189, 186, 0.3);
}

.summary-title {
    font-size: 1.125rem;
    font-weight: 500;
    margin: 0;
    color: var(--color-text);
}

.keyword {
    color: var(--color-keyword);
}

.bracket {
    color: var(--color-text-muted);
}

.rankings-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-label {
    font-size: 0.9375rem;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1rem;
}

.property {
    color: var(--color-accent);
}

.comment {
    color: var(--color-text-muted);
    font-style: italic;
}

.player-rankings {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
}

.player-stat-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(107, 114, 128, 0.3);
    border-radius: 0;
    transition: all 0.2s ease;
}

.player-stat-card.winner-team {
    border-color: rgba(56, 189, 186, 0.5);
    background: rgba(56, 189, 186, 0.05);
}

.rank-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background: rgba(56, 189, 186, 0.15);
    border: 2px solid rgba(56, 189, 186, 0.4);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-accent);
    flex-shrink: 0;
}

.player-stat-card.winner-team .rank-badge {
    background: rgba(56, 189, 186, 0.25);
    border-color: rgba(56, 189, 186, 0.6);
}

.player-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
}

.player-header {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.player-position {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
}

.team-badge {
    padding: 0.25rem 0.75rem;
    background: rgba(107, 114, 128, 0.3);
    border: 1px solid rgba(107, 114, 128, 0.5);
    font-size: 0.75rem;
    color: var(--color-text-secondary);
}

.player-stat-card.winner-team .team-badge {
    background: rgba(56, 189, 186, 0.2);
    border-color: rgba(56, 189, 186, 0.5);
    color: var(--color-accent);
}

.model-name {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    font-family: "Courier New", monospace;
}

.player-stats {
    display: flex;
    gap: 1.5rem;
    align-items: center;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.stat-label {
    color: var(--color-text-secondary);
}

.stat-value {
    color: #fbbf24;
    font-weight: 600;
}

.stat-detail {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    margin-left: 0.25rem;
}

.metacognition-section {
    margin-top: 1rem;
}

.summary-footer {
    font-size: 1.125rem;
    color: var(--color-text);
    padding: 0 1rem;
}
</style>
