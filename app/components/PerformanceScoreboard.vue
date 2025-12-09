<template>
    <div class="performance-scoreboard">
        <div class="scoreboard-header">
            <span class="comment">// </span>performance_scores
            <button
                v-if="showScoringInfo"
                class="info-btn"
                @click="$emit('show-scoring-rules')"
                title="View scoring rules"
            >
                ?
            </button>
        </div>
        <div class="scoreboard-grid">
            <div
                v-for="position in positions"
                :key="position"
                class="agent-card"
                :class="[position, { 'is-current': position === currentPlayer }]"
            >
                <div class="agent-header">
                    <span class="position-label">{{ position.toUpperCase() }}</span>
                    <span class="model-name">{{ getModelName(position) }}</span>
                </div>

                <div class="stats-row">
                    <div class="stat">
                        <span class="stat-label">score</span>
                        <span class="stat-value" :class="getScoreClass(position)">
                            {{ getPerformance(position)?.totalScore ?? 0 }}
                        </span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">decisions</span>
                        <span class="stat-value">{{ getPerformance(position)?.totalDecisions ?? 0 }}</span>
                    </div>
                </div>

                <div class="calibration-section">
                    <div class="calibration-header">
                        <span class="calibration-label">calibration</span>
                        <span class="calibration-value">{{ getCalibrationPercent(position) }}%</span>
                    </div>
                    <div class="calibration-bar">
                        <div
                            class="calibration-fill"
                            :style="{ width: `${getCalibrationPercent(position)}%` }"
                            :class="getCalibrationClass(position)"
                        ></div>
                    </div>
                    <div class="brier-row">
                        <span class="brier-label">brier</span>
                        <span class="brier-value" :class="getBrierClass(position)">{{ getBrierScore(position) }}</span>
                    </div>
                </div>

                <div class="confidence-breakdown" v-if="hasDecisions(position)">
                    <div class="breakdown-row">
                        <span class="breakdown-label">high conf</span>
                        <span class="breakdown-value correct">{{ getPerformance(position)?.highConfidenceCorrect ?? 0 }}</span>
                        <span class="breakdown-separator">/</span>
                        <span class="breakdown-value wrong">{{ getPerformance(position)?.highConfidenceWrong ?? 0 }}</span>
                    </div>
                    <div class="breakdown-row" v-if="hasToolUsage(position)">
                        <span class="breakdown-label">tools</span>
                        <span class="breakdown-value neutral">{{ getPerformance(position)?.toolsUsed ?? 0 }} used</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Position } from '~/types/game';
import { useGameStore } from '~/stores/game';
import { calculateCalibrationAccuracy, calculateBrierScore } from '../../lib/scoring/calibration';

interface Props {
    currentPlayer?: Position | null;
    showScoringInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    currentPlayer: null,
    showScoringInfo: false,
});

defineEmits<{
    'show-scoring-rules': [];
}>();

const gameStore = useGameStore();

const positions: Position[] = ['north', 'east', 'south', 'west'];

const getModelName = (position: Position): string => {
    const modelId = gameStore.modelIds[position];
    const parts = modelId.split('/');
    return parts[parts.length - 1] || modelId;
};

const getPerformance = (position: Position) => {
    return gameStore.agentPerformance[position];
};

const hasDecisions = (position: Position): boolean => {
    const perf = getPerformance(position);
    return (perf?.totalDecisions ?? 0) > 0;
};

const hasToolUsage = (position: Position): boolean => {
    const perf = getPerformance(position);
    return (perf?.toolsUsed ?? 0) > 0;
};

const getCalibrationPercent = (position: Position): number => {
    const perf = getPerformance(position);
    if (!perf || perf.totalDecisions === 0) return 50; // neutral default
    return Math.round(calculateCalibrationAccuracy(perf));
};

const getScoreClass = (position: Position): string => {
    const perf = getPerformance(position);
    const score = perf?.totalScore ?? 0;
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
};

const getCalibrationClass = (position: Position): string => {
    const percent = getCalibrationPercent(position);
    if (percent >= 80) return 'excellent';
    if (percent >= 60) return 'good';
    if (percent >= 40) return 'fair';
    return 'poor';
};

const getBrierScore = (position: Position): string => {
    const perf = getPerformance(position);
    if (!perf || perf.totalDecisions === 0) return '--';
    const brier = calculateBrierScore(perf);
    return brier.toFixed(3);
};

const getBrierClass = (position: Position): string => {
    const perf = getPerformance(position);
    if (!perf || perf.totalDecisions === 0) return 'neutral';
    const brier = calculateBrierScore(perf);
    // Lower is better: 0 = perfect, 0.25 = random, 1 = terrible
    if (brier <= 0.1) return 'excellent';
    if (brier <= 0.2) return 'good';
    if (brier <= 0.3) return 'fair';
    return 'poor';
};
</script>

<style scoped>
.performance-scoreboard {
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 8px;
    overflow: hidden;
}

.scoreboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.info-btn {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(56, 189, 186, 0.2);
    border: 1px solid rgba(56, 189, 186, 0.4);
    color: #38bdb8;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.info-btn:hover {
    background: rgba(56, 189, 186, 0.3);
    border-color: rgba(56, 189, 186, 0.6);
}

.comment {
    color: var(--color-text-muted);
}

.scoreboard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0.75rem;
}

.agent-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 0.75rem;
    transition: all 0.2s ease;
}

.agent-card.is-current {
    border-color: rgba(56, 189, 186, 0.5);
    box-shadow: 0 0 10px rgba(56, 189, 186, 0.2);
}

.agent-card.north,
.agent-card.south {
    border-left: 3px solid rgba(56, 189, 186, 0.5);
}

.agent-card.east,
.agent-card.west {
    border-left: 3px solid rgba(248, 113, 113, 0.5);
}

.agent-header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.position-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    letter-spacing: 0.05em;
}

.model-name {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.stats-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.stat {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.stat-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    font-family: "Courier New", monospace;
}

.stat-value.positive {
    color: #a3e635;
}

.stat-value.negative {
    color: #f87171;
}

.stat-value.neutral {
    color: var(--color-text-secondary);
}

.calibration-section {
    margin-top: 0.5rem;
}

.calibration-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
}

.calibration-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.calibration-value {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-secondary);
}

.calibration-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
}

.calibration-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.calibration-fill.excellent {
    background: linear-gradient(90deg, #a3e635, #22c55e);
}

.calibration-fill.good {
    background: linear-gradient(90deg, #22c55e, #38bdb8);
}

.calibration-fill.fair {
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.calibration-fill.poor {
    background: linear-gradient(90deg, #f87171, #ef4444);
}

.confidence-breakdown {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.breakdown-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    margin-bottom: 0.125rem;
}

.breakdown-label {
    color: var(--color-text-muted);
    min-width: 50px;
}

.breakdown-value.correct {
    color: #a3e635;
}

.breakdown-value.wrong {
    color: #f87171;
}

.breakdown-value.neutral {
    color: var(--color-text-secondary);
}

.breakdown-separator {
    color: var(--color-text-muted);
}

.brier-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.375rem;
    padding-top: 0.25rem;
}

.brier-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.brier-value {
    font-size: 0.75rem;
    font-weight: 600;
    font-family: "Courier New", monospace;
}

.brier-value.excellent {
    color: #a3e635;
}

.brier-value.good {
    color: #38bdb8;
}

.brier-value.fair {
    color: #fbbf24;
}

.brier-value.poor {
    color: #f87171;
}

.brier-value.neutral {
    color: var(--color-text-muted);
}
</style>
