<template>
    <div v-if="player && reasoning" class="streaming-reasoning">
        <div class="streaming-header">
            <span class="keyword">const</span> liveThinking = {
        </div>
        <div class="streaming-content">
            <div class="streaming-box">
                <div class="streaming-player">
                    <span class="player-label">{{ player.toUpperCase() }}</span>
                    <span class="streaming-indicator">● LIVE</span>
                </div>
                <div class="streaming-text">
                    {{ reasoning }}<span class="cursor">▋</span>
                </div>
            </div>
        </div>
        <div class="closing-brace">}</div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    player: string | null;
    reasoning: string;
}

defineProps<Props>();
</script>

<style scoped>
.streaming-reasoning {
    padding: 1rem;
    border-bottom: 1px solid #374151;
}

.streaming-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #e5e7eb;
}

.keyword {
    color: #c084fc;
}

.streaming-content {
    margin-bottom: 0.5rem;
}

.streaming-box {
    border: 2px solid rgba(163, 230, 53, 0.5);
    border-radius: 4px;
    padding: 1rem;
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
    color: #a3e635;
    font-size: 0.875rem;
}

.streaming-indicator {
    color: #a3e635;
    font-size: 0.75rem;
    font-weight: 600;
    animation: pulse 2s ease-in-out infinite;
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
    color: #e5e7eb;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: "Courier New", Consolas, Monaco, monospace;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.cursor {
    color: #a3e635;
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
    color: #e5e7eb;
    padding: 0;
}
</style>
