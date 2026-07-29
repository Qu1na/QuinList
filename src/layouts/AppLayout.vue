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
const hideGlobalNav = computed(() => route.name === 'project-detail')

onMounted(() => {
  notif.init()
})
</script>

<template>
  <RouterView v-if="isBoardRoute" />

  <div v-else class="flex h-screen flex-col overflow-hidden bg-[#f5f5f7]">
    <TrelloNav v-if="!hideGlobalNav" class="z-50 shrink-0" />
    <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <RouterView />
    </main>
    <CardModal />
    <AppModals />
    <RealtimeToast />
  </div>
</template>
