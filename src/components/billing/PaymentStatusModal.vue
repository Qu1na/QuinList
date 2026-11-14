<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { CheckCircle2, LoaderCircle, X, XCircle } from '@lucide/vue'
import type { PaymentModalStatus } from '@/stores/billing'

const props = defineProps<{
  open: boolean
  status: PaymentModalStatus
}>()

const emit = defineEmits<{
  close: []
}>()

const copy = computed(() => {
  if (props.status === 'approved') {
    return {
      title: 'Pago aprobado',
      message:
        'Tu suscripción VIP ya está activa. Tableros, proyectos y equipo ilimitados, listos para usar.',
      confirm: 'Empezar con VIP',
      tone: 'success' as const,
    }
  }
  if (props.status === 'failed') {
    return {
      title: 'Pago no completado',
      message:
        'El cobro se canceló o no pudo validarse. No se hizo ningún cargo. Puedes intentarlo de nuevo cuando quieras.',
      confirm: 'Entendido',
      tone: 'error' as const,
    }
  }
  return {
    title: 'Validando tu pago',
    message:
      'Estamos confirmando el cobro con Landa Pay. En cuanto quede registrado, tu plan VIP se activará solo.',
    confirm: null as string | null,
    tone: 'processing' as const,
  }
})

const canDismiss = computed(() => props.status !== 'processing')

function onKeydown(e: KeyboardEvent) {
  if (!props.open || !canDismiss.value) return
  if (e.key === 'Escape' || e.key === 'Enter') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="pay-status">
      <div
        v-if="open"
        class="pay-status-overlay"
        role="presentation"
        @click.self="canDismiss ? emit('close') : undefined"
      >
        <div
          class="pay-status"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="pay-status-title"
          aria-live="polite"
          @click.stop
        >
          <button
            v-if="canDismiss"
            type="button"
            class="pay-status__close"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>

          <div class="pay-status__icon" :class="`pay-status__icon--${copy.tone}`">
            <LoaderCircle v-if="status === 'processing'" :size="28" class="pay-status__spin" />
            <CheckCircle2 v-else-if="status === 'approved'" :size="28" />
            <XCircle v-else :size="28" />
          </div>

          <h2 id="pay-status-title" class="pay-status__title">{{ copy.title }}</h2>
          <p class="pay-status__message">{{ copy.message }}</p>

          <p v-if="status === 'processing'" class="pay-status__hint">
            No cierres esta ventana todavía.
          </p>

          <button
            v-if="copy.confirm"
            type="button"
            class="pay-status__btn"
            :class="{ 'pay-status__btn--error': status === 'failed' }"
            @click="emit('close')"
          >
            {{ copy.confirm }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pay-status-overlay {
  position: fixed;
  inset: 0;
  z-index: 3300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(8px) saturate(1.12);
  -webkit-backdrop-filter: blur(8px) saturate(1.12);
}

.pay-status {
  position: relative;
  width: min(100%, 22.5rem);
  padding: 1.6rem 1.35rem 1.3rem;
  border-radius: 1rem;
  background: #fff;
  text-align: center;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.06),
    0 18px 40px rgba(15, 23, 42, 0.18);
}

.pay-status__close {
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

.pay-status__close:hover {
  background: #f1f5f9;
  color: #64748b;
}

.pay-status__close:active {
  transform: scale(0.96);
}

.pay-status__icon {
  display: grid;
  place-items: center;
  width: 3.35rem;
  height: 3.35rem;
  margin: 0.1rem auto 0.95rem;
  border-radius: 999px;
}

.pay-status__icon--processing {
  color: #0c66e4;
  background: #e9f2ff;
}

.pay-status__icon--success {
  color: #059669;
  background: #ecfdf5;
}

.pay-status__icon--error {
  color: #dc2626;
  background: #fef2f2;
}

.pay-status__spin {
  animation: pay-spin 0.85s linear infinite;
}

@keyframes pay-spin {
  to {
    transform: rotate(360deg);
  }
}

.pay-status__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #172b4d;
}

.pay-status__message {
  margin: 0.55rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #626f86;
}

.pay-status__hint {
  margin: 0.85rem 0 0;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #8590a2;
}

.pay-status__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 1.25rem;
  min-height: 2.75rem;
  border-radius: 0.65rem;
  background: #0c66e4;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  transition:
    background 0.15s ease,
    transform 0.12s ease;
}

.pay-status__btn:hover {
  background: #0055cc;
}

.pay-status__btn:active {
  transform: scale(0.98);
}

.pay-status__btn--error {
  background: #172b4d;
}

.pay-status__btn--error:hover {
  background: #091e42;
}

.pay-status-enter-active,
.pay-status-leave-active {
  transition: opacity 0.2s ease;
}

.pay-status-enter-active .pay-status,
.pay-status-leave-active .pay-status {
  transition:
    transform 0.22s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease;
}

.pay-status-enter-from,
.pay-status-leave-to {
  opacity: 0;
}

.pay-status-enter-from .pay-status,
.pay-status-leave-to .pay-status {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .pay-status__spin {
    animation: none;
  }

  .pay-status-enter-active,
  .pay-status-leave-active,
  .pay-status-enter-active .pay-status,
  .pay-status-leave-active .pay-status {
    transition: none;
  }
}
</style>
