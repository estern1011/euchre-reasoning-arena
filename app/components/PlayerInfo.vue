<template>
    <div class="player-info" :class="{ 'is-horizontal': isHorizontalPosition }">
        <div class="name-row">
            <div class="player-name">{{ position.toUpperCase() }}</div>
            <div v-if="isDealer" class="dealer-badge">D</div>
        </div>
        <div class="model-name">{{ modelName }}</div>
        <div class="status-row">
            <div class="status" :class="{ 'thinking': isThinking }">
                <span v-if="isThinking" class="thinking-indicator">
                    <span class="thinking-dot"></span>
                    THINKING
                </span>
                <span v-else>WAITING</span>
            </div>
            <div v-if="isGoingAlone" class="alone-badge">ALONE</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Position } from "~/types/game";

interface Props {
    position: Position;
    modelName: string;
    isThinking: boolean;
    isGoingAlone?: boolean;
    isDealer?: boolean;
}

const props = defineProps<Props>();

const isHorizontalPosition = computed(() => props.position === 'north' || props.position === 'south');
</script>

<style scoped>
.player-info {
    text-align: center;
    font-size: clamp(0.6rem, 1.2vh, 0.75rem);
    min-width: 0;
}

.name-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    margin-bottom: clamp(0.1rem, 0.3vh, 0.25rem);
}

.player-name {
    font-weight: bold;
    letter-spacing: 1px;
    font-size: clamp(0.55rem, 1.1vh, 0.7rem);
}

.dealer-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    font-size: 0.6rem;
    font-weight: bold;
    color: #000;
    background: var(--color-accent);
    border-radius: 50%;
}

.model-name {
    color: var(--color-text-secondary);
    margin-bottom: clamp(0.1rem, 0.3vh, 0.25rem);
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    max-width: 100%;
    min-width: 0;
    font-size: clamp(0.5rem, 1vh, 0.65rem);
    line-height: 1.2;
}

.status-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
}

.is-horizontal .status-row {
    flex-direction: row;
    justify-content: center;
    gap: 0.5rem;
}

.status {
    color: var(--color-text-muted);
    font-size: clamp(0.5rem, 0.9vh, 0.6rem);
}

.status.thinking {
    color: var(--color-accent);
}

.alone-badge {
    color: var(--color-error);
    font-weight: bold;
    font-size: clamp(0.5rem, 0.9vh, 0.6rem);
    letter-spacing: 0.5px;
}

.thinking-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.thinking-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: var(--color-accent);
    border-radius: 50%;
    animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
    0%, 100% {
        opacity: 1;
        box-shadow: 0 0 4px var(--color-accent);
    }
    50% {
        opacity: 0.4;
        box-shadow: 0 0 8px var(--color-accent);
    }
}
</style>
