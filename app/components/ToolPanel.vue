<template>
    <div class="tool-panel" :class="{ 'has-activity': hasToolActivity }">
        <div class="panel-header">
            <span class="comment">// </span>tool_usage
            <span v-if="hasToolActivity" class="active-indicator"></span>
        </div>

        <!-- ReACT Phase Indicator -->
        <div class="react-phases" v-if="isStreaming">
            <div
                v-for="phase in phases"
                :key="phase.id"
                class="phase-item"
                :class="{
                    active: currentPhase === phase.id,
                    completed: isPhaseCompleted(phase.id)
                }"
            >
                <span class="phase-icon">{{ phase.icon }}</span>
                <span class="phase-label">{{ phase.label }}</span>
            </div>
        </div>

        <!-- Active Tool Request -->
        <div class="tool-request" v-if="currentToolRequest">
            <div class="tool-header">
                <span class="tool-icon">{{ getToolIcon(currentToolRequest.tool) }}</span>
                <span class="tool-name">{{ formatToolName(currentToolRequest.tool) }}</span>
                <span class="tool-cost">-{{ currentToolRequest.cost }} pts</span>
            </div>
            <div class="tool-progress" v-if="toolProgress">
                <span class="progress-indicator"></span>
                {{ toolProgress }}
            </div>
        </div>

        <!-- Tool Result -->
        <div class="tool-result" v-if="toolResult">
            <div class="result-header">
                <span class="result-icon">{{ getToolIcon(toolResult.tool) }}</span>
                <span class="result-label">{{ formatToolName(toolResult.tool) }} Result</span>
                <span class="result-duration">{{ toolResult.duration }}ms</span>
            </div>
            <div class="result-content">
                <template v-if="toolResult.tool === 'ask_audience'">
                    <div
                        v-for="(response, index) in formatAskAudienceResult(toolResult.result)"
                        :key="index"
                        class="audience-response"
                    >
                        <span class="response-model">{{ response.model }}</span>
                        <span class="response-recommendation">{{ response.recommendation }}</span>
                    </div>
                </template>
                <template v-else-if="toolResult.tool === 'situation_lookup'">
                    <div class="lookup-result">
                        <span class="lookup-label">Similar situations:</span>
                        <span class="lookup-value">{{ formatLookupResult(toolResult.result) }}</span>
                    </div>
                </template>
                <template v-else-if="toolResult.tool === 'fifty_fifty'">
                    <div class="fifty-result">
                        <span class="fifty-label">Winning options:</span>
                        <div class="fifty-options">
                            <span
                                v-for="(option, idx) in formatFiftyFiftyResult(toolResult.result)"
                                :key="idx"
                                class="fifty-option"
                            >
                                {{ option }}
                            </span>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <pre class="raw-result">{{ JSON.stringify(toolResult.result, null, 2) }}</pre>
                </template>
            </div>
        </div>

        <!-- Tool Usage Grid (when no active tool) -->
        <div class="tool-usage-section" v-if="!hasToolActivity && showAvailableTools">
            <!-- Tool usage per agent -->
            <div class="usage-grid">
                <div class="usage-header">
                    <span class="usage-label">tool</span>
                    <span class="agent-col">N</span>
                    <span class="agent-col">E</span>
                    <span class="agent-col">S</span>
                    <span class="agent-col">W</span>
                    <span class="cost-col">cost</span>
                </div>
                <div v-for="tool in availableTools" :key="tool.id" class="usage-row">
                    <span class="tool-info">
                        <span class="tool-icon">{{ tool.icon }}</span>
                        <span class="tool-name">{{ tool.name }}</span>
                    </span>
                    <span class="agent-col" :class="{ 'has-usage': getToolUsageForAgent('north', tool.id) > 0 }">
                        {{ getToolUsageForAgent('north', tool.id) || '-' }}
                    </span>
                    <span class="agent-col" :class="{ 'has-usage': getToolUsageForAgent('east', tool.id) > 0 }">
                        {{ getToolUsageForAgent('east', tool.id) || '-' }}
                    </span>
                    <span class="agent-col" :class="{ 'has-usage': getToolUsageForAgent('south', tool.id) > 0 }">
                        {{ getToolUsageForAgent('south', tool.id) || '-' }}
                    </span>
                    <span class="agent-col" :class="{ 'has-usage': getToolUsageForAgent('west', tool.id) > 0 }">
                        {{ getToolUsageForAgent('west', tool.id) || '-' }}
                    </span>
                    <span class="cost-col">-{{ tool.cost }}</span>
                </div>
                <div class="usage-totals">
                    <span class="totals-label">total cost</span>
                    <span class="agent-col total" :class="{ 'has-cost': getTotalToolCost('north') > 0 }">
                        {{ getTotalToolCost('north') > 0 ? `-${getTotalToolCost('north')}` : '-' }}
                    </span>
                    <span class="agent-col total" :class="{ 'has-cost': getTotalToolCost('east') > 0 }">
                        {{ getTotalToolCost('east') > 0 ? `-${getTotalToolCost('east')}` : '-' }}
                    </span>
                    <span class="agent-col total" :class="{ 'has-cost': getTotalToolCost('south') > 0 }">
                        {{ getTotalToolCost('south') > 0 ? `-${getTotalToolCost('south')}` : '-' }}
                    </span>
                    <span class="agent-col total" :class="{ 'has-cost': getTotalToolCost('west') > 0 }">
                        {{ getTotalToolCost('west') > 0 ? `-${getTotalToolCost('west')}` : '-' }}
                    </span>
                    <span class="cost-col"></span>
                </div>
            </div>
        </div>

        <!-- Idle state -->
        <div class="idle-state" v-if="!hasToolActivity && !showAvailableTools">
            <span class="idle-text">No active tools</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '~/stores/game';
