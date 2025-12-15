<template>
    <div class="streaming-reasoning" role="region" aria-label="AI live reasoning">
        <div class="streaming-header" aria-hidden="true">
            <span class="keyword">const</span> <span class="variable">agentThinking</span> = {
        </div>
        <div class="streaming-content">
            <div class="agent-section">
                <div class="property-line">
                    <span class="property">model</span>: <span class="string">"{{ activeModelLabel }}"</span>,
                </div>
                <div class="property-line">
                    <span class="property">player</span>: <span class="string">"{{ activePlayer }}"</span>,
                </div>

                <!-- Confidence Meter (Metacognition Arena) -->
                <div class="confidence-section" v-if="showConfidence">
                    <ConfidenceMeter
                        :confidence="currentConfidence"
                        :show-feedback="true"
                    />
                </div>

                <!-- Thought: always show while reasoning -->
                <div class="react-phase" v-if="reasoning || gameStore.initialThought">
                    <div class="property-line">
                        <span class="phase-label">// thought</span>
                    </div>
                    <div class="property-line">
                        <span class="property">thought</span>: <span class="string">`</span>
                    </div>
                    <div class="reasoning-text thought-text" v-if="gameStore.reactPhase === 'thought'">
                        {{ reasoning || '...' }}
                    </div>
                    <div class="reasoning-text thought-text completed" v-else-if="gameStore.initialThought">
                        {{ truncateThought(gameStore.initialThought) }}
                    </div>
                    <div class="property-line"><span class="string">`</span>,</div>
                </div>

                <!-- Action: show tool use OR play_card -->
                <div class="react-phase" v-if="gameStore.currentToolRequest || gameStore.toolResult">
                    <div class="property-line">
                        <span class="phase-label">// action</span>
                    </div>
                    <div class="property-line">
                        <span class="property">action</span>: {
                    </div>
                    <div class="tool-content">
                        <div class="property-line">
                            <span class="property">tool</span>: <span class="string">"{{ gameStore.currentToolRequest?.tool || gameStore.toolResult?.tool }}"</span>,
                        </div>
                        <div class="property-line">
                            <span class="property">status</span>: <span class="string">"{{ actionStatus }}"</span>,
                        </div>
                    </div>
                    <div class="property-line">},</div>
                </div>

                <!-- Observation: only show when we have tool result -->
                <div class="react-phase" v-if="gameStore.toolResult">
                    <div class="property-line">
                        <span class="phase-label">// observation</span>
                    </div>
                    <div class="property-line">
                        <span class="property">observation</span>: {
                    </div>
                    <div class="tool-content" v-if="gameStore.toolResult.tool === 'ask_audience'">
                        <div class="property-line">
                            <span class="property">responses</span>: [
                        </div>
                        <div class="audience-responses">
                            <div v-for="(opinion, idx) in audienceOpinions" :key="idx" class="property-line">
                                { <span class="property">model</span>: <span class="string">"{{ opinion.modelName }}"</span>, <span class="property">says</span>: <span class="tool-result">"{{ opinion.decision }}"</span> },
                            </div>
                        </div>
                        <div class="property-line">],</div>
                        <div class="property-line">
                            <span class="property">consensus</span>: <span class="tool-result">"{{ consensusText }}"</span>
                        </div>
                    </div>
                    <div class="tool-content" v-else>
                        <div class="property-line">
                            <span class="property">result</span>: <span class="tool-result">{{ formatToolResult(gameStore.toolResult) }}</span>
                        </div>
                    </div>
                    <div class="property-line">},</div>
                </div>

                <!-- Response: final decision after tool use -->
                <div class="react-phase" v-if="gameStore.reactPhase === 'response'">
                    <div class="property-line">
                        <span class="phase-label">// response</span>
                    </div>
                    <div class="property-line">
                        <span class="property">response</span>: <span class="string">`</span>
                    </div>
                    <div ref="streamingTextRef" class="reasoning-text response-text">
                        {{ reasoning || '...' }}
                    </div>
                    <div class="property-line"><span class="string">`</span></div>
                </div>

            </div>
        </div>
        <div class="closing-brace" aria-hidden="true">};</div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import type { Position } from "~/types/game";
import { useGameStore } from "~/stores/game";
import ConfidenceMeter from "~/components/ConfidenceMeter.vue";

