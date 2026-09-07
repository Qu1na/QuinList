<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Eye, EyeOff, Loader2, Mail, Lock } from '@lucide/vue'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import AuthNoticeModal from '@/components/auth/AuthNoticeModal.vue'
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { useProjectsStore } from '@/stores/projects'
import { REDIRECT_KEY } from '@/router'
import {
  AUTH_LOGIN_FAIL_MESSAGE,
  AUTH_LOGIN_FAIL_TITLE,
  localizeAuthError,
} from '@/utils/authMessages'
import { isGoogleAuthConfigured, preloadGoogleAuth } from '@/lib/googleAuth'

const auth = useAuthStore()
const store = useQuinListStore()
const projectsStore = useProjectsStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const remember = ref(true)
const loading = ref(false)
const socialLoading = ref(false)
const showForgot = ref(false)

const noticeOpen = ref(false)
const noticeTitle = ref('')
const noticeMessage = ref('')
const noticeVariant = ref<'info' | 'error' | 'success'>('error')

const demoUsers = [
  { email: 'alula@quinlist.app', name: 'Alula García (Propietario)' },
  { email: 'carlos@quinlist.app', name: 'Carlos Mendoza (Admin)' },
  { email: 'sofia@quinlist.app', name: 'Sofía Herrera (Observador)' },
]

onMounted(() => {
  document.documentElement.classList.add('auth-screen')
  preloadGoogleAuth()
  const saved = localStorage.getItem('quinlist_remember_email')
  if (saved) email.value = saved
  else if (!auth.useDatabase) email.value = demoUsers[0]!.email
})

onUnmounted(() => document.documentElement.classList.remove('auth-screen'))

function showNotice(title: string, message: string, variant: 'info' | 'error' | 'success' = 'error') {
  noticeTitle.value = title
  noticeMessage.value = message
  noticeVariant.value = variant
  noticeOpen.value = true
}

async function afterAuthSuccess() {
  await store.init()
  await projectsStore.init()

  const redirect = sessionStorage.getItem(REDIRECT_KEY)
  if (redirect) {
    sessionStorage.removeItem(REDIRECT_KEY)
    router.push(redirect)
  } else {
    router.push({ name: 'home' })
  }
}

async function submit() {
  loading.value = true
  try {
    const result = await auth.login(email.value, password.value)
    if (!result.ok) {
      showNotice(
        AUTH_LOGIN_FAIL_TITLE,
        localizeAuthError(result.error, AUTH_LOGIN_FAIL_MESSAGE),
        'error',
      )
      return
    }

    if (remember.value) {
      localStorage.setItem('quinlist_remember_email', email.value.trim())
    } else {
      localStorage.removeItem('quinlist_remember_email')
    }

    await afterAuthSuccess()
  } finally {
    loading.value = false
  }
}

async function loginWithGoogle() {
  if (!isGoogleAuthConfigured()) {
    showNotice(
      'Google aún no está listo',
      'Agrega VITE_GOOGLE_CLIENT_ID en tu archivo .env (Client ID de Google Cloud, tipo Web) y reinicia npm run dev.',
      'info',
    )
    return
  }

  socialLoading.value = true
  try {
    const result = await auth.loginWithGoogle()
    if (!result.ok) {
      showNotice(
        'No pudimos conectar con Google',
        localizeAuthError(result.error, 'Inténtalo de nuevo en unos momentos.'),
        'error',
      )
      return
    }
    await afterAuthSuccess()
  } finally {
    socialLoading.value = false
  }
}

function openForgot() {
  showForgot.value = true
}
</script>

<template>
  <AuthLayout title="Inicia sesión" subtitle="¡Bienvenido! Elige cómo quieres entrar:">
    <div v-if="auth.useDatabase" class="mb-5 grid grid-cols-2 gap-3">
      <button
        type="button"
        class="auth-social-btn"
        :disabled="socialLoading || loading"
        title="Continuar con Google"
        @click="loginWithGoogle"
      >
        <Loader2 v-if="socialLoading" :size="18" class="animate-spin text-[#64748b]" />
        <svg v-else class="h-[18px] w-[18px]" viewBox="0 0 24 24">
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

    <div v-if="auth.useDatabase" class="auth-divider">
      <span>o continúa con email</span>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="relative">
        <Mail :size="17" class="auth-field-icon" />
        <input
          v-if="auth.useDatabase"
          v-model="email"
          type="email"
          placeholder="Email"
          required
          autocomplete="email"
          class="auth-field"
        />
        <select v-else v-model="email" class="auth-field pl-10">
          <option v-for="u in demoUsers" :key="u.email" :value="u.email">{{ u.name }}</option>
        </select>
      </div>

      <div v-if="auth.useDatabase" class="relative">
        <Lock :size="17" class="auth-field-icon" />
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Contraseña"
          required
          minlength="6"
          autocomplete="current-password"
          class="auth-field pr-10"
        />
        <button
          type="button"
          class="absolute top-1/2 right-3 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
          @click="showPassword = !showPassword"
        >
          <EyeOff v-if="showPassword" :size="17" />
          <Eye v-else :size="17" />
        </button>
      </div>

      <div v-if="auth.useDatabase" class="flex items-center justify-between text-sm">
        <label class="flex cursor-pointer items-center gap-2 text-[#64748b]">
          <input v-model="remember" type="checkbox" class="auth-checkbox" />
          Recordarme
        </label>
        <button
          type="button"
          class="font-medium text-[#2563eb] hover:underline"
          @click="openForgot"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <p v-if="!auth.useDatabase" class="text-xs text-[#94a3b8]">
        Modo demo · configura MatuDB en <code>.env</code> para login real.
      </p>

      <button type="submit" :disabled="loading || socialLoading" class="auth-submit">
        <Loader2 v-if="loading" :size="17" class="animate-spin" />
        Iniciar sesión
      </button>
    </form>

    <p class="mt-5 text-center text-sm text-[#64748b]">
      ¿No tienes cuenta?
      <RouterLink to="/register" class="font-semibold text-[#2563eb] hover:underline">
        Crear cuenta
      </RouterLink>
    </p>
  </AuthLayout>

  <ForgotPasswordModal
    :open="showForgot"
    :initial-email="email"
    @close="showForgot = false"
  />

  <AuthNoticeModal
    :open="noticeOpen"
    :title="noticeTitle"
    :message="noticeMessage"
    :variant="noticeVariant"
    @close="noticeOpen = false"
  />
</template>
