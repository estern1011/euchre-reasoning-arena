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
                            <span :id="titleId" class="modal-title">
                                <span class="comment">// </span>{{ title }}
                            </span>
                        </slot>
                    </DialogTitle>
                    <DialogClose as-child>
                        <button class="close-btn" aria-label="Close modal">&times;</button>
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

const titleId = computed(() => `modal-title-${props.title.replace(/\s+/g, "-").toLowerCase()}`);

const sizeClass = computed(() => `modal-${props.size}`);

const handleOpenChange = (open: boolean) => {
    if (!open) {
        emit("close");
    }
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(10, 20, 20, 0.98);
    border: 2px solid rgba(56, 189, 186, 0.5);
    border-radius: 12px;
    width: 95%;
    max-height: 85vh;
    overflow: auto;
    box-shadow: 0 0 40px rgba(56, 189, 186, 0.3);
    z-index: 1001;
    animation: slideIn 0.15s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translate(-50%, -48%);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%);
    }
}

.modal-sm {
    max-width: 400px;
}

.modal-md {
    max-width: 550px;
}

.modal-lg {
    max-width: 700px;
}

.modal-xl {
    max-width: 900px;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.modal-title {
    display: flex;
    align-items: center;
    gap: 0;
}

.comment {
    color: var(--color-text-muted);
}

.close-btn {
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 1.75rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.2s;
}

.close-btn:hover {
    color: #f87171;
}

.close-btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}
</style>
