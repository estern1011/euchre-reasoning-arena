<template>
    <BaseModal :is-open="isOpen" title="reasoningHistory" size="xl" @close="close">
        <template #title>
            <h3 id="reasoning-modal-title"><span class="keyword">const</span> <span class="variable">reasoningHistory</span> = {</h3>
        </template>

        <div class="modal-content">
                    <!-- Organized by Hands -->
                    <div v-if="organizedHands.length > 0" class="hands-container">
                        <div
                            v-for="hand in organizedHands"
                            :key="hand.handNumber"
                            class="hand-section"
                        >
                            <!-- Hand Header (collapsible) -->
                            <button
                                class="hand-header"
                                :class="{ expanded: expandedHands.has(hand.handNumber) }"
                                @click="toggleHand(hand.handNumber)"
                            >
                                <div class="hand-info">
                                    <span class="hand-title">Hand #{{ hand.handNumber }}</span>
                                    <span v-if="hand.trumpSuit" class="trump-indicator" :class="getSuitClass(hand.trumpSuit)">
                                        Trump: {{ formatSuitSymbol(hand.trumpSuit) }}
                                    </span>
                                    <span v-if="hand.tricks.length > 0" class="tricks-count">
                                        {{ hand.tricks.length }}/5 tricks
                                    </span>
                                    <span v-if="hand.winningTeam" class="winner-team-badge">
                                        {{ hand.winningTeam }} won
                                    </span>
                                </div>
                                <span class="expand-icon">{{ expandedHands.has(hand.handNumber) ? '−' : '+' }}</span>
                            </button>

                            <!-- Hand Content -->
                            <div v-if="expandedHands.has(hand.handNumber)" class="hand-content">
                                <!-- Trump Selection Round 1 -->
                                <div v-if="hand.trumpRound1.length > 0" class="phase-section">
                                    <button
                                        class="phase-header-btn"
                                        :class="{ expanded: expandedPhases.has(`${hand.handNumber}-trump1`) }"
                                        @click="togglePhase(hand.handNumber, 'trump1')"
                                    >
                                        <span><span class="comment">// </span>trump_selection_round_1</span>
                                        <span class="expand-icon-sm">{{ expandedPhases.has(`${hand.handNumber}-trump1`) ? '−' : '+' }}</span>
                                    </button>
                                    <div v-if="expandedPhases.has(`${hand.handNumber}-trump1`)" class="phase-content">
                                        <div class="decisions-grid">
                                            <div
                                                v-for="(decision, idx) in hand.trumpRound1"
                                                :key="`trump1-${idx}`"
                                                class="decision-card"
                                            >
                                                <div class="decision-header">
                                                    <span class="player-name">{{ decision.player.toUpperCase() }}</span>
                                                    <span class="decision-time">{{ (decision.duration / 1000).toFixed(2) }}s</span>
                                                </div>
                                                <div class="decision-meta">
                                                    <div class="model-id">{{ formatModelId(decision.modelId) }}</div>
                                                    <div class="action">
                                                        {{ formatTrumpAction(decision) }}
                                                    </div>
                                                </div>
                                                <div v-if="decision.toolUsed" class="tool-usage">
                                                    <span class="tool-label">🔧 {{ decision.toolUsed.tool }}</span>
                                                    <span class="tool-cost">-{{ decision.toolUsed.cost }} pts</span>
                                                </div>
                                                <div v-if="decision.reasoning" class="reasoning-text">
                                                    {{ decision.reasoning }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Trump Selection Round 2 -->
                                <div v-if="hand.trumpRound2.length > 0" class="phase-section">
                                    <button
                                        class="phase-header-btn"
                                        :class="{ expanded: expandedPhases.has(`${hand.handNumber}-trump2`) }"
                                        @click="togglePhase(hand.handNumber, 'trump2')"
                                    >
                                        <span><span class="comment">// </span>trump_selection_round_2</span>
                                        <span class="expand-icon-sm">{{ expandedPhases.has(`${hand.handNumber}-trump2`) ? '−' : '+' }}</span>
                                    </button>
                                    <div v-if="expandedPhases.has(`${hand.handNumber}-trump2`)" class="phase-content">
                                        <div class="decisions-grid">
                                            <div
                                                v-for="(decision, idx) in hand.trumpRound2"
                                                :key="`trump2-${idx}`"
                                                class="decision-card"
                                            >
                                                <div class="decision-header">
                                                    <span class="player-name">{{ decision.player.toUpperCase() }}</span>
                                                    <span class="decision-time">{{ (decision.duration / 1000).toFixed(2) }}s</span>
                                                </div>
                                                <div class="decision-meta">
                                                    <div class="model-id">{{ formatModelId(decision.modelId) }}</div>
                                                    <div class="action">
                                                        {{ formatTrumpAction(decision) }}
                                                    </div>
                                                </div>
                                                <div v-if="decision.toolUsed" class="tool-usage">
                                                    <span class="tool-label">🔧 {{ decision.toolUsed.tool }}</span>
                                                    <span class="tool-cost">-{{ decision.toolUsed.cost }} pts</span>
                                                </div>
                                                <div v-if="decision.reasoning" class="reasoning-text">
                                                    {{ decision.reasoning }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Tricks -->
                                <div v-if="hand.tricks.length > 0" class="tricks-section">
                                    <div
                                        v-for="trick in hand.tricks"
                                        :key="`trick-${trick.trickNumber}`"
                                        class="trick-section"
                                    >
                                        <!-- Trick Header (collapsible) -->
                                        <button
                                            class="trick-header"
                                            :class="{ expanded: expandedTricks.has(`${hand.handNumber}-${trick.trickNumber}`) }"
                                            @click="toggleTrick(hand.handNumber, trick.trickNumber)"
                                        >
                                            <div class="trick-info">
                                                <span class="trick-title">Trick {{ trick.trickNumber }}</span>
                                                <!-- Cards in play order -->
                                                <div class="cards-preview">
                                                    <div
                                                        v-for="(play, idx) in trick.plays"
                                                        :key="idx"
                                                        class="card-preview-item"
                                                        :class="{ winner: trick.winner === play.player }"
                                                    >
                                                        <Card
                                                            v-if="play.card"
                                                            :suit="play.card.suit"
                                                            :rank="play.card.rank"
                                                            size="xs"
                                                        />
                                                        <span class="card-player">{{ play.player.charAt(0).toUpperCase() }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span class="expand-icon">{{ expandedTricks.has(`${hand.handNumber}-${trick.trickNumber}`) ? '−' : '+' }}</span>
                                        </button>

                                        <!-- Trick Content -->
                                        <div v-if="expandedTricks.has(`${hand.handNumber}-${trick.trickNumber}`)" class="trick-content">
                                            <div class="decisions-grid">
                                                <div
                                                    v-for="(play, idx) in trick.plays"
                                                    :key="`play-${idx}`"
                                                    class="decision-card"
                                                    :class="{ 'winner-card': trick.winner === play.player }"
                                                >
                                                    <div class="decision-header">
                                                        <span class="player-name">
                                                            {{ play.player.toUpperCase() }}
                                                            <span v-if="trick.winner === play.player" class="winner-star">★</span>
                                                        </span>
                                                        <span class="decision-time">{{ (play.duration / 1000).toFixed(2) }}s</span>
                                                    </div>
                                                    <div class="decision-meta">
                                                        <div class="model-id">{{ formatModelId(play.modelId) }}</div>
                                                        <div class="action card-action">
                                                            <Card
                                                                :suit="play.card.suit"
                                                                :rank="play.card.rank"
                                                                size="sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div v-if="play.toolUsed" class="tool-usage">
                                                        <span class="tool-label">🔧 {{ play.toolUsed.tool }}</span>
                                                        <span class="tool-cost">-{{ play.toolUsed.cost }} pts</span>
                                                    </div>
                                                    <div v-if="play.reasoning" class="reasoning-text">
                                                        {{ play.reasoning }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="empty-state">
                        <span class="comment">// </span>No reasoning history yet. Play a round to see AI decisions.
                    </div>
        </div>

        <template #footer>
            <div class="footer-content">
                <div class="stats">
                    {{ gameStore.totalDecisions }} decision{{ gameStore.totalDecisions !== 1 ? 's' : '' }} recorded
                </div>
                <span class="closing-brace">};</span>
            </div>
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseModal from '~/components/base/BaseModal.vue';
import Card from '~/components/Card.vue';
import { useGameStore, type TrumpDecisionRecord, type TrickRecord } from '~/stores/game';
import type { Suit, Card as CardType, Position } from '../../lib/game/types';

interface Props {
    isOpen: boolean;
}

const props = defineProps<Props>()
const emit = defineEmits<{
    (e: 'close'): void
}>()

const gameStore = useGameStore();

const expandedHands = ref<Set<number>>(new Set());
const expandedTricks = ref<Set<string>>(new Set());
const expandedPhases = ref<Set<string>>(new Set());

// Transform store hands to the format expected by the template
interface OrganizedHand {
    handNumber: number;
    trumpRound1: TrumpDecisionRecord[];
    trumpRound2: TrumpDecisionRecord[];
    tricks: TrickRecord[];
    trumpSuit: Suit | null;
    winningTeam: 'NS' | 'EW' | null;
}

// Use the store's game history directly
const organizedHands = computed<OrganizedHand[]>(() => {
    return gameStore.gameHistory.hands.map(hand => {
        // Split trump decisions into round 1 and round 2
        const trumpRound1: TrumpDecisionRecord[] = [];
        const trumpRound2: TrumpDecisionRecord[] = [];
        let inRound2 = false;
        
        for (const decision of hand.trumpDecisions) {
            if (inRound2) {
                trumpRound2.push(decision);
            } else {
                trumpRound1.push(decision);
                // After 4 passes, move to round 2
                if (trumpRound1.length === 4 && trumpRound1.every(d => d.action === 'pass')) {
                    inRound2 = true;
                }
            }
        }
        
        return {
            handNumber: hand.handNumber,
            trumpRound1,
            trumpRound2,
            tricks: hand.tricks,
            trumpSuit: hand.trumpSuit,
            winningTeam: hand.winningTeam,
        };
    });
});

const toggleHand = (handNumber: number) => {
    if (expandedHands.value.has(handNumber)) {
        expandedHands.value.delete(handNumber);
    } else {
        expandedHands.value.add(handNumber);
    }
    expandedHands.value = new Set(expandedHands.value);
};

const toggleTrick = (handNumber: number, trickNumber: number) => {
    const key = `${handNumber}-${trickNumber}`;
    if (expandedTricks.value.has(key)) {
        expandedTricks.value.delete(key);
    } else {
        expandedTricks.value.add(key);
    }
    expandedTricks.value = new Set(expandedTricks.value);
};

const togglePhase = (handNumber: number, phase: string) => {
    const key = `${handNumber}-${phase}`;
    if (expandedPhases.value.has(key)) {
        expandedPhases.value.delete(key);
    } else {
        expandedPhases.value.add(key);
    }
    expandedPhases.value = new Set(expandedPhases.value);
};

const formatModelId = (modelId: string): string => {
    const parts = modelId.split('/');
    return parts[parts.length - 1] || modelId;
};

const formatTrumpAction = (decision: TrumpDecisionRecord): string => {
    if (decision.action === 'order_up') {
        return decision.goingAlone ? 'ORDER UP (ALONE)' : 'ORDER UP';
    }
    if (decision.action === 'call_trump' && decision.suit) {
        const suitSymbol = formatSuitSymbol(decision.suit);
        return decision.goingAlone ? `CALL ${suitSymbol} (ALONE)` : `CALL ${suitSymbol}`;
    }
    return decision.action.toUpperCase();
};

const formatSuitSymbol = (suit?: Suit): string => {
    if (!suit) return '';
    const symbols: Record<Suit, string> = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
    };
    return symbols[suit];
};

const getSuitClass = (suit?: Suit): string => {
    if (!suit) return '';
    return suit === 'hearts' || suit === 'diamonds' ? 'red-suit' : 'black-suit';
};

const close = () => {
    emit('close')
};

// Expand current hand when modal opens
watch(() => props.isOpen, (isOpen, wasOpen) => {
    if (isOpen && !wasOpen) {
        if (gameStore.gameHistory.hands.length > 0) {
            const currentHand = gameStore.gameHistory.hands[gameStore.gameHistory.currentHandIndex];
            expandedHands.value = new Set([currentHand?.handNumber || 1]);
        } else {
            expandedHands.value = new Set();
        }
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

.hands-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.hand-section {
    border: 1px solid rgba(56, 189, 186, 0.25);
    border-radius: 6px;
    overflow: hidden;
}

.hand-header {
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

.hand-header:hover {
    background: rgba(56, 189, 186, 0.12);
}

.hand-header.expanded {
    border-bottom: 1px solid rgba(56, 189, 186, 0.2);
}

.hand-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.hand-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #38bdb8;
}

.trump-indicator {
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
}

.tricks-count {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.winner-team-badge {
    font-size: 0.6875rem;
    padding: 0.15rem 0.5rem;
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 3px;
    font-weight: 600;
}

.expand-icon {
    font-size: 1.25rem;
    color: #38bdb8;
    font-weight: 300;
}

.expand-icon-sm {
    font-size: 1rem;
    color: var(--color-text-muted);
    font-weight: 300;
}

.hand-content {
    padding: 0.75rem;
}

.phase-section {
    margin-bottom: 0.5rem;
}

.phase-section:last-child {
    margin-bottom: 0;
}

.phase-header-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: rgba(192, 132, 252, 0.08);
    border: 1px solid rgba(192, 132, 252, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    font-family: inherit;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
}

.phase-header-btn:hover {
    background: rgba(192, 132, 252, 0.12);
}

.phase-header-btn.expanded {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.phase-content {
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(192, 132, 252, 0.2);
    border-top: none;
    border-radius: 0 0 4px 4px;
}

.decisions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.decision-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(56, 189, 186, 0.15);
    border-radius: 4px;
    padding: 0.75rem;
    transition: all 0.15s ease;
}

.decision-card:hover {
    border-color: rgba(56, 189, 186, 0.3);
    background: rgba(56, 189, 186, 0.03);
}

.decision-card.winner-card {
    border-color: rgba(251, 191, 36, 0.5);
    background: rgba(251, 191, 36, 0.08);
}

.decision-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.player-name {
    font-weight: 600;
    font-size: 0.875rem;
    letter-spacing: 1px;
    color: #38bdb8;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.winner-star {
    color: #fbbf24;
    font-size: 0.875rem;
}

.decision-time {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.decision-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
    font-size: 0.8125rem;
}

.model-id {
    color: var(--color-text-muted);
    font-size: 0.75rem;
}

.action {
    color: #e5e7eb;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.card-action {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tool-usage {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(163, 230, 53, 0.1);
    border: 1px solid rgba(163, 230, 53, 0.3);
    border-radius: 3px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
}

.tool-label {
    color: #a3e635;
}

.tool-cost {
    color: #f87171;
    font-weight: 500;
}

.red-suit { color: #f87171; }
.black-suit { color: #38bdb8; }

.fallback-badge {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    font-size: 0.75rem;
    padding: 1px 4px;
    border-radius: 2px;
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.illegal-attempt-notice {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 3px;
    padding: 0.35rem 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.75rem;
    color: #fbbf24;
}

.reasoning-text {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--color-text);
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 120px;
    overflow-y: auto;
}

/* Tricks section */
.tricks-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.trick-section {
    border: 1px solid rgba(56, 189, 186, 0.15);
    border-radius: 4px;
    overflow: hidden;
}

.trick-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    font-family: inherit;
}

.trick-header:hover {
    background: rgba(56, 189, 186, 0.05);
}

.trick-header.expanded {
    border-bottom: 1px solid rgba(56, 189, 186, 0.15);
}

.trick-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.trick-title {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text);
}

.cards-preview {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
}

.card-preview-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.2rem;
    border-radius: 4px;
    border: 1px solid transparent;
}

.card-preview-item.winner {
    position: relative;
    border-color: rgba(251, 191, 36, 0.6);
    background: rgba(251, 191, 36, 0.1);
    box-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
}

.card-preview-item.winner::after {
    content: '★';
    position: absolute;
    top: -10px;
    right: -6px;
    font-size: 0.75rem;
    color: #fbbf24;
}

.card-player {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-weight: 500;
}

.trick-content {
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.15);
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: var(--color-text-muted);
    font-size: 0.875rem;
}

/* Footer */
.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.stats {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.closing-brace {
    font-size: 0.875rem;
    color: var(--color-text);
}
</style>
