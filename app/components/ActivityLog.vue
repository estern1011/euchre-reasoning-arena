<template>
    <div class="activity-log">
        <div class="log-header">
            <span class="keyword">const</span> activityLog = [
        </div>
        <div class="log-entries">
            <div
                v-for="(entry, index) in entries"
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
interface Props {
    entries: string[];
}

defineProps<Props>();
</script>

<style scoped>
.activity-log {
    border-bottom: 1px solid #333;
    padding: 1rem;
}

.log-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: var(--color-text);
}

.keyword {
    color: var(--color-keyword);
}

.log-entries {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.log-entry {
    color: #d1d5db;
}
</style>
