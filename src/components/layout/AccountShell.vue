<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, BarChart3, Users, LogOut } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useQuinListStore } from '@/stores/quinlist'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useQuinListStore()

const nav = [
  { id: 'settings', label: 'Perfil', to: '/app/settings', icon: User },
  { id: 'reports', label: 'Métricas', to: '/app/reports', icon: BarChart3 },
  { id: 'team', label: 'Equipo', to: '/app/team', icon: Users },
]

const pageTitle = computed(() => {
  if (route.name === 'reports') return 'Centro de métricas'
  if (route.name === 'team') return 'Equipo'
  return 'Mi Perfil'
})

async function logout() {
  const { useNotificationStore } = await import('@/stores/notifications')
  useNotificationStore().destroy()
  store.destroy()
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6 md:px-6">
    <nav class="mb-6 flex gap-1 overflow-x-auto border-b border-[#091e4214] pb-0 md:hidden">
      <RouterLink
        v-for="item in nav"
        :key="item.id"
        :to="item.to"
        class="shrink-0 border-b-2 px-3 py-2 text-sm transition-colors"
        :class="
          route.path === item.to
            ? 'border-[#0c66e4] font-medium text-[#0c66e4]'
            : 'border-transparent text-[#626f86]'
        "
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="flex min-h-[calc(100vh-3rem)] gap-0 md:gap-8">
      <aside class="hidden w-56 shrink-0 md:block">
        <p class="mb-3 px-3 text-[11px] font-semibold tracking-wide text-[#626f86] uppercase">
          Cuenta
        </p>
        <div class="mb-4 flex items-center gap-3 px-3 py-2">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6554c0] text-sm font-bold text-white"
        >
          {{ auth.currentUser?.initials }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-[#172b4d]">{{ auth.currentUser?.name }}</p>
          <p class="truncate text-xs text-[#626f86]">{{ auth.currentUser?.email }}</p>
        </div>
      </div>

      <p class="mb-2 mt-6 px-3 text-[11px] font-semibold tracking-wide text-[#626f86] uppercase">
        QuinList
      </p>
      <nav class="space-y-0.5">
        <RouterLink
          v-for="item in nav"
          :key="item.id"
          :to="item.to"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
          :class="
            route.path === item.to || route.name === item.id
              ? 'bg-[#091e420f] font-medium text-[#172b4d]'
              : 'text-[#44546f] hover:bg-[#091e420a]'
          "
        >
          <component :is="item.icon" :size="16" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="mt-6 border-t border-[#091e4214] pt-4">
        <button
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#44546f] hover:bg-[#091e420a]"
          @click="logout"
        >
          <LogOut :size="16" />
          Cerrar sesión
        </button>
      </div>
      </aside>

      <main class="min-w-0 flex-1">
        <slot name="header">
          <h1 class="mb-1 text-2xl font-semibold text-[#172b4d]">{{ pageTitle }}</h1>
          <p class="mb-6 text-sm text-[#626f86]">{{ store.currentWorkspace?.name }}</p>
        </slot>
        <slot />
      </main>
    </div>
  </div>
</template>
