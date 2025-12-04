<template>
    <div class="compact-arena">
        <div class="arena-header">
            <span class="keyword">const</span> gameState = {
        </div>

        <!-- Current Trick -->
        <div class="state-section">
            <div class="section-label">// current_trick</div>
            <div class="trick-display">
                <div
                    v-for="position in positions"
                    :key="position"
                    class="trick-card"
                >
                    <span class="position-abbr">{{ position[0].toUpperCase() }}:</span>
                    <span v-if="playedCards[position]" :class="['card-text', getSuitClass(playedCards[position]!.suit)]">
                        {{ formatCard(playedCards[position]!) }}
                    </span>
                    <span v-else class="empty-card">--</span>
                </div>
            </div>
        </div>

        <!-- Game Info -->
        <div class="state-section">
            <div class="info-row">
                <span class="info-label">turn:</span>
                <span class="info-value highlight">{{ currentPlayer?.toUpperCase() || 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">trump:</span>
                <span :class="['info-value', trumpSuitClass]">{{ trumpDisplay }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">trick:</span>
                <span class="info-value">{{ currentTrick }}/5</span>
            </div>
        </div>

        <!-- Player Hands (card counts) -->
        <div class="state-section">
            <div class="section-label">// hands</div>
            <div class="hands-grid">
                <div
                    v-for="position in positions"
                    :key="position"
                    :class="['hand-entry', { active: position === currentPlayer }]"
                >
                    <span class="hand-position">{{ position[0].toUpperCase() }}</span>
                    <span class="hand-cards">
                        <span
                            v-for="(card, index) in playerHands[position].slice(0, 5)"
                            :key="index"
                            :class="['mini-card', getSuitClass(card.suit)]"
                        >{{ getSuitSymbol(card.suit) }}</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- Turned Up Card -->
        <div v-if="turnedUpCard" class="state-section">
            <div class="info-row">
                <span class="info-label">turned_up:</span>
                <span :class="['info-value', getSuitClass(turnedUpCard.suit)]">
                    {{ formatCard(turnedUpCard) }}
                </span>
            </div>
        </div>

        <div class="closing-brace">}</div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card, Position, Suit } from "~/types/game";

interface PlayerHands {
    north: Card[];
    south: Card[];
    east: Card[];
    west: Card[];
}

interface PlayedCards {
    north?: Card | null;
    south?: Card | null;
    east?: Card | null;
    west?: Card | null;
}

interface Props {
    playerHands: PlayerHands;
    playedCards: PlayedCards;
    currentPlayer: Position | null;
    trumpSuit: string;
    currentTrick: number;
    turnedUpCard?: Card | null;
}

const props = defineProps<Props>();

const positions: Position[] = ['north', 'east', 'south', 'west'];

const formatCard = (card: Card): string => {
    const rankMap: Record<string, string> = {
        '9': '9', '10': '10', 'jack': 'J', 'queen': 'Q', 'king': 'K', 'ace': 'A'
    };
    const suitMap: Record<Suit, string> = {
        hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠'
    };
    return `${rankMap[card.rank] || card.rank}${suitMap[card.suit]}`;
};

const getSuitSymbol = (suit: Suit): string => {
    const symbols: Record<Suit, string> = {
        hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠'
    };
    return symbols[suit];
};

const getSuitClass = (suit: Suit): string => {
    return suit === 'hearts' || suit === 'diamonds' ? 'red-suit' : 'black-suit';
};

const trumpDisplay = computed(() => {
    if (!props.trumpSuit || props.trumpSuit === '?') return '?';
    return props.trumpSuit;
});

const trumpSuitClass = computed(() => {
    if (props.trumpSuit === '♥' || props.trumpSuit === '♦') return 'red-suit';
    return 'black-suit';
});
</script>

<style scoped>
.compact-arena {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    font-family: "Courier New", Consolas, Monaco, monospace;
    font-size: 0.8125rem;
}

.arena-header {
    font-weight: 500;
    letter-spacing: 0.025em;
    margin-bottom: 1rem;
    color: var(--color-text);
}

.keyword {
    color: var(--color-keyword);
}

.state-section {
    margin-bottom: 1rem;
    padding-left: 1rem;
}

.section-label {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
}

.trick-display {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.trick-card {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.position-abbr {
    color: var(--color-text-secondary);
    font-weight: 600;
}

.card-text {
    font-weight: bold;
}

.empty-card {
    color: var(--color-text-placeholder);
}

.red-suit {
    color: var(--color-error);
}

.black-suit {
    color: var(--color-text);
}

.info-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.info-label {
    color: var(--color-text-secondary);
}

.info-value {
    color: var(--color-text);
}

.info-value.highlight {
    color: var(--color-accent);
    font-weight: bold;
}

.hands-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.hand-entry {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.2);
}

.hand-entry.active {
    background: rgba(163, 230, 53, 0.1);
    border-left: 2px solid var(--color-accent);
}

.hand-position {
    color: var(--color-text-secondary);
    font-weight: 600;
    min-width: 1rem;
}

.hand-entry.active .hand-position {
    color: var(--color-accent);
}

.hand-cards {
    display: flex;
    gap: 0.125rem;
}

.mini-card {
    font-size: 0.875rem;
}

.closing-brace {
    font-size: 0.875rem;
    color: var(--color-text);
    margin-top: 0.5rem;
}
</style>
