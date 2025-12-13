<template>
    <BaseModal :is-open="isOpen" title="currentPrompt" size="xl" @close="close">
        <template #title>
            <h3 id="prompt-modal-title"><span class="keyword">const</span> <span class="variable">currentPrompt</span> = {</h3>
        </template>

        <div class="modal-content">
                    <!-- Player Selector -->
                    <div class="player-selector">
                        <span class="selector-label"><span class="comment">// </span>select_player</span>
                        <div class="player-buttons">
                            <button
                                v-for="pos in positions"
                                :key="pos"
                                class="player-button"
                                :class="{ active: selectedPlayer === pos }"
                                @click="selectPlayer(pos)"
                            >
                                {{ pos.toUpperCase() }}
                            </button>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div v-if="isLoading" class="loading-state">
                        <span class="loading-text">Reconstructing prompt...</span>
                    </div>

                    <!-- Error State -->
                    <div v-else-if="error" class="error-state">
                        <span class="error-text">{{ error }}</span>
                    </div>

                    <!-- Prompt Display -->
                    <div v-else-if="promptData" class="prompt-display">
                        <!-- Phase/Decision Info -->
                        <div class="meta-info">
                            <span class="meta-item">
                                <span class="meta-label">phase:</span>
                                <span class="meta-value">{{ promptData.phase }}</span>
                            </span>
                            <span class="meta-item">
                                <span class="meta-label">decision:</span>
                                <span class="meta-value">{{ promptData.decisionType }}</span>
                            </span>
                        </div>

                        <!-- Prompt Sections -->
                        <div
                            v-for="(section, idx) in promptData.sections"
                            :key="idx"
                            class="prompt-section"
                        >
                            <button
                                class="section-header"
                                :class="{ expanded: expandedSections.has(idx) }"
                                @click="toggleSection(idx)"
                            >
                                <span class="section-label">
                                    <span class="comment">// </span>{{ formatLabel(section.label) }}
                                </span>
                                <span class="section-toggle">{{ expandedSections.has(idx) ? '−' : '+' }}</span>
                            </button>
                            <div v-if="expandedSections.has(idx)" class="section-content">
                                <pre class="prompt-text">{{ section.content }}</pre>
                                <button class="copy-button" @click="copyToClipboard(section.content)">
                                    {{ copiedSection === idx ? 'Copied!' : 'Copy' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- No Game State -->
                    <div v-else class="empty-state">
                        <span class="comment">// </span>No game in progress. Start a game to view prompts.
                    </div>
        </div>

        <template #footer>
            <div class="footer-content">
                <div class="footer-info">
                    <span class="comment">// </span>This is what would be sent to the AI model
                </div>
                <span class="closing-brace">};</span>
            </div>
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from '~/components/base/BaseModal.vue';
import { useGameStore } from '~/stores/game';
import type { Position } from '../../lib/game/types';

interface PromptSection {
    label: string;
    content: string;
}

interface PromptData {
    phase: string;
    decisionType: string;
    sections: PromptSection[];
}

interface Props {
    isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (e: 'close'): void;
}>();

const gameStore = useGameStore();

const positions: Position[] = ['north', 'east', 'south', 'west'];
const selectedPlayer = ref<Position>('north');
const isLoading = ref(false);
const error = ref<string | null>(null);
const promptData = ref<PromptData | null>(null);
const expandedSections = ref<Set<number>>(new Set([0, 1])); // Expand first two by default
const copiedSection = ref<number | null>(null);

const selectPlayer = async (player: Position) => {
    selectedPlayer.value = player;
    await fetchPrompt();
};

const fetchPrompt = async () => {
    if (!gameStore.gameState) {
        promptData.value = null;
        return;
    }

    isLoading.value = true;
    error.value = null;

    try {
        const response = await $fetch('/api/view-prompt', {
            method: 'POST',
            body: {
                gameState: gameStore.gameState,
                player: selectedPlayer.value,
                strategyHints: gameStore.strategyHints,
            },
        });

        if (response.success) {
            promptData.value = {
                phase: response.phase,
                decisionType: response.decisionType,
                sections: response.sections,
            };
            // Expand all sections by default
            expandedSections.value = new Set(response.sections.map((_, i) => i));
        } else {
            error.value = response.error || 'Failed to fetch prompt';
            promptData.value = null;
        }
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Failed to fetch prompt';
        promptData.value = null;
    } finally {
        isLoading.value = false;
    }
};

const toggleSection = (idx: number) => {
    if (expandedSections.value.has(idx)) {
        expandedSections.value.delete(idx);
    } else {
        expandedSections.value.add(idx);
    }
    expandedSections.value = new Set(expandedSections.value);
};

const formatLabel = (label: string): string => {
    return label.toLowerCase().replace(/\s+/g, '_');
};

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        const idx = promptData.value?.sections.findIndex(s => s.content === text) ?? -1;
        copiedSection.value = idx;
        setTimeout(() => {
            copiedSection.value = null;
        }, 2000);
    } catch (e) {
        console.error('Failed to copy:', e);
    }
};

