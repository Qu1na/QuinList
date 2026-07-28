<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LayoutGrid, Radio, Shield, Loader2 } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { REDIRECT_KEY } from '@/router'

const auth = useAuthStore()
const store = useQuinListStore()
const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const email = ref('alula@quinlist.app')
const password = ref('')
const name = ref('')
const error = ref('')
const loading = ref(false)

const demoUsers = [
  { email: 'alula@quinlist.app', name: 'Alula García (Propietario)' },
  { email: 'carlos@quinlist.app', name: 'Carlos Mendoza (Admin)' },
  { email: 'sofia@quinlist.app', name: 'Sofía Herrera (Observador)' },
]

const features = [
  { icon: LayoutGrid, label: 'Tableros Kanban' },
  { icon: Radio, label: 'Tiempo real' },
  { icon: Shield, label: 'Permisos' },
]

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'register') {
      if (!name.value.trim()) {
        error.value = 'Ingresa tu nombre'
        return
      }
      const result = await auth.register(email.value, password.value, name.value)
      if (!result.ok) {
        error.value = result.error ?? 'No se pudo crear la cuenta'
        return
      }
    } else {
      const result = await auth.login(email.value, password.value)
      if (!result.ok) {
        error.value = result.error ?? 'Credenciales inválidas'
        return
      }
    }

    await store.init()

    const redirect = sessionStorage.getItem(REDIRECT_KEY)
    if (redirect) {
      sessionStorage.removeItem(REDIRECT_KEY)
      router.push(redirect)
    } else {
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1c33] via-[#1a2b4a] to-[#1e3a5f] p-8"
  >
    <div class="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl">
      <div class="mb-8 text-center">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl font-extrabold text-white"
        >
          Q
        </div>
        <h1 class="text-2xl font-bold text-slate-800">QuinList</h1>
        <p class="mt-1 text-sm text-slate-500">Gestión de proyectos para equipos LATAM</p>
      </div>

      <div class="mb-6 flex rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
          :class="mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'"
          @click="mode = 'login'"
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          class="flex-1 rounded-md py-2 text-sm font-medium transition-colors"
          :class="mode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'"
          @click="mode = 'register'"
        >
          Crear cuenta
        </button>
      </div>

      <form @submit.prevent="submit">
        <label
          v-if="mode === 'register'"
          class="mb-4 block text-sm font-semibold text-slate-700"
        >
          Nombre completo
          <input
            v-model="name"
            type="text"
            placeholder="Tu nombre"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
          />
        </label>

        <label class="mb-4 block text-sm font-semibold text-slate-700">
          Correo electrónico
          <input
            v-if="auth.useDatabase"
            v-model="email"
            type="email"
            placeholder="tu@empresa.com"
            required
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
          />
          <select
            v-else
            v-model="email"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option v-for="u in demoUsers" :key="u.email" :value="u.email">
              {{ u.name }}
            </option>
          </select>
        </label>

        <label v-if="auth.useDatabase" class="mb-4 block text-sm font-semibold text-slate-700">
          Contraseña
          <input
            v-model="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            minlength="6"
            class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
          />
        </label>

        <p v-if="error" class="mb-2 text-sm text-red-500">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-base font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-60"
        >
          <Loader2 v-if="loading" :size="18" class="animate-spin" />
          {{ mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión' }}
        </button>
      </form>

      <p v-if="!auth.useDatabase" class="mt-4 text-center text-xs text-slate-400">
        Modo demo (localStorage). Configura MatuDB en <code class="text-slate-500">.env</code> para
        login real.
      </p>

      <div class="mt-6 flex justify-center gap-4">
        <span
          v-for="feat in features"
          :key="feat.label"
          class="flex items-center gap-1 text-xs text-slate-400"
        >
          <component :is="feat.icon" :size="14" />
          {{ feat.label }}
        </span>
      </div>
    </div>
  </div>
</template>
