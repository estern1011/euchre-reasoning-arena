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
                <div class="property-line">
                    <span class="property">status</span>: <span class="string">"{{ reasoning ? 'reasoning' : 'awaiting' }}"</span>,
                </div>
                <div class="property-line">
                    <span class="property">reasoning</span>: <span class="string">`</span>
                </div>
                <div ref="streamingTextRef" class="reasoning-text">
                    {{ reasoning || '// Awaiting agent response...' }}
                </div>
                <div class="property-line"><span class="string">`</span></div>
            </div>
        </div>
        <div class="closing-brace" aria-hidden="true">};</div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import type { Position } from "~/types/game";
import { useGameStore } from "~/stores/game";

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

.reasoning-text {
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    line-height: 1.5;
    font-size: 0.8125rem;
}

.closing-brace {
    font-size: 0.8125rem;
    color: var(--color-text);
    margin-top: 0.25rem;
}
</style>
