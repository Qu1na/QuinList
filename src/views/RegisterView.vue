<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Eye, EyeOff, Loader2, Mail, Lock, User } from '@lucide/vue'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import AuthNoticeModal from '@/components/auth/AuthNoticeModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { useProjectsStore } from '@/stores/projects'
import { REDIRECT_KEY } from '@/router'
import { localizeAuthError } from '@/utils/authMessages'

const auth = useAuthStore()
const store = useQuinListStore()
const projectsStore = useProjectsStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const acceptTerms = ref(false)
const loading = ref(false)

const noticeOpen = ref(false)
const noticeTitle = ref('')
const noticeMessage = ref('')
const noticeVariant = ref<'info' | 'error' | 'success'>('error')

onMounted(() => document.documentElement.classList.add('auth-screen'))
onUnmounted(() => document.documentElement.classList.remove('auth-screen'))

function showNotice(title: string, message: string, variant: 'info' | 'error' | 'success' = 'error') {
  noticeTitle.value = title
  noticeMessage.value = message
  noticeVariant.value = variant
  noticeOpen.value = true
}

async function afterAuthSuccess() {
  void store.init().catch((err) => console.error('[register] quinlist.init:', err))
  void projectsStore.init().catch((err) => console.error('[register] projects.init:', err))

  const redirect = sessionStorage.getItem(REDIRECT_KEY)
  if (redirect) {
    sessionStorage.removeItem(REDIRECT_KEY)
    await router.push(redirect)
  } else {
    await router.push({ name: 'home' })
  }
}

async function submit() {
  if (!name.value.trim()) {
    showNotice('Nombre requerido', 'Ingresa tu nombre completo para crear la cuenta.', 'info')
    return
  }
  if (password.value.length < 6) {
    showNotice('Contraseña corta', 'Usa al menos 6 caracteres para tu contraseña.', 'info')
    return
  }
  if (password.value !== confirmPassword.value) {
    showNotice('No coinciden', 'La contraseña y la confirmación deben ser iguales.', 'info')
    return
  }
  if (!acceptTerms.value) {
    showNotice('Términos', 'Acepta los términos y la política de privacidad para continuar.', 'info')
    return
  }

  loading.value = true
  try {
    const result = await auth.register(email.value, password.value, name.value)
    if (!result.ok) {
      showNotice(
        'No pudimos crear tu cuenta',
        localizeAuthError(result.error, 'Inténtalo de nuevo en unos momentos.'),
        'error',
      )
      return
    }

    await afterAuthSuccess()
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <AuthLayout title="Crea tu cuenta" subtitle="Regístrate gratis y empieza en minutos.">
    <div
      v-if="!auth.useDatabase"
      class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800"
    >
      Registro requiere MatuDB.
      <RouterLink to="/login" class="font-semibold text-[#2563eb] hover:underline">
        Inicia sesión
      </RouterLink>
    </div>

    <template v-else>
      <div class="mb-4 grid grid-cols-2 gap-3">
        <button type="button" class="auth-social-btn" disabled title="Próximamente">
          <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>
        <button type="button" class="auth-social-btn" disabled title="Próximamente">
          <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="#1877F2">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          Facebook
        </button>
      </div>

      <div class="auth-divider">
        <span>o regístrate con email</span>
      </div>

      <form class="space-y-3" @submit.prevent="submit">
        <div class="relative">
          <User :size="17" class="auth-field-icon" />
          <input
            v-model="name"
            type="text"
            placeholder="Nombre completo"
            required
            autocomplete="name"
            class="auth-field"
          />
        </div>

        <div class="relative">
          <Mail :size="17" class="auth-field-icon" />
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            required
            autocomplete="email"
            class="auth-field"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="relative">
            <Lock :size="17" class="auth-field-icon" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Contraseña"
              required
              minlength="6"
              autocomplete="new-password"
              class="auth-field"
            />
          </div>
          <div class="relative">
            <Lock :size="17" class="auth-field-icon" />
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Confirmar"
              required
              autocomplete="new-password"
              class="auth-field"
            />
          </div>
        </div>

        <label class="flex cursor-pointer items-center gap-2 text-xs text-[#64748b]">
          <input v-model="acceptTerms" type="checkbox" class="auth-checkbox" />
          <span>
            Acepto los
            <RouterLink to="/terminos" class="font-medium text-[#2563eb] hover:underline"
              >términos</RouterLink
            >
            y la
            <RouterLink to="/privacidad" class="font-medium text-[#2563eb] hover:underline"
              >política de privacidad</RouterLink
            >
          </span>
        </label>

        <button type="submit" :disabled="loading" class="auth-submit">
          <Loader2 v-if="loading" :size="17" class="animate-spin" />
          Crear cuenta
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-[#64748b]">
        ¿Ya tienes cuenta?
        <RouterLink to="/login" class="font-semibold text-[#2563eb] hover:underline">
          Iniciar sesión
        </RouterLink>
      </p>
    </template>
  </AuthLayout>

  <AuthNoticeModal
    :open="noticeOpen"
    :title="noticeTitle"
    :message="noticeMessage"
    :variant="noticeVariant"
    @close="noticeOpen = false"
  />
</template>
