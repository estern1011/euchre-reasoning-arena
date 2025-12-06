<template>
    <div :class="['status-banner', { 'is-streaming': isStreaming, 'is-game-over': isGameComplete }]">
        <div class="status-content">
            <span v-if="isStreaming" class="status-dot"></span>
            <span class="status-text">{{ statusText }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '~/stores/game';

const gameStore = useGameStore();

const statusText = computed(() => gameStore.statusText);
const isStreaming = computed(() => gameStore.isStreaming);
const isGameComplete = computed(() => gameStore.isGameComplete);
</script>

<style scoped>
.status-banner {
    display: inline-flex;
    align-items: flex-start;
    padding: 0.5rem 0.75rem;
    background: rgba(10, 20, 20, 0.9);
    border: 2px solid rgba(56, 189, 186, 0.3);
    border-radius: 6px;
    font-family: "Courier New", monospace;
    transition: all 0.3s ease;
    width: 100%;
    max-width: 100%;
    min-height: 60px;
    overflow: hidden;
    box-shadow: 0 0 15px rgba(56, 189, 186, 0.1);
}

.status-banner.is-streaming {
    border-color: rgba(56, 189, 186, 0.6);
    background: rgba(56, 189, 186, 0.08);
    box-shadow: 0 0 20px rgba(56, 189, 186, 0.2);
}

.status-banner.is-game-over {
    border-color: rgba(56, 189, 186, 0.8);
    background: rgba(56, 189, 186, 0.15);
    box-shadow:
        0 0 30px rgba(56, 189, 186, 0.4),
        0 0 60px rgba(56, 189, 186, 0.2),
        inset 0 0 20px rgba(56, 189, 186, 0.1);
    animation: game-over-glow 2s ease-in-out infinite;
}

@keyframes game-over-glow {
    0%, 100% {
        box-shadow:
            0 0 30px rgba(56, 189, 186, 0.4),
            0 0 60px rgba(56, 189, 186, 0.2),
            inset 0 0 20px rgba(56, 189, 186, 0.1);
        border-color: rgba(56, 189, 186, 0.8);
    }
    50% {
        box-shadow:
            0 0 40px rgba(56, 189, 186, 0.6),
            0 0 80px rgba(56, 189, 186, 0.3),
            inset 0 0 30px rgba(56, 189, 186, 0.15);
        border-color: rgba(56, 189, 186, 1);
    }
}

.status-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: #38bdb8;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(0.9);
    }
}

.status-text {
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    color: var(--color-text);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.status-banner.is-streaming .status-text {
    color: #38bdb8;
}

.status-banner.is-game-over .status-text {
    color: #fff;
    font-weight: 600;
    font-size: 1.0625rem;
    text-shadow: 0 0 10px rgba(56, 189, 186, 0.6);
}
</style>
