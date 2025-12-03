<template>
    <div v-if="cards.length > 0" class="hand-cards" :class="orientation">
        <Card
            v-for="(card, index) in cards"
            :key="`${index}`"
            :suit="card.suit"
            :rank="card.rank"
            :faceDown="false"
            size="sm"
        />
    </div>
</template>

<script setup lang="ts">
import Card from "~/components/Card.vue";
import type { Card as CardType } from "~/types/game";

interface Props {
    cards: CardType[];
    orientation: 'horizontal' | 'vertical';
}

defineProps<Props>();
</script>

<style scoped>
.hand-cards {
    display: flex;
    gap: clamp(1px, 0.3vh, 2px);
    justify-content: center;
    flex-wrap: nowrap;
}

.hand-cards.horizontal {
    flex-direction: row;
}

.hand-cards.vertical {
    flex-direction: column;
    align-items: center;
}
</style>
