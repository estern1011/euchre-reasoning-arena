<template>
    <div class="streaming-reasoning" role="region" aria-label="AI live reasoning">
        <div class="streaming-header" aria-hidden="true">
            <span class="keyword">const</span> liveThinking = {
        </div>
        <div class="streaming-content">
            <div :class="['streaming-box', { 'is-active': player && reasoning }]">
                <div v-if="player && reasoning" class="streaming-player">
                    <span class="player-label">{{ player.toUpperCase() }}</span>
                    <span class="streaming-indicator" aria-hidden="true">● LIVE</span>
                    <span class="sr-only">Currently thinking</span>
                </div>
                <div v-else class="streaming-player">
                    <span class="player-label idle">WAITING</span>
                    <span class="status-indicator idle" aria-hidden="true">○ IDLE</span>
                </div>
                <div
                    ref="streamingTextRef"
                    class="streaming-text"
                    aria-live="polite"
                    aria-atomic="false"
                    :aria-busy="!!player && !!reasoning"
                >
                    <template v-if="player && reasoning">
                        {{ reasoning }}<span class="cursor" aria-hidden="true">▋</span>
                    </template>
                    <template v-else>
                        <span class="placeholder-text">// awaiting next action...</span>
                    </template>
                </div>
            </div>
        </div>
        <div class="closing-brace" aria-hidden="true">}</div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { Position } from "~/types/game";

interface Props {
    player: Position | null;
    reasoning: string;
}

const props = defineProps<Props>();

const streamingTextRef = ref<HTMLElement | null>(null);

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
    border-bottom: 1px solid var(--color-border);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.streaming-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: var(--color-text);
}

.keyword {
    color: var(--color-keyword);
}

.streaming-content {
    margin-bottom: 0.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.streaming-box {
    border: 2px solid rgba(107, 114, 128, 0.3);
    border-radius: 4px;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 200px;
}

.streaming-box.is-active {
    border-color: rgba(163, 230, 53, 0.5);
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
    color: var(--color-accent);
    font-size: 0.875rem;
}

.player-label.idle {
    color: var(--color-text-muted);
}

.streaming-indicator,
.status-indicator {
    font-size: 0.75rem;
    font-weight: 600;
}

.streaming-indicator {
    color: var(--color-accent);
    animation: pulse 2s ease-in-out infinite;
}

.status-indicator.idle {
    color: var(--color-text-muted);
}

.placeholder-text {
    color: var(--color-text-placeholder);
    font-style: italic;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.streaming-text {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: "Courier New", Consolas, Monaco, monospace;
    flex: 1;
    overflow-y: auto;
    padding-right: 0.5rem;
    min-height: 0;
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
    padding: 0;
}
</style>
