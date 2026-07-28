<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2, AlertCircle } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'
import { acceptBoardInvite, InviteError } from '@/services/boardShare'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useQuinListStore()

const loading = ref(true)
const error = ref('')
const errorCode = ref('')

onMounted(async () => {
  const boardSlug = route.params.boardSlug as string
  const token = route.params.token as string

  if (!auth.isAuthenticated) {
    sessionStorage.setItem('quinlist_redirect', route.fullPath)
    router.replace({ name: 'login' })
    return
  }

  if (!auth.currentUserId || !auth.currentUser?.email) {
    error.value = 'Debes iniciar sesión para aceptar la invitación'
    loading.value = false
    return
  }

  try {
    const result = await acceptBoardInvite(
      boardSlug,
      token,
      auth.currentUserId,
      auth.currentUser.email,
    )
    store.setBoardRole(result.boardId, result.role)
    await store.reloadFromDb()
    router.replace({ name: 'board', params: { boardId: result.boardId } })
  } catch (err) {
    if (err instanceof InviteError) {
      error.value = err.message
      errorCode.value = err.code
    } else {
      error.value = err instanceof Error ? err.message : 'No se pudo aceptar la invitación'
    }
    loading.value = false
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#0747a6] p-6">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
      <Loader2 v-if="loading" :size="32" class="mx-auto animate-spin text-[#0c66e4]" />
      <template v-else>
        <AlertCircle :size="40" class="mx-auto text-red-400" />
        <h1 class="mt-4 text-lg font-bold text-[#172b4d]">
          {{
            errorCode === 'expired'
              ? 'Enlace expirado'
              : errorCode === 'email_mismatch'
                ? 'Correo no autorizado'
                : 'No se pudo unir al tablero'
          }}
        </h1>
        <p class="mt-2 text-sm text-[#626f86]">{{ error }}</p>
        <button
          class="mt-6 rounded-lg bg-[#0c66e4] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0055cc]"
          @click="router.push({ name: 'home' })"
        >
          Ir al inicio
        </button>
      </template>
    </div>
  </div>
</template>
