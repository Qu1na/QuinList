<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { ConfirmOptions } from '@/stores/ui'

const props = defineProps<{
  options: ConfirmOptions
}>()

const emit = defineEmits<{
  resolve: [value: boolean]
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('resolve', false)
  if (e.key === 'Enter') emit('resolve', true)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="app-confirm-enter-active"
      enter-from-class="app-confirm-enter-from"
      leave-active-class="app-confirm-leave-active"
      leave-to-class="app-confirm-leave-to"
    >
      <div
        class="app-confirm-overlay"
        role="presentation"
        @click.self="emit('resolve', false)"
      >
        <div
          class="app-confirm"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="`app-confirm-title-${options.title}`"
          @click.stop
        >
          <div class="app-confirm__content">
            <h2 :id="`app-confirm-title-${options.title}`" class="app-confirm__title">
              {{ options.title }}
            </h2>
            <p class="app-confirm__message">{{ options.message }}</p>
          </div>

          <div class="app-confirm__actions">
            <button
              type="button"
              class="app-confirm__btn app-confirm__btn--cancel"
              @click="emit('resolve', false)"
            >
              {{ options.cancelText ?? 'Cancelar' }}
            </button>
            <button
              type="button"
              class="app-confirm__btn"
              :class="
                options.variant === 'danger'
                  ? 'app-confirm__btn--destructive'
                  : 'app-confirm__btn--primary'
              "
              @click="emit('resolve', true)"
            >
              {{ options.confirmText ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(10px) saturate(1.2);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
}

.app-confirm {
  width: min(100%, 20rem);
  overflow: hidden;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.12),
    0 12px 28px rgba(0, 0, 0, 0.22),
    0 4px 12px rgba(0, 0, 0, 0.12);
}

.app-confirm__content {
  padding: 1.25rem 1.125rem 1rem;
  text-align: center;
}

.app-confirm__title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: #1d1d1f;
}

.app-confirm__message {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #6e6e73;
}

.app-confirm__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 0.5px solid rgba(60, 60, 67, 0.18);
}

.app-confirm__btn {
  min-height: 2.75rem;
  padding: 0.625rem 0.5rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.2;
  background: transparent;
  transition: background 0.12s ease;
}

.app-confirm__btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.app-confirm__btn:active {
  background: rgba(0, 0, 0, 0.08);
}

.app-confirm__btn--cancel {
  color: #007aff;
  border-right: 0.5px solid rgba(60, 60, 67, 0.18);
}

.app-confirm__btn--primary {
  font-weight: 600;
  color: #007aff;
}

.app-confirm__btn--destructive {
  font-weight: 600;
  color: #ff3b30;
}

.app-confirm-enter-active,
.app-confirm-leave-active {
  transition: opacity 0.2s ease;
}

.app-confirm-enter-active .app-confirm,
.app-confirm-leave-active .app-confirm {
  transition:
    transform 0.22s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease;
}

.app-confirm-enter-from,
.app-confirm-leave-to {
  opacity: 0;
}

.app-confirm-enter-from .app-confirm,
.app-confirm-leave-to .app-confirm {
  opacity: 0;
  transform: scale(1.06);
}
</style>