interface Props {
    player: Position | null;
    reasoning: string;
}

const props = defineProps<Props>();
const gameStore = useGameStore();

const streamingTextRef = ref<HTMLElement | null>(null);

const activeModelLabel = computed(() => {
    if (!props.player) return 'awaiting';
    const modelId = gameStore.modelIds[props.player];
    if (!modelId) return props.player;
    const parts = modelId.split('/');
    return parts[parts.length - 1];
});

const activePlayer = computed(() => {
    return props.player?.toUpperCase() || 'NONE';
});

const showConfidence = computed(() => {
    // Show confidence meter when we have a last confidence value
    return gameStore.lastConfidence !== null;
});

const currentConfidence = computed(() => {
    return gameStore.lastConfidence ?? 50;
});

const actionStatus = computed(() => {
    if (gameStore.toolProgress) return gameStore.toolProgress;
    if (gameStore.toolResult) return 'complete';
    return 'executing...';
});

const audienceOpinions = computed(() => {
    if (!gameStore.toolResult || gameStore.toolResult.tool !== 'ask_audience') return [];
    const result = gameStore.toolResult.result as { opinions?: Array<{ modelName: string; decision: string; confidence: number }> };
    return result.opinions || [];
});

const consensusText = computed(() => {
    if (!gameStore.toolResult || gameStore.toolResult.tool !== 'ask_audience') return '';
    const result = gameStore.toolResult.result as { consensus?: { decision: string; agreementRate: number } };
    if (result.consensus) {
        return `${result.consensus.decision} (${Math.round(result.consensus.agreementRate)}% agree)`;
    }
    return 'no consensus';
});

function truncateThought(thought: string): string {
    if (thought.length <= 100) return thought;
    return thought.slice(0, 100) + '...';
}

function formatToolResult(result: { tool: string; result: unknown; cost: number; duration: number }): string {
    if (result.tool === 'ask_audience') {
        const audienceResult = result.result as { consensus?: { decision: string; agreementRate: number } };
        if (audienceResult.consensus) {
            return `"${audienceResult.consensus.decision}" (${Math.round(audienceResult.consensus.agreementRate)}% agree)`;
        }
        return 'No consensus';
    }
    if (result.tool === 'ask_partner') {
        const partnerResult = result.result as { partnerAdvice?: string; partnerModelName?: string };
        return `${partnerResult.partnerModelName || 'Partner'}: "${partnerResult.partnerAdvice || 'No advice'}"`;
    }
    if (result.tool === 'fifty_fifty') {
        const fiftyResult = result.result as { winningOptions?: number; totalOptions?: number };
        return `${fiftyResult.winningOptions || 0}/${fiftyResult.totalOptions || 0} cards can win`;
    }
    return JSON.stringify(result.result).slice(0, 50) + '...';
}

watch(() => props.reasoning, async () => {
    await nextTick();
    if (streamingTextRef.value) {
        streamingTextRef.value.scrollTop = streamingTextRef.value.scrollHeight;
    }
});
</script>

<style scoped>
.streaming-reasoning {
    padding: 1rem;
    font-family: "Courier New", monospace;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

.streaming-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-text);
}

.keyword {
    color: #c084fc;
}

.variable {
    color: #38bdb8;
}

.streaming-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-left: 1rem;
    font-size: 0.8125rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.agent-section {
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.property-line {
    color: var(--color-text);
    line-height: 1.6;
}

.property {
    color: #38bdb8;
}

.string {
    color: #fbbf24;
}

.number {
    color: #f472b6;
}

.phase-label {
    color: #6b7280;
    font-style: italic;
}

.react-phase {
    margin-top: 0.5rem;
}

.tool-content {
    padding-left: 1rem;
}

.audience-responses {
    padding-left: 1rem;
}

.tool-result {
    color: #34d399;
}

.reasoning-text {
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.5;
    font-size: 0.8125rem;
    padding-left: 1rem;
}

.thought-text {
    overflow-y: auto;
}

.thought-text.completed {
    color: #9ca3af;
    font-style: italic;
}

.response-text {
    flex: 1;
    min-height: 2rem;
    overflow-y: auto;
}

.closing-brace {
    font-size: 0.8125rem;
    color: var(--color-text);
    margin-top: 0.25rem;
}

.confidence-section {
    margin: 0.75rem 0;
}
</style>
