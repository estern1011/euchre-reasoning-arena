<template>
    <div class="collapsible-section">
        <button
            class="collapsible-header"
            :class="{ expanded: isExpanded }"
            @click="toggle"
        >
            <span class="collapsible-label">
                <span class="comment">// </span>{{ label }}
            </span>
            <span class="collapsible-toggle">{{ isExpanded ? '−' : '+' }}</span>
        </button>
        <div v-if="isExpanded" class="collapsible-content">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
    label: string;
    defaultExpanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    defaultExpanded: false,
});

const isExpanded = ref(props.defaultExpanded);

const toggle = () => {
    isExpanded.value = !isExpanded.value;
};

watch(() => props.defaultExpanded, (val) => {
    isExpanded.value = val;
});
</script>
