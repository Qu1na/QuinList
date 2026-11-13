<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Sparkles, Send } from '@lucide/vue'
import { useBillingStore } from '@/stores/billing'
import { useQuinListStore } from '@/stores/quinlist'
import { useProjectsStore } from '@/stores/projects'
import { sendAiMessage } from '@/services/billing'

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

const billing = useBillingStore()
const quinlist = useQuinListStore()
const projects = useProjectsStore()

const draft = ref('')
const sending = ref(false)
const error = ref('')
const turns = ref<ChatTurn[]>([])

const context = computed(() => {
  const lines: string[] = []
  const workspace = quinlist.currentWorkspace
  if (workspace) lines.push(`Espacio: ${workspace.name}`)
  for (const board of quinlist.workspaceBoards.slice(0, 12)) {
    const cards = quinlist.cards.filter((card) => card.boardId === board.id)
    const open = cards.filter((card) => !card.completed).slice(0, 8)
    lines.push(
      `Tablero «${board.title}»: ${cards.length} tarjetas, ${cards.filter((card) => card.completed).length} completadas.`,
    )
    for (const card of open) lines.push(`- ${card.title}`)
  }
  for (const project of projects.workspaceProjects(quinlist.currentWorkspaceId).slice(0, 12)) {
    const tasks = projects.getProjectTasks(project.id)
    lines.push(
      `Proyecto «${project.name}» (${project.status}): ${tasks.filter((task) => task.status !== 'done').length} tareas abiertas.`,
    )
  }
  return lines.join('\n').slice(0, 6000)
})

onMounted(() => {
  void billing.init()
  void projects.init()
})

async function send() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  if (!billing.isVip) {
    billing.openUpgrade('ai')
    return
  }
  error.value = ''
  turns.value.push({ role: 'user', content: text })
  draft.value = ''
  sending.value = true
  try {
    const reply = await sendAiMessage({
      messages: turns.value,
      context: context.value,
    })
    turns.value.push({ role: 'assistant', content: reply })
  } catch (err) {
    turns.value.pop()
    draft.value = text
    error.value = err instanceof Error ? err.message : 'No se pudo consultar la IA.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col px-6 py-6">
    <div class="mb-4">
      <p class="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#6554c0] uppercase">
        <Sparkles :size="14" />
        Asistente
      </p>
      <h1 class="mt-1 text-2xl font-bold text-[#172b4d]">IA de QuinList</h1>
      <p class="mt-1 text-sm text-[#626f86]">
        Pregunta sobre tus tableros y proyectos. Disponible en el plan VIP.
      </p>
    </div>

    <div
      v-if="!billing.isVip"
      class="rounded-2xl border border-[#091e4221] bg-white p-6 shadow-sm"
    >
      <p class="text-sm leading-relaxed text-[#44546f]">
        El plan Gratis no incluye el asistente. Con VIP puedes pedirle que resuma el trabajo,
        proponga el siguiente paso o ordene tareas, además de crear tableros y proyectos sin límite.
      </p>
      <button type="button" class="btn-brand mt-4" @click="billing.openUpgrade('ai')">
        Ver plan VIP
      </button>
    </div>

    <template v-else>
      <div class="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#091e4221] bg-white p-4">
        <p v-if="turns.length === 0" class="text-sm text-[#626f86]">
          Por ejemplo: «¿Qué tareas siguen abiertas en este espacio?»
        </p>
        <div
          v-for="(turn, index) in turns"
          :key="index"
          class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
          :class="
            turn.role === 'user'
              ? 'ml-auto bg-[#0c66e4] text-white'
              : 'bg-[#f5f5f7] text-[#172b4d]'
          "
        >
          {{ turn.content }}
        </div>
        <p v-if="sending" class="text-sm text-[#626f86]">Pensando…</p>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>

      <form class="mt-3 flex gap-2" @submit.prevent="send">
        <input
          v-model="draft"
          type="text"
          class="flex-1 rounded-xl border border-[#091e4221] px-4 py-3 text-sm text-[#172b4d] outline-none focus:border-[#388bff]"
          placeholder="Escribe tu pregunta"
          :disabled="sending"
        />
        <button type="submit" class="btn-brand" :disabled="sending || !draft.trim()">
          <Send :size="16" />
        </button>
      </form>
    </template>
  </div>
</template>
