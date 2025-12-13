<template>
    <div class="panel-header">
        <span class="header-title">
            <span class="comment">// </span>{{ title }}
        </span>
        <div v-if="$slots.actions" class="header-actions">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    title: string;
}

defineProps<Props>();
</script>

<style scoped>
.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-title {
    display: flex;
    align-items: center;
}

.comment {
    color: var(--color-text-muted);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
