<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Link2, Copy, Clock, Ban } from '@lucide/vue'
import {
  buildProjectShareUrl,
  createProjectShareLink,
  getProjectShareLinks,
  revokeProjectShareLink,
  subscribeProjectShareRealtime,
} from '@/services/projectShare'
import type { ProjectShareLink } from '@/types/projects'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ projectId: string }>()

const auth = useAuthStore()
const links = ref<ProjectShareLink[]>([])
const loading = ref(false)
const creating = ref(false)
const expiryMinutes = ref(60)
const copiedId = ref<string | null>(null)
let unsubscribeRealtime: (() => void) | null = null

async function refresh() {
  loading.value = true
  try {
    links.value = await getProjectShareLinks(props.projectId)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void refresh()
  unsubscribeRealtime = subscribeProjectShareRealtime(() => {
    void refresh()
  })
})

onUnmounted(() => {
  unsubscribeRealtime?.()
})

async function createLink() {
  if (!auth.currentUserId) return
  creating.value = true
  try {
    await createProjectShareLink(props.projectId, auth.currentUserId, {
      expiresInMinutes: expiryMinutes.value > 0 ? expiryMinutes.value : null,
      role: 'viewer',
    })
    await refresh()
  } finally {
    creating.value = false
  }
}

async function copyLink(link: ProjectShareLink) {
  const url = buildProjectShareUrl(link.token)
  await navigator.clipboard.writeText(url)
  copiedId.value = link.id
  setTimeout(() => {
    copiedId.value = null
  }, 2000)
}

async function revoke(linkId: string) {
  await revokeProjectShareLink(linkId)
  await refresh()
}

function formatExpiry(link: ProjectShareLink) {
  if (!link.expiresAt) return 'Sin expiración'
  const d = new Date(link.expiresAt)
  if (d.getTime() < Date.now()) return 'Expirado'
  return `Expira ${d.toLocaleString('es')}`
}
</script>

<template>
  <section class="project-card project-card--lg">
    <div class="mb-5 flex items-start gap-3">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef6fc] text-[#2d7eb8]">
        <Link2 :size="20" />
      </div>
      <div>
        <h3 class="text-base font-semibold text-[#172b4d]">Compartir proyecto</h3>
        <p class="mt-0.5 text-sm text-[#626f86]">
          Genera un enlace de solo lectura para clientes o stakeholders.
        </p>
      </div>
    </div>

    <div class="mb-5 flex flex-wrap items-end gap-3">
      <label class="text-sm">
        <span class="mb-1.5 block font-medium text-[#44546f]">Duración del enlace</span>
        <select v-model.number="expiryMinutes" class="ql-input w-auto min-w-[180px]">
          <option :value="60">1 hora</option>
          <option :value="360">6 horas</option>
          <option :value="1440">24 horas</option>
          <option :value="10080">7 días</option>
          <option :value="0">Sin expiración</option>
        </select>
      </label>
      <button type="button" class="ql-btn ql-btn--primary" :disabled="creating" @click="createLink">
        Generar enlace
      </button>
    </div>

    <div v-if="loading" class="text-sm text-[#626f86]">Cargando enlaces...</div>

    <div v-else-if="links.length" class="space-y-2">
      <div
        v-for="link in links"
        :key="link.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ebebed] bg-[#fafafa] px-4 py-3"
      >
        <div class="min-w-0">
          <p class="truncate font-mono text-xs text-[#44546f]">{{ buildProjectShareUrl(link.token) }}</p>
          <p class="mt-1 flex items-center gap-1.5 text-xs text-[#626f86]">
            <Clock :size="12" />
            {{ formatExpiry(link) }}
            <span v-if="!link.enabled" class="font-medium text-red-600">· Desactivado</span>
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="link.enabled"
            type="button"
            class="ql-btn ql-btn--ghost py-1.5 text-sm"
            @click="copyLink(link)"
          >
            <Copy :size="16" />
            {{ copiedId === link.id ? 'Copiado' : 'Copiar' }}
          </button>
          <button
            v-if="link.enabled"
            type="button"
            class="ql-btn ql-btn--ghost py-1.5 text-sm text-red-600 hover:bg-red-50"
            @click="revoke(link.id)"
          >
            <Ban :size="16" />
            Revocar
          </button>
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-[#626f86]">Aún no hay enlaces compartidos para este proyecto.</p>
  </section>
</template>
