<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { X } from '@lucide/vue'
import { useCollaborationStore } from '@/stores/collaboration'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'

const collab = useCollaborationStore()
const { toasts } = storeToRefs(collab)
</script>

<template>
  <div class="collab-toasts" aria-live="polite">
    <TransitionGroup
      name="collab-toast"
      tag="div"
      class="collab-toasts__stack"
    >
      <article
        v-for="toast in toasts"
        :key="toast.id"
        class="collab-toast"
        :style="{ '--toast-accent': toast.accent }"
      >
        <span class="collab-toast__emoji" aria-hidden="true">{{ toast.emoji }}</span>
        <UserAvatar :user-id="toast.userId" size="sm" class="collab-toast__avatar" />
        <p class="collab-toast__message">{{ toast.message }}</p>
        <button
          type="button"
          class="collab-toast__close"
          aria-label="Cerrar"
          @click="collab.dismissToast(toast.id)"
        >
          <X :size="14" />
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.collab-toasts {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 3000;
  pointer-events: none;
  width: min(22rem, calc(100vw - 2rem));
}

.collab-toasts__stack {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.collab-toast {
  pointer-events: auto;
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 0.875rem;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 12px 40px rgba(23, 43, 77, 0.14),
    inset 3px 0 0 var(--toast-accent, #2d7eb8);
  backdrop-filter: blur(12px);
}

.collab-toast__emoji {
  font-size: 1rem;
  line-height: 1;
}

.collab-toast__message {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #172b4d;
}

.collab-toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  color: #626f86;
  transition: background 0.15s ease, color 0.15s ease;
}

.collab-toast__close:hover {
  background: #f1f2f4;
  color: #172b4d;
}

.collab-toast-enter-active,
.collab-toast-leave-active {
  transition: all 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.collab-toast-enter-from,
.collab-toast-leave-to {
  opacity: 0;
  transform: translateX(1.25rem) scale(0.96);
}

.collab-toast-move {
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
