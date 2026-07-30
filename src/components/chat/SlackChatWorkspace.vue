<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, Users, Headphones, FileText, MessageSquare } from '@lucide/vue'
import ChatActivityPanel from '@/components/chat/ChatActivityPanel.vue'
import ChatImageLightbox from '@/components/chat/ChatImageLightbox.vue'
import './chat-theme.css'

defineProps<{
  workspaceTitle: string
  channelName: string
  memberCount?: number
  projectId?: string
  boardId?: string
  showActivity?: boolean
}>()

const messagesEl = ref<HTMLElement | null>(null)

defineExpose({ messagesEl })
</script>

<template>
  <div class="ql-chat-workspace">
    <aside class="ql-chat-workspace__channels">
      <div class="ql-chat-workspace__channels-head">
        <div class="ql-chat-workspace__brand">
          <span class="ql-chat-workspace__brand-icon">
            <MessageSquare :size="16" />
          </span>
          <p class="ql-chat-workspace__workspace">{{ workspaceTitle }}</p>
        </div>
        <p class="ql-chat-workspace__channels-label">Canales</p>
      </div>
      <nav class="ql-chat-workspace__channels-nav scroll-thin">
        <slot name="channels" />
      </nav>
    </aside>

    <ChatActivityPanel
      v-if="showActivity !== false"
      :project-id="projectId"
      :board-id="boardId"
      :channel-name="channelName"
    />

    <main class="ql-chat-workspace__main">
      <header class="ql-chat-workspace__header">
        <div class="ql-chat-workspace__channel-title">
          <h2>
            <span class="ql-chat-workspace__hash">#</span>{{ channelName }}
          </h2>
          <ChevronDown :size="15" class="ql-chat-workspace__chevron" />
        </div>
        <slot name="header-subtitle" />

        <div class="ql-chat-workspace__header-actions">
          <button type="button" class="ql-chat-workspace__header-btn" title="Miembros del canal">
            <Users :size="15" />
            <span v-if="memberCount" class="ql-chat-workspace__header-count">{{ memberCount }}</span>
          </button>
          <button type="button" class="ql-chat-workspace__header-btn" title="Audio" disabled>
            <Headphones :size="15" />
          </button>
          <button type="button" class="ql-chat-workspace__header-btn" title="Archivos" disabled>
            <FileText :size="15" />
          </button>
          <slot name="header-actions" />
        </div>
      </header>

      <div ref="messagesEl" class="ql-chat-workspace__messages scroll-thin">
        <slot />
      </div>

      <footer class="ql-chat-workspace__footer">
        <slot name="composer" />
      </footer>
    </main>

    <ChatImageLightbox />
  </div>
</template>

<style scoped>
.ql-chat-workspace {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border-radius: var(--ql-chat-radius);
  border: 1px solid var(--ql-chat-border);
  background: var(--ql-chat-surface);
  box-shadow: var(--ql-chat-shadow);
}

.ql-chat-workspace__channels {
  display: none;
  width: 13.75rem;
  flex-shrink: 0;
  flex-direction: column;
  background: linear-gradient(180deg, var(--ql-chat-sidebar) 0%, var(--ql-chat-sidebar-deep) 100%);
  color: #fff;
}

@media (min-width: 768px) {
  .ql-chat-workspace__channels {
    display: flex;
  }
}

.ql-chat-workspace__channels-head {
  padding: 1rem 0.875rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.ql-chat-workspace__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.ql-chat-workspace__brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, var(--ql-chat-sky) 0%, var(--ql-chat-primary) 100%);
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(45, 126, 184, 0.35);
}

.ql-chat-workspace__workspace {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 800;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ql-chat-workspace__channels-label {
  margin: 0.75rem 0 0;
  padding-left: 0.125rem;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.ql-chat-workspace__channels-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.625rem 0.75rem;
}

.ql-chat-workspace__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  background: var(--ql-chat-surface);
}

.ql-chat-workspace__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--ql-chat-border);
  background: linear-gradient(180deg, #fff 0%, #fafcfe 100%);
  flex-shrink: 0;
}

.ql-chat-workspace__header > :not(.ql-chat-workspace__header-actions) {
  flex: 1;
  min-width: 0;
}

.ql-chat-workspace__channel-title {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.ql-chat-workspace__channel-title h2 {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 800;
  color: var(--ql-chat-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ql-chat-workspace__hash {
  color: var(--ql-chat-primary);
  font-weight: 700;
}

.ql-chat-workspace__chevron {
  color: var(--ql-chat-subtle);
  flex-shrink: 0;
}

.ql-chat-workspace__header-actions {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  flex-shrink: 0;
}

.ql-chat-workspace__header-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.55rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ql-chat-muted);
  transition: background 0.12s ease, color 0.12s ease;
}

.ql-chat-workspace__header-btn:hover:not(:disabled) {
  background: var(--ql-chat-hover);
  color: var(--ql-chat-primary);
}

.ql-chat-workspace__header-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ql-chat-workspace__header-count {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--ql-chat-primary);
}

.ql-chat-workspace__messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(91, 188, 228, 0.07) 0%, transparent 70%),
    var(--ql-chat-bg);
}

.ql-chat-workspace__footer {
  flex-shrink: 0;
  padding: 0.75rem 1.25rem 1.125rem;
  border-top: 1px solid var(--ql-chat-border);
  background: var(--ql-chat-surface);
  overflow: visible;
}

.ql-chat-workspace__channels :deep(.ql-channel),
.ql-chat-workspace__channels :deep(.slack-channel) {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.55rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.78);
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
}

.ql-chat-workspace__channels :deep(.ql-channel:hover),
.ql-chat-workspace__channels :deep(.slack-channel:hover) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.ql-chat-workspace__channels :deep(.ql-channel--active),
.ql-chat-workspace__channels :deep(.slack-channel--active) {
  background: linear-gradient(90deg, var(--ql-chat-primary) 0%, #3a8fd0 100%);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(45, 126, 184, 0.35);
}
</style>
