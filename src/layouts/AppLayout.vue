<script setup lang="ts">
import { computed } from 'vue'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TrelloNav from '@/components/layout/TrelloNav.vue'
import CardModal from '@/components/board/CardModal.vue'
import AppModals from '@/components/ui/AppModals.vue'
import RealtimeToast from '@/components/layout/RealtimeToast.vue'
import CollaborationToasts from '@/components/layout/CollaborationToasts.vue'
import { useNotificationStore } from '@/stores/notifications'
import { useQuinListStore } from '@/stores/quinlist'

const route = useRoute()
const notif = useNotificationStore()
const store = useQuinListStore()

const isBoardRoute = computed(() => route.name === 'board')

onMounted(() => {
  notif.init()
})
</script>

<template>
  <RouterView v-if="isBoardRoute" />

  <div
    v-else-if="!store.isReady"
    class="flex h-screen flex-col items-center justify-center gap-3 bg-[#f5f5f7]"
  >
    <div
      class="h-9 w-9 animate-spin rounded-full border-2 border-[#5bbce4] border-t-transparent"
      aria-hidden="true"
    />
    <p class="text-sm text-[#626f86]">Cargando workspace…</p>
  </div>

  <div v-else class="flex h-screen flex-col overflow-hidden bg-[#f5f5f7]">
    <TrelloNav class="z-50 shrink-0" />
    <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <RouterView />
    </main>
    <CardModal />
    <AppModals />
    <CollaborationToasts />
    <RealtimeToast />
  </div>
</template>
