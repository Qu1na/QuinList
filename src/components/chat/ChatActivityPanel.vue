<script setup lang="ts">
import { computed, ref } from 'vue'
import { AtSign, Bell } from '@lucide/vue'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'
import RelativeTime from '@/components/ui/RelativeTime.vue'
import { messagePreview } from '@/utils/renderMentions'
import type { Notification } from '@/types'

const props = defineProps<{
  projectId?: string
  boardId?: string
  channelName?: string
}>()

const emit = defineEmits<{
  selectMessage: [messageId: string]
}>()

type ActivityTab = 'all' | 'mentions'

const tab = ref<ActivityTab>('all')
const unreadOnly = ref(false)

const notif = useNotificationStore()
const auth = useAuthStore()
const { users } = storeToRefs(auth)

const scopedNotifications = computed(() => {
  return notif.userNotifications.filter((n) => {
    if (props.projectId && n.metadata?.projectId === props.projectId) return true
    if (props.boardId && n.metadata?.boardId === props.boardId) return true
    return false
  })
})

const filtered = computed(() => {
  let list = scopedNotifications.value
  if (tab.value === 'mentions') {
    list = list.filter((n) => n.type === 'mention' || n.type === 'project_chat')
  }
  if (unreadOnly.value) {
    list = list.filter((n) => !n.read)
  }
  return list.slice(0, 30)
})

const unreadMentions = computed(
  () =>
    scopedNotifications.value.filter(
      (n) => !n.read && (n.type === 'mention' || n.type === 'project_chat'),
    ).length,
)

function actorId(n: Notification): string | undefined {
  const msg = n.message
  const match = msg.match(/^([^:]+):/)
  if (!match?.[1]) return undefined
  const name = match[1].trim()
  const user = users.value.find((u) => u.name === name)
  return user?.id
}

function previewText(n: Notification): string {
  const msg = n.message
  const colon = msg.indexOf(':')
  if (colon !== -1 && n.type === 'project_chat') {
    return messagePreview(msg.slice(colon + 1).trim())
  }
  return messagePreview(msg)
}

function handleClick(n: Notification) {
  notif.markAsRead(n.id)
}
</script>

<template>
  <aside class="chat-activity">
    <header class="chat-activity__head">
      <h3 class="chat-activity__title">Actividad</h3>
    </header>

    <div class="chat-activity__tabs">
      <button
        type="button"
        class="chat-activity__tab"
        :class="{ 'chat-activity__tab--active': tab === 'all' }"
        @click="tab = 'all'"
      >
        Todo
      </button>
      <button
        type="button"
        class="chat-activity__tab"
        :class="{ 'chat-activity__tab--active': tab === 'mentions' }"
        @click="tab = 'mentions'"
      >
        <AtSign :size="13" />
        Menciones
        <span v-if="unreadMentions" class="chat-activity__badge">{{ unreadMentions }}</span>
      </button>
    </div>

    <label class="chat-activity__filter">
      <input v-model="unreadOnly" type="checkbox" />
      <span>Solo no leídas</span>
    </label>

    <div class="chat-activity__list scroll-thin">
      <button
        v-for="n in filtered"
        :key="n.id"
        type="button"
        class="chat-activity__item"
        :class="{ 'chat-activity__item--unread': !n.read }"
        @click="handleClick(n)"
      >
        <UserAvatar
          v-if="actorId(n)"
          :user-id="actorId(n)!"
          size="sm"
          class="chat-activity__avatar"
        />
        <span v-else class="chat-activity__icon-wrap">
          <Bell :size="16" />
        </span>

        <div class="chat-activity__body">
          <p class="chat-activity__line">
            <AtSign v-if="n.type === 'mention'" :size="12" class="chat-activity__at" />
            <span class="chat-activity__label">{{ n.title }}</span>
          </p>
          <p class="chat-activity__preview">
            <template v-if="channelName">en #{{ channelName }} · </template>
            {{ previewText(n) }}
          </p>
          <RelativeTime :iso="n.createdAt" class="chat-activity__time" />
        </div>

        <span v-if="!n.read" class="chat-activity__dot" aria-label="No leída" />
      </button>

      <p v-if="!filtered.length" class="chat-activity__empty">
        {{ tab === 'mentions' ? 'Sin menciones' : 'Sin actividad' }}
      </p>
    </div>
  </aside>
</template>

<style scoped>
.chat-activity {
  display: none;
  width: 16.5rem;
  flex-shrink: 0;
  flex-direction: column;
  border-right: 1px solid var(--ql-chat-border, rgba(9, 30, 66, 0.1));
  background: var(--ql-chat-surface, #fff);
}

@media (min-width: 900px) {
  .chat-activity {
    display: flex;
  }
}

.chat-activity__head {
  padding: 1rem 1rem 0.5rem;
}

.chat-activity__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--ql-chat-ink, #172b4d);
}

.chat-activity__tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0 0.75rem 0.5rem;
  border-bottom: 1px solid #f0f1f3;
}

.chat-activity__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #616061;
  transition: background 0.12s ease, color 0.12s ease;
}

.chat-activity__tab--active {
  background: var(--ql-chat-mention-bg, rgba(45, 126, 184, 0.14));
  color: var(--ql-chat-primary, #2d7eb8);
}

.chat-activity__badge {
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1rem;
  text-align: center;
  color: #fff;
  background: var(--ql-chat-coral, #f4845f);
}

.chat-activity__filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.75rem;
  color: #616061;
  border-bottom: 1px solid #f0f1f3;
}

.chat-activity__list {
  flex: 1;
  overflow-y: auto;
}

.chat-activity__item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #f8f8f8;
  transition: background 0.12s ease;
}

.chat-activity__item:hover {
  background: #f8f8f8;
}

.chat-activity__item--unread {
  background: rgba(91, 188, 228, 0.08);
}

.chat-activity__avatar,
.chat-activity__icon-wrap {
  margin-top: 0.125rem;
}

.chat-activity__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  background: #f0f1f3;
  color: #616061;
}

.chat-activity__body {
  min-width: 0;
}

.chat-activity__line {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1d1c1d;
}

.chat-activity__at {
  color: var(--ql-chat-primary, #2d7eb8);
  flex-shrink: 0;
}

.chat-activity__preview {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #616061;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.chat-activity__time {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  color: #8b8b8b;
}

.chat-activity__dot {
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 0.375rem;
  border-radius: 999px;
  background: var(--ql-chat-sky, #5bbce4);
}

.chat-activity__empty {
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: #8b8b8b;
}
</style>
