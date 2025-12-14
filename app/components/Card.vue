<template>
    <div
        :class="cardClasses"
        :tabindex="selectable ? 0 : -1"
        :role="selectable ? 'button' : undefined"
        :aria-pressed="selectable ? selected : undefined"
        :aria-label="ariaLabel"
        @click="handleClick"
        @keydown.enter.prevent="handleClick"
        @keydown.space.prevent="handleClick"
    >
        <!-- Face down card back -->
        <div v-if="faceDown" class="card-back-content">
            <div class="card-back-icon">🃏</div>
            <div class="card-back-pattern"></div>
            <div class="card-back-inner-border"></div>
        </div>

        <!-- Face up card -->
        <template v-else>
            <!-- Top left corner -->
            <div class="card-corner top-left">
                <div class="rank">{{ displayRank }}</div>
                <div class="suit">{{ suitSymbol }}</div>
            </div>

            <!-- Center content -->
            <div class="card-center">
                <div class="suit-large">{{ suitSymbol }}</div>
            </div>

            <!-- Bottom right corner (upside down) -->
            <div class="card-corner bottom-right">
                <div class="rank">{{ displayRank }}</div>
                <div class="suit">{{ suitSymbol }}</div>
            </div>
        </template>

        <!-- Selectable hover effect -->
        <div v-if="selectable" class="selectable-overlay"></div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
    suit: "hearts" | "diamonds" | "clubs" | "spades";
    rank: "9" | "10" | "jack" | "queen" | "king" | "ace";
    faceDown?: boolean;
    size?: "xs" | "sm" | "md" | "lg";
    selectable?: boolean;
    selected?: boolean;
    active?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    faceDown: false,
    size: "md",
    selectable: false,
    selected: false,
    active: false,
});

const emit = defineEmits<{
    (e: 'click'): void;
}>();

const suitSymbol = computed(() => {
    const symbols = {
        hearts: "♥",
        diamonds: "♦",
        clubs: "♣",
        spades: "♠",
    };
    return symbols[props.suit];
});

const displayRank = computed(() => {
    const ranks = {
        "9": "9",
        "10": "10",
        "jack": "J",
        "queen": "Q",
        "king": "K",
        "ace": "A",
    };
    return ranks[props.rank] || props.rank.toUpperCase();
});

const suitClass = computed(() => {
    return props.suit === "hearts" || props.suit === "diamonds" ? "red" : "black";
});

const sizeClass = computed(() => {
    return `size-${props.size}`;
});

const cardClasses = computed(() => {
    const classes = ['playing-card', sizeClass.value, suitClass.value];

    if (props.faceDown) {
        classes.push('card-back');
    }

    if (props.selectable) {
        classes.push('selectable');
    }

    if (props.selected) {
        classes.push('selected');
    }

    if (props.active) {
        classes.push('active-player');
    }

    return classes;
});

const ariaLabel = computed(() => {
    if (props.faceDown) {
        return 'Face down card';
    }
    const rankNames: Record<string, string> = {
        '9': 'Nine', '10': 'Ten', 'jack': 'Jack', 'queen': 'Queen', 'king': 'King', 'ace': 'Ace'
    };
    const suitNames: Record<string, string> = {
        hearts: 'Hearts', diamonds: 'Diamonds', clubs: 'Clubs', spades: 'Spades'
    };
    return `${rankNames[props.rank]} of ${suitNames[props.suit]}${props.selected ? ', selected' : ''}`;
});

const handleClick = () => {
    if (props.selectable) {
        emit('click');
    }
};
</script>

