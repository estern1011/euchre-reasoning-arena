<template>
    <div class="hand-strength-panel">
        <div class="panel-header">
            <span class="comment">// </span>hand_strength
            <span class="trump-indicator" v-if="trumpSuit && !showMatrix">
                (if {{ getSuitSymbol(trumpSuit) }} trump)
            </span>
            <span class="round-indicator" v-if="showMatrix">
                (round 2 - any suit)
            </span>
        </div>

        <!-- Single suit view (Round 1) -->
        <div class="strength-ranking" v-if="!showMatrix && trumpSuit">
            <div
                v-for="(item, index) in ranking"
                :key="item.position"
                class="strength-row"
                :class="[item.position, getStrengthClass(item.strength)]"
            >
                <span class="rank-number">{{ index + 1 }}.</span>
                <span class="position-name">{{ item.position.toUpperCase() }}</span>
                <div class="strength-bar-container">
                    <div
                        class="strength-bar"
                        :style="{ width: `${getHandStrengthPercent(item.strength)}%` }"
                        :class="getStrengthClass(item.strength)"
                    ></div>
                </div>
                <span class="strength-value">{{ item.strength }}</span>
            </div>
        </div>

        <!-- Matrix view (Round 2) -->
        <div class="strength-matrix" v-else-if="showMatrix">
            <div class="matrix-header">
                <span class="matrix-cell header-cell"></span>
                <span class="matrix-cell header-cell suit-cell" v-for="suit in suits" :key="suit">
                    <span :class="['suit-symbol', getSuitColor(suit)]">{{ getSuitSymbol(suit) }}</span>
                </span>
            </div>
            <div
                v-for="position in positions"
                :key="position"
                class="matrix-row"
                :class="position"
            >
                <span class="matrix-cell position-cell">{{ position.charAt(0).toUpperCase() }}</span>
                <span
                    v-for="suit in suits"
                    :key="suit"
                    class="matrix-cell value-cell"
                    :class="[getStrengthClass(matrix[position][suit]), { 'is-best': isBestForPlayer(position, suit) }]"
                >
                    {{ matrix[position][suit] }}
                </span>
            </div>
        </div>

        <!-- Empty state -->
        <div class="empty-state" v-else>
            <span class="empty-text">// awaiting hands...</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Position, Suit, Card } from '~/types/game';
import {
    calculateAllHandStrengths,
    calculateHandStrengthMatrix,
    getHandStrengthRanking,
    getHandStrengthPercent,
    getHandStrengthCategory,
} from '../../lib/scoring/hand-strength';

interface Props {
    hands: Record<Position, Card[]>;
    trumpSuit?: Suit | null;
    showMatrix?: boolean;  // True for Round 2
}

const props = withDefaults(defineProps<Props>(), {
    trumpSuit: null,
    showMatrix: false,
});

const positions: Position[] = ['north', 'east', 'south', 'west'];
const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

// Single suit ranking (Round 1)
const ranking = computed(() => {
    if (!props.trumpSuit || !hasHands.value) return [];
    return getHandStrengthRanking(props.hands, props.trumpSuit);
});

// Matrix for all suits (Round 2)
const matrix = computed(() => {
    if (!hasHands.value) {
        return {
            north: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
            east: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
            south: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
            west: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
        };
    }
    return calculateHandStrengthMatrix(props.hands);
});

const hasHands = computed(() => {
    return Object.values(props.hands).some(hand => hand && hand.length > 0);
});

// Find the best suit for each player
const bestSuits = computed(() => {
    const best: Record<Position, Suit> = {
        north: 'hearts',
        east: 'hearts',
        south: 'hearts',
        west: 'hearts',
    };

    for (const pos of positions) {
        let maxStrength = 0;
        for (const suit of suits) {
            if (matrix.value[pos][suit] > maxStrength) {
                maxStrength = matrix.value[pos][suit];
                best[pos] = suit;
            }
        }
    }

    return best;
});

const isBestForPlayer = (position: Position, suit: Suit): boolean => {
    return bestSuits.value[position] === suit;
};

const getStrengthClass = (strength: number): string => {
    return getHandStrengthCategory(strength);
};

const getSuitSymbol = (suit: Suit): string => {
    const symbols: Record<Suit, string> = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠',
    };
    return symbols[suit];
};

const getSuitColor = (suit: Suit): string => {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
};
</script>

<style scoped>
.hand-strength-panel {
    background: rgba(10, 20, 20, 0.9);
    border: 1px solid rgba(56, 189, 186, 0.3);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
}

.comment {
    color: var(--color-text-muted);
}

.trump-indicator,
.round-indicator {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-left: auto;
}

.trump-indicator .suit-symbol {
    font-size: 0.875rem;
}

/* Ranking View (Round 1) */
.strength-ranking {
    flex: 1;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.strength-row {
    display: grid;
    grid-template-columns: 24px 50px 1fr 40px;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    border-left: 3px solid transparent;
}

.strength-row.north,
.strength-row.south {
    border-left-color: rgba(56, 189, 186, 0.5);
}

.strength-row.east,
.strength-row.west {
    border-left-color: rgba(248, 113, 113, 0.5);
}

.rank-number {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-family: "Courier New", monospace;
}

.position-name {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    letter-spacing: 0.05em;
}

.strength-bar-container {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.strength-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
}

.strength-bar.strong {
    background: linear-gradient(90deg, #a3e635, #22c55e);
}

.strength-bar.medium {
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.strength-bar.weak {
    background: linear-gradient(90deg, #f87171, #ef4444);
}

.strength-value {
    font-size: 0.875rem;
    font-weight: 600;
    font-family: "Courier New", monospace;
    text-align: right;
    color: var(--color-text-secondary);
}

.strength-row.strong .strength-value {
    color: #a3e635;
}

.strength-row.medium .strength-value {
    color: #fbbf24;
}

.strength-row.weak .strength-value {
    color: #f87171;
}

/* Matrix View (Round 2) */
.strength-matrix {
    flex: 1;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.matrix-header,
.matrix-row {
    display: grid;
    grid-template-columns: 40px repeat(4, 1fr);
    gap: 0.25rem;
}

.matrix-cell {
    padding: 0.5rem;
    text-align: center;
    font-size: 0.8125rem;
    font-family: "Courier New", monospace;
}

.header-cell {
    font-size: 0.6875rem;
    text-transform: uppercase;
    color: var(--color-text-muted);
    letter-spacing: 0.05em;
}

.suit-cell {
    font-size: 1rem;
}

.suit-symbol.red {
    color: #ef4444;
}

.suit-symbol.black {
    color: var(--color-text-secondary);
}

.matrix-row {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.matrix-row.north,
.matrix-row.south {
    border-left: 2px solid rgba(56, 189, 186, 0.4);
}

.matrix-row.east,
.matrix-row.west {
    border-left: 2px solid rgba(248, 113, 113, 0.4);
}

.position-cell {
    font-weight: 600;
    color: var(--color-text-secondary);
}

.value-cell {
    color: var(--color-text-muted);
}

.value-cell.strong {
    color: #a3e635;
    font-weight: 600;
}

.value-cell.medium {
    color: #fbbf24;
}

.value-cell.weak {
    color: var(--color-text-muted);
}

.value-cell.is-best {
    background: rgba(163, 230, 53, 0.15);
    border-radius: 4px;
}

/* Empty State */
.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.empty-text {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-style: italic;
}
</style>
