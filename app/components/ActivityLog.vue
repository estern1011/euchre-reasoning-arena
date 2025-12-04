<template>
    <div class="activity-log" role="log" aria-label="Game activity log">
        <div class="log-header" aria-hidden="true">
            <span class="keyword">const</span> activityLog = [
        </div>
        <div class="log-entries" aria-live="polite" aria-atomic="false">
            <div
                v-for="(entry, index) in reversedEntries"
                :key="index"
                class="log-entry"
            >
                {{ entry }}
            </div>
            <div v-if="entries.length === 0" class="log-entry">
                Waiting for game to start...
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    entries: string[];
}

const props = defineProps<Props>();

// Show newest entries at top
const reversedEntries = computed(() => [...props.entries].reverse());
</script>

<style scoped>
.activity-log {
    border-bottom: 1px solid #333;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.log-header {
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

.log-entries {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
    overflow-y: auto;
    padding-right: 0.5rem;
    flex: 1;
}

.log-entry {
    color: #d1d5db;
}
</style>