import type { Position } from '../../lib/game/types';

interface Props {
    showAvailableTools?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    showAvailableTools: false,
});

const gameStore = useGameStore();

// Get tool usage count for a specific agent and tool
const getToolUsageForAgent = (position: Position, toolId: string): number => {
    // Count tool usage from game history
    let count = 0;
    for (const hand of gameStore.gameHistory.hands) {
        // Check trump decisions
        for (const decision of hand.trumpDecisions) {
            if (decision.player === position && decision.toolUsed?.tool === toolId) {
                count++;
            }
        }
        // Check card plays in tricks
        for (const trick of hand.tricks) {
            for (const play of trick.plays) {
                if (play.player === position && play.toolUsed?.tool === toolId) {
                    count++;
                }
            }
        }
    }
    return count;
};

// Get total tool cost for an agent (calculated from game history)
const getTotalToolCost = (position: Position): number => {
    let totalCost = 0;
    for (const hand of gameStore.gameHistory.hands) {
        // Check trump decisions
        for (const decision of hand.trumpDecisions) {
            if (decision.player === position && decision.toolUsed) {
                totalCost += decision.toolUsed.cost;
            }
        }
        // Check card plays in tricks
        for (const trick of hand.tricks) {
            for (const play of trick.plays) {
                if (play.player === position && play.toolUsed) {
                    totalCost += play.toolUsed.cost;
                }
            }
        }
    }
    return totalCost;
};

const phases = [
    { id: 'thought', label: 'Think', icon: '💭' },
    { id: 'action', label: 'Tool', icon: '🔧' },
    { id: 'observation', label: 'Observe', icon: '👁' },
    { id: 'response', label: 'Decide', icon: '✓' },
];

const availableTools = [
    { id: 'ask_audience', name: 'Ask Audience', cost: 2, icon: '👥' },
    { id: 'situation_lookup', name: 'Situation Lookup', cost: 1, icon: '📚' },
    { id: 'fifty_fifty', name: '50/50', cost: 3, icon: '🎯' },
];

const isStreaming = computed(() => gameStore.isStreaming);
const currentPhase = computed(() => gameStore.reactPhase);
const currentToolRequest = computed(() => gameStore.currentToolRequest);
const toolProgress = computed(() => gameStore.toolProgress);
const toolResult = computed(() => gameStore.toolResult);

const hasToolActivity = computed(() => {
    return currentToolRequest.value !== null || toolResult.value !== null;
});

const isPhaseCompleted = (phaseId: string): boolean => {
    const phaseOrder = ['thought', 'action', 'observation', 'response'];
    const currentIndex = phaseOrder.indexOf(currentPhase.value);
    const phaseIndex = phaseOrder.indexOf(phaseId);
    return phaseIndex < currentIndex;
};

const getToolIcon = (tool: string): string => {
    const icons: Record<string, string> = {
        ask_audience: '👥',
        situation_lookup: '📚',
        fifty_fifty: '🎯',
    };
    return icons[tool] || '🔧';
};

const formatToolName = (tool: string): string => {
    const names: Record<string, string> = {
        ask_audience: 'Ask Audience',
        situation_lookup: 'Situation Lookup',
        fifty_fifty: '50/50',
    };
    return names[tool] || tool;
};

interface AudienceResponse {
    model: string;
    recommendation: string;
}

// Type guard for checking if value is a non-null object
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

const formatAskAudienceResult = (result: unknown): AudienceResponse[] => {
    if (!isRecord(result)) return [];

    const responses = result.responses;
    if (!Array.isArray(responses)) return [];

    return responses
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .map((response) => ({
            model: typeof response.modelId === 'string'
                ? response.modelId.split('/').pop() || 'Unknown'
                : 'Unknown',
            recommendation: typeof response.recommendation === 'string'
                ? response.recommendation
                : 'No recommendation',
        }));
};

