<template>
    <div :class="['playing-card', sizeClass, suitClass, { 'card-back': faceDown }]">
        <template v-if="!faceDown">
            <div class="card-corner top-left">
                <div class="rank">{{ displayRank }}</div>
                <div class="suit">{{ suitSymbol }}</div>
            </div>
            <div class="card-center">
                <div class="rank-large">{{ displayRank }}</div>
                <div class="suit-large">{{ suitSymbol }}</div>
            </div>
            <div class="card-corner bottom-right">
                <div class="rank">{{ displayRank }}</div>
                <div class="suit">{{ suitSymbol }}</div>
            </div>
        </template>
        <template v-else>
            <div class="card-back-pattern">
                <div class="card-back-icon">🃏</div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
    suit: "hearts" | "diamonds" | "clubs" | "spades";
    rank: "9" | "10" | "J" | "Q" | "K" | "A";
    faceDown?: boolean;
    size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
    faceDown: false,
    size: "md",
});

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
    return props.rank;
});

const suitClass = computed(() => {
    return props.suit === "hearts" || props.suit === "diamonds" ? "red" : "black";
});

const sizeClass = computed(() => {
    return `size-${props.size}`;
});
</script>

<style scoped>
.playing-card {
    background: linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%);
    border-radius: 8px;
    border: 2px solid rgba(0, 0, 0, 0.15);
    position: relative;
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    transition: all 0.15s ease;
}

.playing-card.size-sm {
    width: 60px;
    height: 84px;
}

.playing-card.size-md {
    width: 80px;
    height: 112px;
}

.playing-card.size-lg {
    width: 100px;
    height: 140px;
}

.playing-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.25);
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
    font-size: 16px;
    font-weight: bold;
}

.suit {
    font-size: 14px;
    margin-top: 2px;
}

.card-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.rank-large {
    font-size: 32px;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 4px;
}

.suit-large {
    font-size: 36px;
    line-height: 1;
}

.size-sm .rank-large {
    font-size: 24px;
}

.size-sm .suit-large {
    font-size: 28px;
}

.size-lg .rank-large {
    font-size: 40px;
}

.size-lg .suit-large {
    font-size: 44px;
}

/* Card back */
.card-back {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-color: rgba(163, 230, 53, 0.5);
    box-shadow: 4px 4px 0px rgba(163, 230, 53, 0.3);
}

.card-back:hover {
    box-shadow: 6px 6px 0px rgba(163, 230, 53, 0.4);
}

.card-back-pattern {
    width: 100%;
    height: 100%;
    position: relative;
    background-image:
        repeating-linear-gradient(
            45deg,
            transparent,
            transparent 8px,
            rgba(163, 230, 53, 0.15) 8px,
            rgba(163, 230, 53, 0.15) 16px
        ),
        repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 8px,
            rgba(163, 230, 53, 0.15) 8px,
            rgba(163, 230, 53, 0.15) 16px
        );
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-back-icon {
    font-size: 48px;
    opacity: 0.3;
    color: #a3e635;
}
</style>
