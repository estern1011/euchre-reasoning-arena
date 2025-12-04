<template>
    <button
        class="play-next-button"
        type="button"
        @click="$emit('play-next')"
        :disabled="disabled"
    >
        <span class="button-text">playNextRound()</span>
        <span class="button-arrow">→</span>
    </button>
</template>

<script setup lang="ts">
interface Props {
    disabled?: boolean;
}

defineProps<Props>();

defineEmits<{
    'play-next': [];
}>();
</script>

<style scoped>
.play-next-button {
    background: rgba(163, 230, 53, 0.1);
    border: 2px solid rgba(163, 230, 53, 0.3);
    color: var(--color-accent);
    padding: 0.5rem 1rem;
    border-radius: 2px;
    font-family: "Courier New", monospace;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
}

.play-next-button:hover:not(:disabled) {
    background: rgba(163, 230, 53, 0.15);
    border-color: rgba(163, 230, 53, 0.5);
    box-shadow: 0 0 20px rgba(163, 230, 53, 0.2);
}

.play-next-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.button-text {
    font-size: 0.875rem;
}

.button-arrow {
    font-size: 1.125rem;
    transition: transform 0.2s ease;
}

.play-next-button:hover:not(:disabled) .button-arrow {
    transform: translateX(4px);
}
</style>
