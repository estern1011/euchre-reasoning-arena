<template>
    <div :class="['status-banner', { 'is-streaming': isStreaming }]">
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
</script>

<style scoped>
.status-banner {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.25rem;
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid rgba(107, 114, 128, 0.3);
    border-radius: 0;
    font-family: "Courier New", monospace;
    transition: all 0.2s ease;
}

.status-banner.is-streaming {
    border-color: rgba(163, 230, 53, 0.6);
    background: rgba(163, 230, 53, 0.08);
    box-shadow: 0 0 20px rgba(163, 230, 53, 0.2);
}

.status-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: var(--color-accent);
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
    font-size: 0.9375rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    color: var(--color-text);
}

.status-banner.is-streaming .status-text {
    color: var(--color-accent);
}
</style>