<style scoped>
.playing-card {
    background: linear-gradient(135deg, #0d1414 0%, #080f0f 100%);
    border-radius: 6px;
    border: 2px solid;
    position: relative;
    font-family: "Courier New", Consolas, Monaco, monospace;
    transition: all 0.2s ease;
    cursor: default;
    box-shadow:
        2px 2px 8px rgba(0, 0, 0, 0.6),
        inset 0 0 20px rgba(0, 0, 0, 0.3);
}

/* Fixed pixel sizes - scaling handled by parent container */
.playing-card.size-xs {
    width: 50px;
    height: 70px;
}

.playing-card.size-sm {
    width: 65px;
    height: 91px;
}

.playing-card.size-md {
    width: 80px;
    height: 112px;
}

.playing-card.size-lg {
    width: 100px;
    height: 140px;
}

.playing-card.selectable {
    cursor: pointer;
}

.playing-card.selectable:hover,
.playing-card.selectable:focus {
    transform: scale(1.05) translateY(-8px);
    box-shadow:
        4px 4px 12px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(56, 189, 186, 0.3);
    outline: none;
}

.playing-card.selectable:focus-visible {
    outline: 3px solid rgba(56, 189, 186, 0.8);
    outline-offset: 2px;
}

.playing-card.selected {
    transform: scale(1.05) translateY(-8px);
    box-shadow:
        4px 4px 12px rgba(0, 0, 0, 0.3),
        0 0 25px rgba(56, 189, 186, 0.5);
    border-color: rgba(56, 189, 186, 0.8);
}

.playing-card.red {
    color: #f87171;
    border-color: rgba(248, 113, 113, 0.6);
}

.playing-card.black {
    color: #38bdb8;
    border-color: rgba(56, 189, 186, 0.6);
}

/* Active player glow - color matches card suit */
.playing-card.active-player.black {
    border-color: #38bdb8;
    box-shadow:
        0 0 10px rgba(56, 189, 186, 0.9),
        0 0 20px rgba(56, 189, 186, 0.6),
        0 0 35px rgba(56, 189, 186, 0.4),
        0 0 50px rgba(56, 189, 186, 0.2),
        inset 0 0 15px rgba(56, 189, 186, 0.1);
}

.playing-card.active-player.red {
    color: #f87171;
    border-color: #f87171;
    box-shadow:
        0 0 10px rgba(248, 113, 113, 0.9),
        0 0 20px rgba(248, 113, 113, 0.6),
        0 0 35px rgba(248, 113, 113, 0.4),
        0 0 50px rgba(248, 113, 113, 0.2),
        inset 0 0 15px rgba(248, 113, 113, 0.1);
}

.card-corner {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
    font-weight: bold;
}

.card-corner.top-left {
    top: 4px;
    left: 6px;
}

.card-corner.bottom-right {
    bottom: 4px;
    right: 6px;
    transform: rotate(180deg);
}

.rank {
    font-size: 14px;
    font-weight: 700;
}

.suit {
    font-size: 12px;
    margin-top: 1px;
}

.size-xs .rank {
    font-size: 10px;
}

.size-xs .suit {
    font-size: 8px;
}

.size-sm .rank {
    font-size: 12px;
}

.size-sm .suit {
    font-size: 10px;
}

.size-lg .rank {
    font-size: 16px;
}

.size-lg .suit {
    font-size: 14px;
}

.card-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.suit-large {
    font-size: 36px;
    line-height: 1;
}

.size-xs .suit-large {
    font-size: 22px;
}

.size-sm .suit-large {
    font-size: 28px;
}

.size-lg .suit-large {
    font-size: 44px;
}

/* Card back - wireframe style */
.card-back {
    background: linear-gradient(135deg, #0a1212 0%, #060d0d 100%);
    border-color: rgba(56, 189, 186, 0.25);
    box-shadow:
        2px 2px 8px rgba(0, 0, 0, 0.5),
        inset 0 0 20px rgba(0, 0, 0, 0.4);
}

.card-back:hover {
    border-color: rgba(56, 189, 186, 0.35);
}

.card-back-content {
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-back-pattern {
    position: absolute;
    inset: 6px;
    border: 1px solid rgba(56, 189, 186, 0.2);
    border-radius: 2px;
}

.card-back-inner-border {
    position: absolute;
    inset: 10px;
    border: 1px dashed rgba(56, 189, 186, 0.15);
    border-radius: 2px;
}

.card-back-icon {
    font-size: 32px;
    opacity: 0.25;
    color: rgba(56, 189, 186, 0.6);
    position: relative;
    z-index: 1;
}

.size-xs .card-back-icon {
    font-size: 22px;
}

.size-sm .card-back-icon {
    font-size: 30px;
}

.size-lg .card-back-icon {
    font-size: 50px;
}

/* Selectable overlay */
.selectable-overlay {
    position: absolute;
    inset: 0;
    border-radius: 8px;
    background: rgba(56, 189, 186, 0);
    transition: background 0.2s ease;
    pointer-events: none;
}

.selectable:hover .selectable-overlay {
    background: rgba(56, 189, 186, 0.1);
}

.selected .selectable-overlay {
    background: rgba(56, 189, 186, 0.15);
}
</style>
