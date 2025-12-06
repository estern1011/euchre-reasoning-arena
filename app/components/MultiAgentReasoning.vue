<template>
    <div class="multi-agent-reasoning">
        <div class="reasoning-header">
            <span class="keyword">const</span> agentThinking = {
        </div>
        <div class="agents-grid">
            <div
                v-for="position in positions"
                :key="position"
                :class="['agent-cell', { active: position === currentPlayer }]"
            >
                <div class="agent-header">
                    <span class="agent-name">{{ position.toUpperCase() }}</span>
                    <span v-if="position === currentPlayer" class="live-indicator">● LIVE</span>
                </div>
                <div class="agent-model">{{ getModelName(position) }}</div>
                <div :ref="(el) => setAgentRef(el as HTMLElement | null, position)" class="agent-reasoning">
                    <template v-if="reasoning[position]">
                        {{ reasoning[position] }}<span v-if="position === currentPlayer" class="cursor">▋</span>
                    </template>
                    <span v-else class="waiting">// awaiting turn...</span>
                </div>
            </div>
        </div>
        <div class="closing-brace">}</div>
    </div>
</template>

<script setup lang="ts">
import { watch, ref, nextTick } from "vue";
import type { Position } from "~/types/game";

interface Props {
    reasoning: Partial<Record<Position, string>>;
    currentPlayer: Position | null;
    modelIds: Record<Position, string>;
}

const props = defineProps<Props>();

const positions: Position[] = ['north', 'east', 'south', 'west'];
const agentRefs = ref<Record<string, HTMLElement>>({});

const setAgentRef = (el: HTMLElement | null, position: string) => {
    if (el) {
        agentRefs.value[position] = el;
    }
};

// Watch only the current player's reasoning for auto-scroll (avoids expensive deep watch)
watch(
    () => props.currentPlayer ? props.reasoning[props.currentPlayer] : null,
    async () => {
        await nextTick();
        if (props.currentPlayer) {
            const el = agentRefs.value[props.currentPlayer];
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        }
    }
);

const getModelName = (position: Position): string => {
    const modelId = props.modelIds[position];
    if (!modelId) return 'No model';
    // Extract just the model name from "provider/model-name"
    const parts = modelId.split('/');
    return parts[parts.length - 1] || modelId;
};
</script>

<style scoped>
.multi-agent-reasoning {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
}

.reasoning-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: var(--color-text);
    flex-shrink: 0;
}

.keyword {
    color: var(--color-keyword);
}

.agents-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 0.75rem;
    flex: 1;
    min-height: 0;
}

.agent-cell {
    border: 2px solid rgba(56, 189, 186, 0.3);
    border-radius: 4px;
    padding: 1rem;
    background: rgba(0, 40, 40, 0.4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s ease;
}

.agent-cell.active {
    border-color: rgba(56, 229, 226, 0.8);
    background: rgba(56, 189, 186, 0.15);
    box-shadow:
        0 0 30px rgba(56, 229, 226, 0.4),
        0 0 60px rgba(56, 229, 226, 0.2),
        inset 0 0 30px rgba(56, 229, 226, 0.1);
    animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
    0%, 100% {
        border-color: rgba(56, 229, 226, 0.8);
        box-shadow:
            0 0 30px rgba(56, 229, 226, 0.4),
            0 0 60px rgba(56, 229, 226, 0.2),
            inset 0 0 30px rgba(56, 229, 226, 0.1);
    }
    50% {
        border-color: rgba(56, 229, 226, 1);
        box-shadow:
            0 0 40px rgba(56, 229, 226, 0.6),
            0 0 80px rgba(56, 229, 226, 0.3),
            inset 0 0 40px rgba(56, 229, 226, 0.15);
    }
}

.agent-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
    flex-shrink: 0;
}

.agent-name {
    font-weight: bold;
    letter-spacing: 1px;
    color: rgba(56, 229, 226, 1);
    font-size: 0.8125rem;
}

.agent-cell:not(.active) .agent-name {
    color: var(--color-text-secondary);
}

.live-indicator {
    color: rgba(56, 229, 226, 1);
    font-size: 0.6875rem;
    font-weight: 600;
    animation: pulse 2s ease-in-out infinite;
    text-shadow: 0 0 10px rgba(56, 229, 226, 0.5);
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.agent-model {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.agent-reasoning {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: "Courier New", Consolas, Monaco, monospace;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

.waiting {
    color: var(--color-text-placeholder);
    font-style: italic;
}

.cursor {
    color: var(--color-accent);
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

.closing-brace {
    font-size: 0.875rem;
    color: var(--color-text);
    margin-top: 0.75rem;
    flex-shrink: 0;
}
</style>
