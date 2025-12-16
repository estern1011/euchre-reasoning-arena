<template>
    <BaseModal
        :is-open="isOpen"
        title="lifeline_tools"
        size="lg"
        @close="$emit('close')"
    >
        <div class="tool-info-content">
            <!-- Overview -->
            <div class="info-section">
                <div class="section-title">overview</div>
                <p class="description">
                    AI agents can optionally use "lifelines" at point costs during gameplay.
                    This evaluates AI calibration: do models know what they don't know?
                </p>
                <p class="hint">// agents report confidence (0-100) with each decision</p>
                <p class="hint">// score = confidence x correctness - tool_costs</p>
            </div>

            <!-- Ask Audience -->
            <div class="info-section">
                <div class="tool-header">
                    <span class="tool-icon">👥</span>
                    <span class="tool-name">ask_audience</span>
                    <span class="tool-cost">-2 pts</span>
                </div>
                <p class="description">
                    Polls other AI models for their recommendations on the current decision.
                    Returns collective wisdom from multiple model perspectives.
                </p>
                <div class="use-case">
                    <span class="use-label">best_for:</span>
                    <span class="use-text">Uncertain situations where diverse opinions help</span>
                </div>
            </div>

            <!-- Ask Partner -->
            <div class="info-section">
                <div class="tool-header">
                    <span class="tool-icon">🤝</span>
                    <span class="tool-name">ask_partner</span>
                    <span class="tool-cost">-2 pts</span>
                </div>
                <p class="description">
                    Asks your teammate for advice about the current game situation.
                    Partner provides strategic guidance based on their perspective.
                </p>
                <div class="use-case">
                    <span class="use-label">best_for:</span>
                    <span class="use-text">Team coordination and shared strategy</span>
                </div>
            </div>

            <!-- 50/50 -->
            <div class="info-section">
                <div class="tool-header">
                    <span class="tool-icon">🎯</span>
                    <span class="tool-name">fifty_fifty</span>
                    <span class="tool-cost">-3 pts</span>
                </div>
                <p class="description">
                    Eliminates half of the incorrect options from consideration.
                    Narrows down choices when the agent is unsure.
                </p>
                <div class="use-case">
                    <span class="use-label">best_for:</span>
                    <span class="use-text">Tough decisions with many viable options</span>
                </div>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from "~/components/base/BaseModal.vue";

interface Props {
    isOpen: boolean;
}

defineProps<Props>();

defineEmits<{
    (e: "close"): void;
}>();
</script>

<style scoped>
.tool-info-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.info-section {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem 1.25rem;
}

.section-title {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #38bdb8;
    margin-bottom: 0.75rem;
    font-weight: 600;
}

.tool-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.tool-icon {
    font-size: 1.25rem;
}

.tool-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    font-family: "Courier New", monospace;
}

.tool-cost {
    margin-left: auto;
    font-size: 0.875rem;
    font-weight: 600;
    color: #f59e0b;
    font-family: "Courier New", monospace;
}

.description {
    font-size: 0.9375rem;
    line-height: 1.5;
    color: var(--color-text-secondary);
    margin: 0;
}

.hint {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    font-family: "Courier New", monospace;
    margin: 0.375rem 0 0 0;
}

.use-case {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.use-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    font-family: "Courier New", monospace;
}

.use-text {
    font-size: 0.875rem;
    color: #a3e635;
    font-style: italic;
}
</style>
