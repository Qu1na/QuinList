<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Smile, Plus } from '@lucide/vue'
import { useReactionsStore } from '@/stores/reactions'
import { useAuthStore } from '@/stores/auth'
import type { Reaction } from '@/types/v3'

const props = defineProps<{
  entityType: Reaction['entityType']
  entityId: string
}>()

const reactions = useReactionsStore()
const auth = useAuthStore()
const showPicker = ref(false)

onMounted(() => {
  reactions.load(props.entityType, props.entityId)
})

const summary = computed(() => reactions.summary(props.entityType, props.entityId))

function toggle(emoji: string) {
  if (!auth.currentUserId) return
  reactions.toggle(props.entityType, props.entityId, emoji)
  showPicker.value = false
}

function userNames(userIds: string[]): string {
  if (userIds.length === 1) return '1 persona'
  if (userIds.length <= 3) return `${userIds.length} personas`
  return `${userIds.length}`
}
</script>

<template>
  <div class="relative flex flex-wrap items-center gap-1">
    <button
      v-for="s in summary"
      :key="s.emoji"
      class="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition"
      :class="
        reactions.hasReacted(props.entityType, props.entityId, s.emoji)
          ? 'border-blue-300 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      "
      :title="userNames(s.userIds)"
      @click="toggle(s.emoji)"
    >
      <span>{{ s.emoji }}</span>
      <span class="font-medium">{{ s.count }}</span>
    </button>
    <div class="relative">
      <button
        class="flex items-center gap-1 rounded-full border border-dashed border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
        @click="showPicker = !showPicker"
      >
        <Smile :size="12" /> <Plus :size="10" />
      </button>
      <div
        v-if="showPicker"
        class="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-lg"
      >
        <button
          v-for="emoji in reactions.quickReactions"
          :key="emoji"
          class="rounded-full px-2 py-1 text-base transition hover:bg-slate-100"
          :class="{
            'bg-blue-100': reactions.hasReacted(props.entityType, props.entityId, emoji),
          }"
          @click="toggle(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>