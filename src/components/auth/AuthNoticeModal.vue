<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { AlertCircle, CheckCircle2, Info, X } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    variant?: 'info' | 'error' | 'success'
    confirmText?: string
  }>(),
  {
    variant: 'info',
    confirmText: 'Entendido',
  },
)

const emit = defineEmits<{
  close: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape' || e.key === 'Enter') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="auth-notice">
      <div
        v-if="open"
        class="auth-notice-overlay"
        role="presentation"
        @click.self="emit('close')"
      >
        <div
          class="auth-notice"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="'auth-notice-title'"
          @click.stop
        >
          <button
            type="button"
            class="auth-notice__close"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>

          <div
            class="auth-notice__icon"
            :class="{
              'auth-notice__icon--error': variant === 'error',
              'auth-notice__icon--success': variant === 'success',
              'auth-notice__icon--info': variant === 'info',
            }"
          >
            <AlertCircle v-if="variant === 'error'" :size="28" />
            <CheckCircle2 v-else-if="variant === 'success'" :size="28" />
            <Info v-else :size="28" />
          </div>

          <h2 id="auth-notice-title" class="auth-notice__title">{{ title }}</h2>
          <p class="auth-notice__message">{{ message }}</p>

          <button type="button" class="auth-notice__btn" @click="emit('close')">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-notice-overlay {
  position: fixed;
  inset: 0;
  z-index: 3200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px) saturate(1.15);
  -webkit-backdrop-filter: blur(8px) saturate(1.15);
}

.auth-notice {
  position: relative;
  width: min(100%, 22.5rem);
  padding: 1.5rem 1.35rem 1.25rem;
  border-radius: 1rem;
  background: #fff;
  text-align: center;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.06),
    0 18px 40px rgba(15, 23, 42, 0.18);
}

.auth-notice__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  color: #94a3b8;
}

.auth-notice__close:hover {
  background: #f1f5f9;
  color: #64748b;
}

.auth-notice__icon {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  margin: 0.15rem auto 0.9rem;
  border-radius: 999px;
}

.auth-notice__icon--error {
  color: #dc2626;
  background: #fef2f2;
}

.auth-notice__icon--success {
  color: #059669;
  background: #ecfdf5;
}

.auth-notice__icon--info {
  color: #2563eb;
  background: #eff6ff;
}

.auth-notice__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.auth-notice__message {
  margin: 0.55rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #64748b;
}

.auth-notice__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 1.25rem;
  min-height: 2.75rem;
  border-radius: 0.65rem;
  background: #2563eb;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.15s ease;
}

.auth-notice__btn:hover {
  background: #1d4ed8;
}

.auth-notice-enter-active,
.auth-notice-leave-active {
  transition: opacity 0.2s ease;
}

.auth-notice-enter-active .auth-notice,
.auth-notice-leave-active .auth-notice {
  transition:
    transform 0.22s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease;
}

.auth-notice-enter-from,
.auth-notice-leave-to {
  opacity: 0;
}

.auth-notice-enter-from .auth-notice,
.auth-notice-leave-to .auth-notice {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
