<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            class="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reasoning-modal-title"
            @click="close"
            @keydown.escape="close"
        >
            <div ref="modalRef" class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3 id="reasoning-modal-title"><span class="keyword">const</span> reasoningHistory = {</h3>
                    <button ref="closeButtonRef" class="close-button" @click="close" aria-label="Close modal">✕</button>
                </div>

                <div class="modal-body">
                    <div
                        v-for="(decision, index) in reversedDecisions"
                        :key="index"
                        class="decision-card"
                    >
                        <div class="decision-header">
                            <span class="player-name">{{ decision.player.toUpperCase() }}</span>
                            <span class="decision-time">{{ (decision.duration / 1000).toFixed(2) }}s</span>
                        </div>
                        <div class="decision-meta">
                            <div class="model-id">{{ decision.modelId }}</div>
                            <div class="action">
                                <template v-if="'card' in decision && decision.card">
                                    PLAYED {{ decision.card.rank }}{{ formatSuit(decision.card.suit) }}
                                    <span v-if="decision.isFallback" class="fallback-badge">FALLBACK</span>
                                </template>
                                <template v-else-if="'action' in decision && decision.action">
                                    {{ decision.action.toUpperCase() }}
                                </template>
                            </div>
                        </div>
                        <div v-if="decision.illegalAttempt" class="illegal-attempt-notice">
                            ⚠️ Illegal attempt: {{ decision.illegalAttempt.card.rank }}{{ formatSuit(decision.illegalAttempt.card.suit) }}
                            <template v-if="decision.isFallback"> (retry also failed)</template>
                        </div>
                        <div class="reasoning-text">
                            {{ decision.reasoning }}
                        </div>
                    </div>

                    <div v-if="decisions.length === 0" class="empty-state">
                        No reasoning history yet. Play a round to see AI decisions.
                    </div>
                </div>

                <div class="modal-footer">
                    <span class="closing-brace">}</span>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { formatSuit } from '../../lib/game/formatting';
import type { SSEDecisionMade } from '../../lib/types/sse';

interface DecisionRecord extends SSEDecisionMade {
    timestamp?: number;
}

interface Props {
    isOpen: boolean
    decisions: DecisionRecord[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
    (e: 'close'): void
}>()

const modalRef = ref<HTMLElement | null>(null);
const closeButtonRef = ref<HTMLButtonElement | null>(null);
let previouslyFocusedElement: HTMLElement | null = null;

// Show newest decisions at top
const reversedDecisions = computed(() => [...props.decisions].reverse());

const close = () => {
    emit('close')
}

// Focus trap - keep focus within modal
function handleFocusTrap(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !modalRef.value) return;

    const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
    }
}

// Focus management when modal opens/closes
watch(() => props.isOpen, async (isOpen) => {
    if (isOpen) {
        previouslyFocusedElement = document.activeElement as HTMLElement;
        document.addEventListener('keydown', handleFocusTrap);
        await nextTick();
        closeButtonRef.value?.focus();
    } else {
        document.removeEventListener('keydown', handleFocusTrap);
        previouslyFocusedElement?.focus();
    }
});

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleFocusTrap);
});
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.modal-content {
    background: rgba(10, 10, 10, 0.95);
    border: 3px solid rgba(163, 230, 53, 0.3);
    border-radius: 0px;
    box-shadow:
        8px 8px 0px rgba(163, 230, 53, 0.2),
        0 0 40px rgba(0, 0, 0, 0.8);
    max-width: 800px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    font-family: "Courier New", Consolas, Monaco, monospace;
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        transform: translateY(30px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--color-text);
}

.keyword {
    color: var(--color-keyword);
}

.close-button {
    background: rgba(163, 230, 53, 0.08);
    border: 2px solid rgba(163, 230, 53, 0.3);
    color: var(--color-accent);
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    border-radius: 0px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 4px 4px 0px rgba(163, 230, 53, 0.2);
}

.close-button:hover {
    background: rgba(163, 230, 53, 0.15);
    border-color: rgba(163, 230, 53, 0.5);
    box-shadow: 6px 6px 0px rgba(163, 230, 53, 0.3);
    transform: translate(-2px, -2px);
}

.close-button:active {
    box-shadow: 2px 2px 0px rgba(163, 230, 53, 0.2);
    transform: translate(2px, 2px);
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.decision-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(163, 230, 53, 0.2);
    border-radius: 4px;
    padding: 1rem;
    transition: all 0.2s ease;
}

.decision-card:hover {
    border-color: rgba(163, 230, 53, 0.4);
    background: rgba(163, 230, 53, 0.05);
}

.decision-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.player-name {
    font-weight: bold;
    font-size: 1rem;
    letter-spacing: 1px;
    color: var(--color-accent);
}

.decision-time {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
}

.decision-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
}

.model-id {
    color: var(--color-text-muted);
}

.action {
    color: #d1d5db;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.fallback-badge {
    background: rgba(239, 68, 68, 0.2);
    color: var(--color-error);
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 2px;
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.illegal-attempt-notice {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 4px;
    padding: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    color: #fbbf24;
}

.reasoning-text {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: var(--color-text-muted);
    font-size: 0.9375rem;
    text-align: center;
}

.modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.closing-brace {
    font-size: 0.875rem;
    color: var(--color-text);
}
</style>
