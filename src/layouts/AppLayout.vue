<script setup lang="ts">
import { computed } from 'vue'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TrelloNav from '@/components/layout/TrelloNav.vue'
import CardModal from '@/components/board/CardModal.vue'
import AppModals from '@/components/ui/AppModals.vue'
import RealtimeToast from '@/components/layout/RealtimeToast.vue'
import { useNotificationStore } from '@/stores/notifications'

const route = useRoute()
const notif = useNotificationStore()

const isBoardRoute = computed(() => route.name === 'board')

onMounted(() => {
  notif.init()
})
</script>

<template>
  <RouterView v-if="isBoardRoute" />

  <div v-else class="flex min-h-screen flex-col bg-[#f9fafc]">
    <TrelloNav class="sticky top-0 z-50 shrink-0" />
    <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <RouterView />
    </main>
    <CardModal />
    <AppModals />
    <RealtimeToast />
  </div>
</template>
