<template>
    <div :class="['playing-card', suitClass, { 'card-back': faceDown }]">
        <template v-if="!faceDown">
            <div class="card-corner top-left">
                <div class="rank">{{ displayRank }}</div>
                <div class="suit">{{ suitSymbol }}</div>
            </div>
            <div class="card-center">
                <div class="suit-large">{{ suitSymbol }}</div>
            </div>
            <div class="card-corner bottom-right">
                <div class="rank">{{ displayRank }}</div>
                <div class="suit">{{ suitSymbol }}</div>
            </div>
        </template>
        <template v-else>
            <div class="card-back-pattern"></div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
    suit: "hearts" | "diamonds" | "clubs" | "spades";
    rank: "9" | "10" | "J" | "Q" | "K" | "A";
    faceDown?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    faceDown: false,
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
</script>

<style scoped>
.playing-card {
    width: 80px;
    height: 112px;
    background: white;
    border-radius: 2px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    position: relative;
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    transition: all 0.15s ease;
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

.suit-large {
    font-size: 48px;
    line-height: 1;
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
    background-image:
        repeating-linear-gradient(
            45deg,
            transparent,
            transparent 8px,
            rgba(163, 230, 53, 0.08) 8px,
            rgba(163, 230, 53, 0.08) 16px
        ),
        repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 8px,
            rgba(163, 230, 53, 0.08) 8px,
            rgba(163, 230, 53, 0.08) 16px
        );
    border-radius: 6px;
}
</style>
