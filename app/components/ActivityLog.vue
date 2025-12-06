<template>
    <div class="activity-log" role="log" aria-label="Game activity log">
        <div class="log-header" aria-hidden="true">
            <span class="keyword">const</span> <span class="variable">activityLog</span> = [
        </div>
        <div class="log-entries" aria-live="polite" aria-atomic="false">
            <div
                v-for="(entry, index) in reversedEntries"
                :key="index"
                :class="['log-entry', getEntryClass(entry)]"
            >
                {{ entry }}
            </div>
            <div v-if="entries.length === 0" class="log-entry waiting">
                // awaiting game start...
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

// Determine entry class based on content
const getEntryClass = (entry: string): string => {
    if (entry.includes('ERROR') || entry.includes('ILLEGAL')) return 'error';
    if (entry.includes('PASS')) return 'action-pass';
    if (entry.includes('PLAY:') || entry.includes('BID:') || entry.includes('ORDER_UP') || entry.includes('CALL:')) return 'action-play';
    if (entry.includes('TRICK') || entry.includes('HAND') || entry.includes('GAME')) return 'event';
    return '';
};
</script>

<style scoped>
.activity-log {
    border-bottom: 1px solid rgba(56, 189, 186, 0.2);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.log-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-text);
    flex-shrink: 0;
}

.keyword {
    color: #c084fc;
}

.variable {
    color: #38bdb8;
}

.log-entries {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.8125rem;
    overflow-y: auto;
    padding-right: 0.5rem;
    flex: 1;
    font-family: "Courier New", monospace;
}

.log-entry {
    color: #9ca3af;
    padding: 0.15rem 0;
    line-height: 1.4;
}

.log-entry.error {
    color: #f87171;
}

.log-entry.action-pass {
    color: #38bdb8;
}

.log-entry.action-play {
    color: #38bdb8;
}

.log-entry.event {
    color: #fbbf24;
}

.log-entry.waiting {
    color: var(--color-text-muted);
    font-style: italic;
}
</style>
