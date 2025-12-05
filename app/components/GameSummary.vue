<template>
    <div class="game-summary">
        <div class="summary-header">
            <h2 class="summary-title">
                <span class="keyword">const</span> gameSummary = <span class="bracket">{</span>
            </h2>
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
                            <span class="stat-label">called_trump:</span>
                            <span class="stat-value boolean">{{ stat.calledTrump }}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">went_alone:</span>
                            <span class="stat-value boolean">{{ stat.wentAlone }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-label">
                <span class="bracket">]</span>
            </div>
        </div>

        <!-- Placeholder for future judge analysis -->
        <div class="judge-section">
            <div class="section-label">
                <span class="property">judgeAnalysis:</span>
                <span class="comment">// Coming soon...</span>
            </div>
            <div class="judge-placeholder">
                <span class="placeholder-text">AI judge analysis will appear here</span>
            </div>
        </div>

        <div class="summary-footer">
            <span class="bracket">}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameState, Position } from '~/types/game';

interface Props {
    gameState: GameState;
    modelIds: Record<Position, string>;
}

const props = defineProps<Props>();

interface PlayerStats {
    position: Position;
    team: 0 | 1;
    modelName: string;
    tricksWon: number;
    totalTricks: number;
    winRate: number;
    calledTrump: boolean;
    wentAlone: boolean;
    isWinningTeam: boolean;
}

const winnerTeamName = computed(() => {
    const winner = props.gameState.gameScores[0] > props.gameState.gameScores[1] ? 'Team 1' : 'Team 2';
    return winner;
});

const gameScores = computed(() => props.gameState.gameScores);

// Calculate player statistics
const playerStats = computed((): PlayerStats[] => {
    const stats: PlayerStats[] = [];
    const winningTeam = props.gameState.gameScores[0] > props.gameState.gameScores[1] ? 0 : 1;

    for (const player of props.gameState.players) {
        // Count tricks won by this player
        const tricksWon = props.gameState.completedTricks.filter(
            trick => trick.winner === player.position
        ).length;

        const totalTricks = props.gameState.completedTricks.length;
        const winRate = totalTricks > 0 ? Math.round((tricksWon / totalTricks) * 100) : 0;

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
            calledTrump: props.gameState.trumpCaller === player.position,
            wentAlone: props.gameState.goingAlone === player.position,
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
    flex-direction: column;
    gap: 1rem;
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
    border-color: rgba(163, 230, 53, 0.5);
    background: rgba(163, 230, 53, 0.05);
}

.rank-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background: rgba(163, 230, 53, 0.15);
    border: 2px solid rgba(163, 230, 53, 0.4);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-accent);
    flex-shrink: 0;
}

.player-stat-card.winner-team .rank-badge {
    background: rgba(163, 230, 53, 0.25);
    border-color: rgba(163, 230, 53, 0.6);
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
    background: rgba(163, 230, 53, 0.2);
    border-color: rgba(163, 230, 53, 0.5);
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

.stat-value.boolean {
    color: #c084fc;
    font-style: italic;
}

.judge-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.judge-placeholder {
    padding: 2rem;
    background: rgba(0, 0, 0, 0.3);
    border: 2px dashed rgba(107, 114, 128, 0.3);
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 8rem;
}

.placeholder-text {
    color: var(--color-text-muted);
    font-style: italic;
    font-size: 0.9375rem;
}

.summary-footer {
    font-size: 1.125rem;
    color: var(--color-text);
    padding: 0 1rem;
}
</style>
