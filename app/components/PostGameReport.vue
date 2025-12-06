<template>
    <div class="post-game-report">
        <div class="report-header">
            <span class="comment">// </span>metacognition_report
            <span class="version">v1.0</span>
        </div>

        <!-- Performance Rankings -->
        <section class="report-section">
            <div class="section-header">
                <span class="section-icon">🏆</span>
                <span class="section-title">Performance Rankings</span>
            </div>
            <div class="rankings-list">
                <div
                    v-for="(agent, index) in rankedAgents"
                    :key="agent.position"
                    class="ranking-item"
                    :class="[agent.position, { 'top-performer': index === 0 }]"
                >
                    <div class="rank">{{ index + 1 }}</div>
                    <div class="agent-info">
                        <div class="agent-name">{{ agent.position.toUpperCase() }}</div>
                        <div class="agent-model">{{ agent.modelName }}</div>
                    </div>
                    <div class="agent-stats">
                        <div class="stat performance-score">
                            <span class="stat-value" :class="getScoreClass(agent.totalScore)">
                                {{ agent.totalScore > 0 ? '+' : '' }}{{ agent.totalScore }}
                            </span>
                            <span class="stat-label">perf pts</span>
                        </div>
                        <div class="stat calibration">
                            <span class="stat-value">{{ agent.calibrationAccuracy }}%</span>
                            <span class="stat-label">calibration</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Calibration Analysis -->
        <section class="report-section">
            <div class="section-header">
                <span class="section-icon">📊</span>
                <span class="section-title">Calibration Analysis</span>
            </div>
            <div class="calibration-grid">
                <div
                    v-for="agent in rankedAgents"
                    :key="agent.position"
                    class="calibration-card"
                >
                    <div class="card-header">
                        <span class="position">{{ agent.position.toUpperCase() }}</span>
                        <span class="assessment" :class="getAssessmentClass(agent.assessment)">
                            {{ agent.assessment }}
                        </span>
                    </div>
                    <div class="card-stats">
                        <div class="stat-row">
                            <span class="label">Avg Confidence:</span>
                            <span class="value">{{ agent.avgConfidence }}%</span>
                        </div>
                        <div class="stat-row">
                            <span class="label">Actual Accuracy:</span>
                            <span class="value">{{ agent.accuracy }}%</span>
                        </div>
                        <div class="stat-row">
                            <span class="label">High Conf Correct:</span>
                            <span class="value correct">{{ agent.highConfidenceCorrect }}</span>
                        </div>
                        <div class="stat-row">
                            <span class="label">High Conf Wrong:</span>
                            <span class="value wrong">{{ agent.highConfidenceWrong }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tool Usage Stats -->
        <section class="report-section" v-if="hasToolUsage">
            <div class="section-header">
                <span class="section-icon">🔧</span>
                <span class="section-title">Tool Usage Efficiency</span>
            </div>
            <div class="tool-stats">
                <div
                    v-for="agent in agentsWithToolUsage"
                    :key="agent.position"
                    class="tool-stat-row"
                >
                    <span class="position">{{ agent.position.toUpperCase() }}</span>
                    <span class="tools-used">{{ agent.toolsUsed }} tools</span>
                    <span class="tool-cost">-{{ agent.toolCostTotal }} pts</span>
                    <span class="efficiency" :class="getEfficiencyClass(agent.toolEfficiency)">
                        {{ agent.toolEfficiency }}
                    </span>
                </div>
            </div>
        </section>

        <!-- Summary Stats -->
        <section class="report-section summary">
            <div class="summary-grid">
                <div class="summary-stat">
                    <span class="stat-value">{{ totalDecisions }}</span>
                    <span class="stat-label">Total Decisions</span>
                </div>
                <div class="summary-stat">
                    <span class="stat-value">{{ handsPlayed }}</span>
                    <span class="stat-label">Hands Played</span>
                </div>
                <div class="summary-stat">
                    <span class="stat-value">{{ avgCalibration }}%</span>
                    <span class="stat-label">Avg Calibration</span>
                </div>
                <div class="summary-stat">
                    <span class="stat-value">{{ totalToolsUsed }}</span>
                    <span class="stat-label">Tools Used</span>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Position } from '~/types/game';
