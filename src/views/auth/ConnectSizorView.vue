<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Loader2 } from '@lucide/vue'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { useProjectsStore } from '@/stores/projects'
import { setEmbedMode } from '@/config/features'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const quinlist = useQuinListStore()
const projectsStore = useProjectsStore()

const status = ref('Conectando con Sizor…')
const failed = ref(false)

function sizorBaseUrl() {
  const fromQuery = String(route.query.sizorUrl || '').trim()
  let raw = (fromQuery || import.meta.env.VITE_SIZOR_URL || 'https://sizor.online').replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && /^http:\/\//i.test(raw)) {
    raw = raw.replace(/^http:/i, 'https:')
  }
  if (/^http:\/\/(www\.)?sizor\.online/i.test(raw)) {
    raw = raw.replace(/^http:/i, 'https:')
  }
  return raw
}

async function exchangeAndSignIn() {
  const token = String(route.query.token || '')
  const companyId = String(route.query.companyId || '')
  const embed = String(route.query.embed || '0') === '1'

  if (!token || !companyId) {
    failed.value = true
    status.value = 'Falta token o companyId en la URL'
    return
  }

  setEmbedMode(embed)

  status.value = 'Validando acceso…'
  const res = await fetch(`${sizorBaseUrl()}/api/quinlist-sso`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, companyId }),
  })

  const payload = (await res.json().catch(() => ({}))) as {
    email?: string
    password?: string
    error?: string
  }
  if (!res.ok || !payload.email || !payload.password) {
    failed.value = true
    status.value = payload.error || 'No se pudo validar el acceso SSO'
    return
  }

  status.value = 'Iniciando sesión en QuinList…'
  const result = await auth.login(payload.email, payload.password)
  if (!result.ok) {
    failed.value = true
    status.value = result.error || 'No se pudo iniciar sesión'
    return
  }

  void quinlist.init().catch((err) => console.error('[conectar-sizor] quinlist:', err))
  if (!embed) {
    void projectsStore.init().catch((err) => console.error('[conectar-sizor] projects:', err))
  }

  await router.replace(embed ? '/app?embed=1' : '/app')
}

onMounted(async () => {
  try {
    await exchangeAndSignIn()
  } catch (e: unknown) {
    failed.value = true
    status.value = e instanceof Error ? e.message : 'Error al conectar con Sizor'
  }
})
</script>

<template>
  <AuthLayout
    title="Sizor × QuinList"
    subtitle="Abriendo tus tableros con los datos de Sizor."
  >
    <div class="flex flex-col items-center gap-4 py-6 text-center">
      <Loader2
        v-if="!failed"
        class="h-8 w-8 animate-spin text-blue-600"
      />
      <p class="text-sm text-slate-600">{{ status }}</p>
      <RouterLink
        v-if="failed"
        to="/login"
        class="text-sm font-medium text-blue-600 hover:underline"
      >
        Ir a iniciar sesión
      </RouterLink>
    </div>
  </AuthLayout>
</template>
