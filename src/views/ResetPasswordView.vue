<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Eye, EyeOff, Loader2, Lock } from '@lucide/vue'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { localizeAuthError } from '@/utils/authMessages'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref(false)

const token = computed(() => {
  const q = route.query.token
  return typeof q === 'string' ? q : Array.isArray(q) ? q[0] ?? '' : ''
})

onMounted(() => document.documentElement.classList.add('auth-screen'))
onUnmounted(() => document.documentElement.classList.remove('auth-screen'))

async function submit() {
  error.value = ''
  if (!token.value) {
    error.value = 'Falta el enlace de recuperación. Solicita uno nuevo desde el login.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  loading.value = true
  try {
    const result = await auth.resetPasswordWithToken(token.value, password.value)
    if (!result.ok) {
      error.value = localizeAuthError(
        result.error,
        'No pudimos actualizar la contraseña. Solicita un enlace nuevo.',
      )
      return
    }
    success.value = true
    setTimeout(() => router.push({ name: 'login' }), 1800)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
    title="Nueva contraseña"
    subtitle="Elige una contraseña segura para tu cuenta."
  >
    <div
      v-if="success"
      class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      Contraseña actualizada. Te llevamos al inicio de sesión…
    </div>

    <form v-else class="space-y-4" @submit.prevent="submit">
      <p v-if="!token" class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Este enlace no incluye un token válido. Vuelve al login y solicita uno nuevo.
      </p>

      <div class="relative">
        <Lock :size="17" class="auth-field-icon" />
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Nueva contraseña"
          required
          minlength="6"
          autocomplete="new-password"
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

      <div class="relative">
        <Lock :size="17" class="auth-field-icon" />
        <input
          v-model="confirm"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Confirmar contraseña"
          required
          minlength="6"
          autocomplete="new-password"
          class="auth-field"
        />
      </div>

      <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error }}</p>

      <button type="submit" :disabled="loading || !token" class="auth-submit">
        <Loader2 v-if="loading" :size="17" class="animate-spin" />
        Guardar contraseña
      </button>
    </form>

    <p class="mt-5 text-center text-sm text-[#64748b]">
      <RouterLink to="/login" class="font-semibold text-[#2563eb] hover:underline">
        Volver al inicio de sesión
      </RouterLink>
    </p>
  </AuthLayout>
</template>