import { useGameStore } from '~/stores/game';
import {
    calculateCalibrationAccuracy,
    getCalibrationAssessment,
    type AgentPerformance,
} from '../../lib/scoring/calibration';

const gameStore = useGameStore();

const positions: Position[] = ['north', 'east', 'south', 'west'];

interface RankedAgent {
    position: Position;
    modelName: string;
    totalScore: number;
    calibrationAccuracy: number;
    avgConfidence: number;
    accuracy: number;
    highConfidenceCorrect: number;
    highConfidenceWrong: number;
    assessment: string;
    toolsUsed: number;
    toolCostTotal: number;
    toolEfficiency: string;
}

const rankedAgents = computed((): RankedAgent[] => {
    const agents: RankedAgent[] = positions.map((pos) => {
        const perf = gameStore.agentPerformance[pos];
        const modelId = gameStore.modelIds[pos];
        const modelName = modelId.split('/').pop() || modelId;

        if (!perf || perf.totalDecisions === 0) {
            return {
                position: pos,
                modelName,
                totalScore: 0,
                calibrationAccuracy: 50,
                avgConfidence: 50,
                accuracy: 0,
                highConfidenceCorrect: 0,
                highConfidenceWrong: 0,
                assessment: 'No data',
                toolsUsed: 0,
                toolCostTotal: 0,
                toolEfficiency: 'N/A',
            };
        }

        const calibrationAccuracy = Math.round(calculateCalibrationAccuracy(perf));
        const avgConfidence = Math.round(perf.totalConfidence / perf.totalDecisions);
        const accuracy = Math.round((perf.correctDecisions / perf.totalDecisions) * 100);
        const assessment = getCalibrationAssessment(perf);

        // Tool efficiency: good if tools helped, bad if wasted
        let toolEfficiency = 'N/A';
        if (perf.toolsUsed > 0) {
            const avgScorePerTool = perf.totalScore / perf.toolsUsed;
            if (avgScorePerTool >= 2) toolEfficiency = 'Efficient';
            else if (avgScorePerTool >= 0) toolEfficiency = 'Neutral';
            else toolEfficiency = 'Wasteful';
        }

        return {
            position: pos,
            modelName,
            totalScore: perf.totalScore,
            calibrationAccuracy,
            avgConfidence,
            accuracy,
            highConfidenceCorrect: perf.highConfidenceCorrect,
            highConfidenceWrong: perf.highConfidenceWrong,
            assessment,
            toolsUsed: perf.toolsUsed,
            toolCostTotal: perf.toolCostTotal,
            toolEfficiency,
        };
    });

    // Sort by total score (performance), descending
    return agents.sort((a, b) => b.totalScore - a.totalScore);
});

const hasToolUsage = computed(() => {
    return rankedAgents.value.some((a) => a.toolsUsed > 0);
});

const agentsWithToolUsage = computed(() => {
    return rankedAgents.value.filter((a) => a.toolsUsed > 0);
});

const totalDecisions = computed(() => {
    return positions.reduce((sum, pos) => {
        const perf = gameStore.agentPerformance[pos];
        return sum + (perf?.totalDecisions ?? 0);
    }, 0);
});

const handsPlayed = computed(() => {
    return gameStore.gameHistory.hands.length;
});

const avgCalibration = computed(() => {
    const agents = rankedAgents.value.filter((a) => a.calibrationAccuracy !== 50);
    if (agents.length === 0) return 50;
    return Math.round(agents.reduce((sum, a) => sum + a.calibrationAccuracy, 0) / agents.length);
});

const totalToolsUsed = computed(() => {
    return rankedAgents.value.reduce((sum, a) => sum + a.toolsUsed, 0);
});