const close = () => {
    emit('close');
};

// Fetch prompt when modal opens
watch(() => props.isOpen, async (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
        await fetchPrompt();
    }
});
</script>

<style scoped>
/* Title styling */
h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text);
}

.keyword { color: #c084fc; }
.variable { color: var(--color-accent); }
.comment { color: var(--color-text-muted); }

/* Player Selector */
.player-selector {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(56, 189, 186, 0.15);
}

.selector-label {
    display: block;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.5rem;
}

.player-buttons {
    display: flex;
    gap: 0.5rem;
}

.player-button {
    padding: 0.5rem 1rem;
    font-family: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    background: rgba(0, 0, 0, 0.3);
    color: var(--color-text-muted);
    border: 1px solid rgba(56, 189, 186, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.player-button:hover {
    background: rgba(56, 189, 186, 0.1);
    color: var(--color-text);
    border-color: rgba(56, 189, 186, 0.4);
}

.player-button.active {
    background: rgba(56, 189, 186, 0.15);
    color: #38bdb8;
    border-color: rgba(56, 189, 186, 0.5);
}

/* Meta Info */
.meta-info {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
}

.meta-item {
    font-size: 0.8125rem;
}

.meta-label {
    color: #c084fc;
}

.meta-value {
    color: #a3e635;
    margin-left: 0.25rem;
}

/* Prompt Sections */
.prompt-section {
    margin-bottom: 0.75rem;
    border: 1px solid rgba(56, 189, 186, 0.2);
    border-radius: 4px;
    overflow: hidden;
}

.section-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(56, 189, 186, 0.08);
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    font-family: inherit;
}

.section-header:hover {
    background: rgba(56, 189, 186, 0.12);
}

.section-header.expanded {
    border-bottom: 1px solid rgba(56, 189, 186, 0.2);
}

.section-label {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
}

.section-toggle {
    font-size: 1.25rem;
    color: #38bdb8;
    font-weight: 300;
}

.section-content {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    position: relative;
}

.prompt-text {
    margin: 0;
    font-family: "Courier New", Consolas, Monaco, monospace;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
}

.copy-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.35rem 0.75rem;
    font-family: inherit;
    font-size: 0.75rem;
    background: rgba(56, 189, 186, 0.1);
    color: #38bdb8;
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.copy-button:hover {
    background: rgba(56, 189, 186, 0.2);
    border-color: rgba(56, 189, 186, 0.5);
}

/* States */
.loading-state,
.error-state,
.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    color: var(--color-text-muted);
    font-size: 0.875rem;
}

.error-state {
    color: #f87171;
}

.loading-text {
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Footer */
.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.footer-info {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.closing-brace {
    font-size: 0.875rem;
    color: var(--color-text);
}
</style>
