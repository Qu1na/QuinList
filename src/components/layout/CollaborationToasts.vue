<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { X } from '@lucide/vue'
import { useCollaborationStore } from '@/stores/collaboration'
import { getActivityIcon } from '@/utils/activityIcons'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'

const collab = useCollaborationStore()
const { toasts } = storeToRefs(collab)
</script>

<template>
  <div
    v-if="toasts.length"
    class="collab-toasts"
    aria-live="polite"
    aria-label="Actividad del equipo"
  >
    <button
      v-if="toasts.length > 1"
      type="button"
      class="collab-toasts__dismiss-all"
      @click="collab.dismissAll()"
    >
      Cerrar todo
    </button>

    <TransitionGroup name="collab-toast" tag="div" class="collab-toasts__stack">
      <article
        v-for="toast in toasts"
        :key="toast.id"
        class="collab-toast"
        :style="{ '--toast-accent': toast.accent }"
      >
        <span
          class="collab-toast__icon-wrap"
          :style="{ background: `${toast.accent}18`, color: toast.accent }"
        >
          <component :is="getActivityIcon(toast.actionType)" :size="14" />
        </span>
        <UserAvatar :user-id="toast.userId" size="sm" class="collab-toast__avatar" />
        <p class="collab-toast__message">{{ toast.message }}</p>
        <button
          type="button"
          class="collab-toast__close"
          aria-label="Cerrar"
          @click="collab.dismissToast(toast.id)"
        >
          <X :size="13" />
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.collab-toasts {
  position: fixed;
  right: 1rem;
  bottom: 1.25rem;
  z-index: 120;
  pointer-events: none;
  width: min(20rem, calc(100vw - 2rem));
}

.collab-toasts__dismiss-all {
  pointer-events: auto;
  display: block;
  margin: 0 0 0.375rem auto;
  padding: 0.2rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #626f86;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 12px rgba(23, 43, 77, 0.08);
  backdrop-filter: blur(12px);
}

.collab-toasts__dismiss-all:hover {
  color: #172b4d;
  background: #fff;
}

.collab-toasts__stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.collab-toast {
  pointer-events: auto;
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: start;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 24px rgba(23, 43, 77, 0.12);
  backdrop-filter: blur(16px);
  border-left: 3px solid var(--toast-accent, #2d7eb8);
}

.collab-toast__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  margin-top: 0.125rem;
}

.collab-toast__message {
  margin: 0;
  padding-top: 0.125rem;
  font-size: 0.75rem;
  line-height: 1.35;
  color: #44546f;
}

.collab-toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  color: #97a0af;
  flex-shrink: 0;
}

.collab-toast__close:hover {
  background: #f1f2f4;
  color: #44546f;
}

.collab-toast-enter-active,
.collab-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.collab-toast-enter-from,
.collab-toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

.collab-toast-move {
  transition: transform 0.2s ease;
}
</style>