const getScoreClass = (score: number): string => {
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
};

const getAssessmentClass = (assessment: string): string => {
    if (assessment.includes('Excellent') || assessment.includes('Good')) return 'good';
    if (assessment.includes('Overconfident') || assessment.includes('Underconfident')) return 'warning';
    if (assessment.includes('Needs')) return 'poor';
    return 'neutral';
};

const getEfficiencyClass = (efficiency: string): string => {
    if (efficiency === 'Efficient') return 'good';
    if (efficiency === 'Wasteful') return 'poor';
    return 'neutral';
};
</script>

<style scoped>
.post-game-report {
    background: rgba(10, 20, 20, 0.95);
    border: 2px solid rgba(56, 189, 186, 0.4);
    border-radius: 12px;
    overflow: hidden;
}

.report-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: rgba(56, 189, 186, 0.1);
    border-bottom: 1px solid rgba(56, 189, 186, 0.3);
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
}

.comment {
    color: var(--color-text-muted);
}

.version {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.report-section {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.report-section:last-child {
    border-bottom: none;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.section-icon {
    font-size: 1.25rem;
}

.section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Rankings */
.rankings-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.ranking-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.2s ease;
}

.ranking-item.top-performer {
    border-color: rgba(163, 230, 53, 0.5);
    background: rgba(163, 230, 53, 0.05);
    box-shadow: 0 0 15px rgba(163, 230, 53, 0.1);
}

.ranking-item.north,
.ranking-item.south {
    border-left: 3px solid rgba(56, 189, 186, 0.5);
}

.ranking-item.east,
.ranking-item.west {
    border-left: 3px solid rgba(248, 113, 113, 0.5);
}

.rank {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-muted);
    width: 2rem;
    text-align: center;
}

.ranking-item.top-performer .rank {
    color: #a3e635;
}

.agent-info {
    flex: 1;
}

.agent-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}

.agent-model {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.agent-stats {
    display: flex;
    gap: 1.5rem;
}

.stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
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

.stat-label {
    font-size: 0.625rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
}

/* Calibration Grid */
.calibration-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
}

.calibration-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.75rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.card-header .position {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.assessment {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
}

.assessment.good {
    background: rgba(163, 230, 53, 0.2);
    color: #a3e635;
}

.assessment.warning {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
}

.assessment.poor {
    background: rgba(248, 113, 113, 0.2);
    color: #f87171;
}

.assessment.neutral {
    background: rgba(107, 114, 128, 0.2);
    color: var(--color-text-secondary);
}

.card-stats {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.6875rem;
}

.stat-row .label {
    color: var(--color-text-muted);
}

.stat-row .value {
    color: var(--color-text-secondary);
    font-family: "Courier New", monospace;
}

.stat-row .value.correct {
    color: #a3e635;
}

.stat-row .value.wrong {
    color: #f87171;
}

/* Tool Stats */
.tool-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.tool-stat-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 0.75rem;
}

.tool-stat-row .position {
    font-weight: 600;
    color: var(--color-text-secondary);
    width: 60px;
}

.tool-stat-row .tools-used {
    color: var(--color-text);
}

.tool-stat-row .tool-cost {
    color: #f59e0b;
    font-family: "Courier New", monospace;
}

.tool-stat-row .efficiency {
    margin-left: auto;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.625rem;
}

.efficiency.good {
    background: rgba(163, 230, 53, 0.2);
    color: #a3e635;
}

.efficiency.poor {
    background: rgba(248, 113, 113, 0.2);
    color: #f87171;
}

.efficiency.neutral {
    background: rgba(107, 114, 128, 0.2);
    color: var(--color-text-secondary);
}

/* Summary */
.summary {
    background: rgba(56, 189, 186, 0.05);
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
}

.summary-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
}

.summary-stat .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
}

.summary-stat .stat-label {
    font-size: 0.625rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
}
</style>