const formatLookupResult = (result: unknown): string => {
    if (!isRecord(result)) return 'No similar situations found';

    if (typeof result.summary === 'string') return result.summary;
    if (Array.isArray(result.situations)) {
        return `Found ${result.situations.length} similar situation(s)`;
    }
    return 'No similar situations found';
};

const formatFiftyFiftyResult = (result: unknown): string[] => {
    if (!isRecord(result)) return [];

    const winningCards = result.winningCards;
    if (!Array.isArray(winningCards)) return [];

    return winningCards
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .map((card) => {
            const rank = typeof card.rank === 'string' ? card.rank : '?';
            const suit = typeof card.suit === 'string' ? card.suit : '?';
            return `${rank} of ${suit}`;
        });
};
</script>

<style scoped>
.tool-panel {
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.3s ease;
}

.tool-panel.has-activity {
    border-color: rgba(163, 230, 53, 0.5);
    box-shadow: 0 0 15px rgba(163, 230, 53, 0.1);
}

.panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.comment {
    color: var(--color-text-muted);
}

.active-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #a3e635;
    animation: pulse 1.5s infinite;
    margin-left: auto;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

/* ReACT Phases */
.react-phases {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.phase-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    opacity: 0.3;
    transition: all 0.3s ease;
}

.phase-item.active {
    opacity: 1;
}

.phase-item.active .phase-icon {
    transform: scale(1.2);
}

.phase-item.completed {
    opacity: 0.6;
}

.phase-item.completed .phase-label {
    color: #a3e635;
}

.phase-icon {
    font-size: 1.25rem;
    transition: transform 0.3s ease;
}

.phase-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
}

/* Tool Request */
.tool-request {
    padding: 0.75rem 1rem;
    background: rgba(163, 230, 53, 0.05);
    border-bottom: 1px solid rgba(163, 230, 53, 0.2);
}

.tool-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tool-icon {
    font-size: 1.125rem;
}

.tool-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
}

.tool-cost {
    margin-left: auto;
    font-size: 0.75rem;
    font-weight: 600;
    color: #f59e0b;
    font-family: "Courier New", monospace;
}

.tool-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
}

.progress-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #a3e635;
    animation: blink 0.8s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
}

/* Tool Result */
.tool-result {
    padding: 0.75rem 1rem;
    background: rgba(56, 189, 186, 0.05);
}

.result-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.result-icon {
    font-size: 1rem;
}

.result-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.result-duration {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-family: "Courier New", monospace;
}

.result-content {
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    font-size: 0.75rem;
}

/* Ask Audience Results */
.audience-response {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.audience-response:last-child {
    border-bottom: none;
}

.response-model {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    min-width: 80px;
}

.response-recommendation {
    color: #a3e635;
    font-weight: 500;
}

/* Lookup Results */
.lookup-result {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.lookup-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
}

.lookup-value {
    color: var(--color-text-primary);
}

/* 50/50 Results */
.fifty-result {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.fifty-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
}

.fifty-options {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.fifty-option {
    padding: 0.25rem 0.5rem;
    background: rgba(163, 230, 53, 0.15);
    border: 1px solid rgba(163, 230, 53, 0.3);
    border-radius: 4px;
    color: #a3e635;
    font-weight: 500;
}

.raw-result {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    overflow-x: auto;
}

/* Tool Usage Grid */
.tool-usage-section {
    padding: 0.75rem;
}

.usage-grid {
    font-size: 0.75rem;
}

.usage-header {
    display: grid;
    grid-template-columns: 1fr repeat(4, 28px) 40px;
    gap: 0.25rem;
    padding: 0.375rem 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px 4px 0 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
}

.usage-label {
    text-align: left;
}

.agent-col {
    text-align: center;
    font-family: "Courier New", monospace;
}

.agent-col.has-usage {
    color: #a3e635;
    font-weight: 600;
}

.agent-col.total {
    font-weight: 600;
}

.agent-col.total.has-cost {
    color: #f59e0b;
}

.cost-col {
    text-align: right;
    font-family: "Courier New", monospace;
    color: var(--color-text-muted);
}

.usage-row {
    display: grid;
    grid-template-columns: 1fr repeat(4, 28px) 40px;
    gap: 0.25rem;
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    align-items: center;
}

.usage-row:last-child {
    border-bottom: none;
}

.tool-info {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.tool-info .tool-icon {
    font-size: 0.875rem;
}

.tool-info .tool-name {
    color: var(--color-text-secondary);
    font-size: 0.6875rem;
}

.usage-totals {
    display: grid;
    grid-template-columns: 1fr repeat(4, 28px) 40px;
    gap: 0.25rem;
    padding: 0.5rem 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 0 0 4px 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.totals-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
}

/* Idle State */
.idle-state {
    padding: 1.5rem 1rem;
    text-align: center;
}

.idle-text {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-style: italic;
}
</style>
