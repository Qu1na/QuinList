<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2 } from '@lucide/vue'
import { useQuinListStore } from '@/stores/quinlist'
import { formatDate } from '@/utils/permissions'

const store = useQuinListStore()
const router = useRouter()

const completedCards = computed(() =>
  store
    .getWorkspaceCards()
    .filter((c) => c.completed)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
)
</script>

<template>
  <div class="p-6">
    <h1 class="mb-2 text-2xl font-bold text-slate-800">Releases</h1>
    <p class="mb-6 text-sm text-slate-500">Tareas completadas recientemente</p>

    <div v-if="completedCards.length === 0" class="rounded-xl border border-slate-200 bg-white py-12 text-center text-slate-400">
      Aún no hay releases
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="card in completedCards"
        :key="card.id"
        class="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-green-200"
        @click="router.push(`/board/${card.boardId}`)"
      >
        <CheckCircle2 :size="20" class="shrink-0 text-green-500" />
        <div class="flex-1">
          <p class="font-medium text-slate-600 line-through">{{ card.title }}</p>
          <p class="text-xs text-slate-400">Completada · {{ formatDate(card.updatedAt.split('T')[0] ?? card.updatedAt) }}</p>
        </div>
      </button>
    </div>
  </div>
</template>
