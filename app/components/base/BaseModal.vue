<template>
    <DialogRoot :open="isOpen" @update:open="handleOpenChange">
        <DialogPortal>
            <DialogOverlay class="modal-overlay" />
            <DialogContent
                class="modal-container"
                :class="sizeClass"
                @escape-key-down="$emit('close')"
            >
                <div class="modal-header">
                    <DialogTitle as-child>
                        <slot name="title">
                            <h3>
                                <span class="comment">// </span>{{ title }}
                            </h3>
                        </slot>
                    </DialogTitle>
                    <DialogDescription class="sr-only">
                        {{ title }} modal dialog
                    </DialogDescription>
                    <DialogClose as-child>
                        <button class="modal-close-btn" aria-label="Close modal">✕</button>
                    </DialogClose>
                </div>
                <div class="modal-body">
                    <slot />
                </div>
                <div v-if="$slots.footer" class="modal-footer">
                    <slot name="footer" />
                </div>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts">
import {
    DialogRoot,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "radix-vue";
import { computed } from "vue";

interface Props {
    isOpen: boolean;
    title: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const props = withDefaults(defineProps<Props>(), {
    size: "md",
});

const emit = defineEmits<{
    (e: "close"): void;
}>();

const sizeClass = computed(() => `modal-${props.size}`);

const handleOpenChange = (open: boolean) => {
    if (!open) {
        emit("close");
    }
};
</script>

<style scoped>
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
</style>
