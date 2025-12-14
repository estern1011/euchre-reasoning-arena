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
