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
    size?: "sm" | "md" | "lg";
    selectable?: boolean;
    selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    faceDown: false,
    size: "md",
    selectable: false,
    selected: false,
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
    background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
    border-radius: 6px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    position: relative;
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.15);
    font-family: "Courier New", Consolas, Monaco, monospace;
    transition: all 0.2s ease;
    cursor: default;
}

.playing-card.size-sm {
    width: clamp(35px, 5vh, 60px);
    height: clamp(49px, 7vh, 84px);
}

.playing-card.size-md {
    width: clamp(50px, 7vh, 80px);
    height: clamp(70px, 9.8vh, 112px);
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
    transform: scale(1.1) translateY(-8px);
    box-shadow:
        6px 6px 0px rgba(0, 0, 0, 0.2),
        0 0 30px rgba(163, 230, 53, 0.4);
    outline: none;
}

.playing-card.selectable:focus-visible {
    outline: 3px solid rgba(163, 230, 53, 0.8);
    outline-offset: 2px;
}

.playing-card.selected {
    transform: scale(1.1) translateY(-8px);
    box-shadow:
        6px 6px 0px rgba(163, 230, 53, 0.3),
        0 0 40px rgba(163, 230, 53, 0.6);
    border-color: rgba(163, 230, 53, 0.8);
}

.playing-card.red {
    color: #dc2626;
}

.playing-card.black {
    color: #1f2937;
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

.size-sm .rank {
    font-size: clamp(8px, 1.8vh, 12px);
}

.size-sm .suit {
    font-size: clamp(7px, 1.5vh, 10px);
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

.size-sm .suit-large {
    font-size: clamp(20px, 4vh, 28px);
}

.size-lg .suit-large {
    font-size: 44px;
}

/* Card back */
.card-back {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
    border-color: rgba(163, 230, 53, 0.5);
    box-shadow:
        4px 4px 0px rgba(163, 230, 53, 0.2),
        0 0 20px rgba(163, 230, 53, 0.1);
}

.card-back:hover {
    box-shadow:
        6px 6px 0px rgba(163, 230, 53, 0.3),
        0 0 30px rgba(163, 230, 53, 0.2);
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
    inset: 8px;
    border: 2px solid rgba(163, 230, 53, 0.2);
    border-radius: 2px;
    opacity: 0.3;
}

.card-back-inner-border {
    position: absolute;
    inset: 12px;
    border: 1px solid rgba(163, 230, 53, 0.15);
    border-radius: 2px;
    opacity: 0.2;
}

.card-back-icon {
    font-size: 40px;
    opacity: 0.25;
    color: var(--color-accent);
    position: relative;
    z-index: 1;
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
    border-radius: 4px;
    background: rgba(163, 230, 53, 0);
    transition: background 0.2s ease;
    pointer-events: none;
}

.selectable:hover .selectable-overlay {
    background: rgba(163, 230, 53, 0.15);
}

.selected .selectable-overlay {
    background: rgba(163, 230, 53, 0.2);
}
</style>
