<template>
    <div class="player-info">
        <div class="player-name">{{ position.toUpperCase() }}</div>
        <div class="model-name">{{ modelName }}</div>
        <div class="status" :class="{ 'thinking': isThinking }">
            <span v-if="isThinking" class="thinking-indicator">
                <span class="thinking-dot"></span>
                THINKING
            </span>
            <span v-else>WAITING</span>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    position: string;
    modelName: string;
    isThinking: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.player-info {
    text-align: center;
    font-size: clamp(0.6rem, 1.2vh, 0.75rem);
    min-width: 0;
}

.player-name {
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: clamp(0.1rem, 0.3vh, 0.25rem);
    font-size: clamp(0.55rem, 1.1vh, 0.7rem);
}

.model-name {
    color: #9ca3af;
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

.status {
    color: #6b7280;
    font-size: clamp(0.5rem, 0.9vh, 0.6rem);
}

.status.thinking {
    color: #a3e635;
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
    background: #a3e635;
    border-radius: 50%;
    animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
    0%, 100% {
        opacity: 1;
        box-shadow: 0 0 4px #a3e635;
    }
    50% {
        opacity: 0.4;
        box-shadow: 0 0 8px #a3e635;
    }
}
</style>
