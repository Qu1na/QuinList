<script setup lang="ts">
import { ref, watch } from 'vue'
import { Loader2, Mail, X } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import AuthNoticeModal from '@/components/auth/AuthNoticeModal.vue'
import {
  AUTH_RESET_NOT_FOUND_MESSAGE,
  AUTH_RESET_NOT_FOUND_TITLE,
  localizeAuthError,
} from '@/utils/authMessages'

const props = defineProps<{
  open: boolean
  initialEmail?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const auth = useAuthStore()
const email = ref('')
const loading = ref(false)
const sent = ref(false)

const noticeOpen = ref(false)
const noticeTitle = ref('')
const noticeMessage = ref('')
const noticeVariant = ref<'info' | 'error' | 'success'>('error')

watch(
  () => props.open,
  (open) => {
    if (open) {
      email.value = props.initialEmail?.trim() || ''
      sent.value = false
      loading.value = false
      noticeOpen.value = false
    }
  },
)

function showNotice(title: string, message: string, variant: 'info' | 'error' | 'success' = 'error') {
  noticeTitle.value = title
  noticeMessage.value = message
  noticeVariant.value = variant
  noticeOpen.value = true
}

function isUserNotFound(raw?: string) {
  return /user\s*not\s*found|email\s*not\s*found|no\s*user|account\s*not\s*found/i.test(
    raw ?? '',
  )
}

async function submit() {
  if (!email.value.trim()) {
    showNotice('Correo requerido', 'Ingresa el correo electrónico de tu cuenta.', 'info')
    return
  }
  loading.value = true
  try {
    const result = await auth.requestPasswordReset(email.value)
    if (!result.ok) {
      if (isUserNotFound(result.error)) {
        showNotice(AUTH_RESET_NOT_FOUND_TITLE, AUTH_RESET_NOT_FOUND_MESSAGE, 'error')
      } else {
        showNotice(
          'No pudimos enviar el enlace',
          localizeAuthError(result.error, 'Inténtalo de nuevo en unos momentos.'),
          'error',
        )
      }
      return
    }
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[2100] flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-title"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="forgot-title" class="text-lg font-semibold text-[#1e293b]">
              {{ sent ? 'Revisa tu correo' : 'Restablecer contraseña' }}
            </h2>
            <p class="mt-1 text-sm text-[#64748b]">
              {{
                sent
                  ? 'Te enviamos un enlace de recuperación.'
                  : 'Te enviaremos un enlace para crear una nueva contraseña.'
              }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-[#94a3b8] hover:bg-slate-100 hover:text-[#64748b]"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <X :size="18" />
          </button>
        </div>

        <template v-if="!sent">
          <label class="block text-sm font-medium text-[#172b4d]">
            Correo
            <div class="relative mt-1">
              <Mail :size="17" class="absolute top-1/2 left-3 -translate-y-1/2 text-[#94a3b8]" />
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="tu@empresa.com"
                class="auth-field w-full pl-10"
                @keyup.enter="submit"
              />
            </div>
          </label>

          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="btn-brand-ghost" @click="emit('close')">Cancelar</button>
            <button type="button" class="btn-brand" :disabled="loading" @click="submit">
              <Loader2 v-if="loading" :size="16" class="animate-spin" />
              Enviar enlace
            </button>
          </div>
        </template>

        <template v-else>
          <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p class="font-medium">Correo enviado a {{ email.trim() }}</p>
            <p class="mt-2 leading-relaxed text-emerald-800/90">
              Si no llega a la bandeja principal en unos minutos, revisa la carpeta de
              <strong>spam</strong> o correo no deseado. El enlace caduca por seguridad.
            </p>
          </div>
          <div class="mt-5 flex justify-end">
            <button type="button" class="btn-brand" @click="emit('close')">Entendido</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>

  <AuthNoticeModal
    :open="noticeOpen"
    :title="noticeTitle"
    :message="noticeMessage"
    :variant="noticeVariant"
    @close="noticeOpen = false"
  />
</template>
