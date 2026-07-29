<script setup lang="ts">
import { computed } from 'vue'
import { Circle } from '@lucide/vue'
import AppWindowPanel from '@/components/ui/AppWindowPanel.vue'
import { useBoardPresenceStore } from '@/stores/boardPresence'
import { useBoardShareStore } from '@/stores/boardShare'
import { useAuthStore } from '@/stores/auth'
import { isPresenceActive } from '@/services/boardPresence'

const presence = useBoardPresenceStore()
const boardShare = useBoardShareStore()
const auth = useAuthStore()

const AVATAR_COLORS = ['#6554c0', '#0c66e4', '#e56910', '#61bd4f', '#cd5a91', '#00c2e0', '#c377e0']

function avatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]!
}

interface MemberRow {
  userId: string
  name: string
  email: string
  initials: string
  roleLabel: string
  status: 'online' | 'editing' | 'offline'
  activity: string
}

const rows = computed((): MemberRow[] => {
  const participants = boardShare.participants
  const byUser = new Map(participants.map((p) => [p.user.id, p]))

  const allUserIds = new Set<string>([
    ...participants.map((p) => p.user.id),
    ...presence.activeEntries.map((e) => e.userId),
  ])

  return [...allUserIds].map((userId) => {
    const participant = byUser.get(userId)
    const user = participant?.user ?? auth.getUserById(userId)
    const entry = presence.getUserPresence(userId)
    const active = entry && isPresenceActive(entry.lastSeen)

    const status: MemberRow['status'] = active ? entry!.status : 'offline'

    return {
      userId,
      name: user?.name ?? 'Usuario',
      email: user?.email ?? '',
      initials: user?.initials ?? '?',
      roleLabel: participant?.roleLabel ?? 'Invitado',
      status,
      activity: active ? entry!.activity : '',
    }
  }).sort((a, b) => {
    const order: Record<MemberRow['status'], number> = { editing: 0, online: 1, offline: 2 }
    return order[a.status] - order[b.status] || a.name.localeCompare(b.name)
  })
})

function statusLabel(row: MemberRow): string {
  if (row.status === 'editing') {
    return row.activity || 'Editando'
  }
  if (row.status === 'online') return 'En línea'
  return 'Desconectado'
}

function statusColor(row: MemberRow): string {
  if (row.status === 'editing') return 'text-amber-600'
  if (row.status === 'online') return 'text-emerald-600'
  return 'text-[#626f86]'
}

function dotColor(row: MemberRow): string {
  if (row.status === 'editing') return 'bg-amber-500'
  if (row.status === 'online') return 'bg-emerald-500'
  return 'bg-[#091e4221]'
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="presence.showPanel"
      class="app-window-overlay fixed inset-0 z-[2000] flex justify-end"
      @click.self="presence.closePanel()"
    >
      <AppWindowPanel
        title="Actividad del equipo"
        subtitle="En tiempo real"
        max-width="sm"
        @close="presence.closePanel()"
      >
        <div class="mb-4 grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-emerald-50 px-3 py-2.5">
            <p class="text-2xl font-bold text-emerald-700">{{ presence.onlineCount }}</p>
            <p class="text-xs text-emerald-800">En línea</p>
          </div>
          <div class="rounded-lg bg-amber-50 px-3 py-2.5">
            <p class="text-2xl font-bold text-amber-700">{{ presence.editingCount }}</p>
            <p class="text-xs text-amber-800">Editando</p>
          </div>
        </div>

        <div class="scroll-thin min-h-0 flex-1 overflow-y-auto">
          <p
            v-if="presence.loading"
            class="px-2 py-8 text-center text-sm text-[#626f86]"
          >
            Cargando actividad…
          </p>

          <ul v-else class="space-y-1">
            <li
              v-for="row in rows"
              :key="row.userId"
              class="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-[#091e420a]"
            >
              <div class="relative shrink-0">
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                  :style="{ background: avatarColor(row.userId) }"
                >
                  {{ row.initials }}
                </span>
                <span
                  class="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white"
                  :class="dotColor(row)"
                />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-semibold text-[#172b4d]">{{ row.name }}</p>
                  <span class="shrink-0 rounded-full bg-[#091e420f] px-2 py-0.5 text-[10px] text-[#626f86]">
                    {{ row.roleLabel }}
                  </span>
                </div>
                <p class="truncate text-xs" :class="statusColor(row)">
                  <Circle :size="8" class="mr-1 inline fill-current" />
                  {{ statusLabel(row) }}
                </p>
              </div>
            </li>

            <li
              v-if="rows.length === 0"
              class="px-2 py-8 text-center text-sm text-[#626f86]"
            >
              No hay miembros en este tablero
            </li>
          </ul>
        </div>
      </AppWindowPanel>
    </div>
  </Teleport>
</template>
