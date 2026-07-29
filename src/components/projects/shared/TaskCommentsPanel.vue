<script setup lang="ts">
import { computed, ref } from 'vue'
import { MessageSquare, Send, Trash2 } from '@lucide/vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { formatDateTime } from '@/utils/permissions'
import UserAvatar from '@/components/projects/shared/UserAvatar.vue'

const props = defineProps<{
  taskId: string
}>()

const projectsStore = useProjectsStore()
const auth = useAuthStore()
const { resolveUser, setPresenceActivity } = useProjectUsers()

const draft = ref('')

const comments = computed(() => projectsStore.getTaskComments(props.taskId))

async function submit() {
  const text = draft.value.trim()
  if (!text) return
  projectsStore.addTaskComment(props.taskId, text)
  draft.value = ''
  void setPresenceActivity('online')
}

function remove(commentId: string) {
  projectsStore.deleteTaskComment(commentId)
}

function onFocus() {
  void setPresenceActivity('editing', 'Comentando')
}

function onBlur() {
  void setPresenceActivity('online')
}
</script>

<template>
  <div class="task-comments">
    <div class="task-comments__header">
      <MessageSquare :size="16" class="text-[#5bbce4]" />
      <span class="text-sm font-semibold text-[#172b4d]">Comentarios</span>
      <span v-if="comments.length" class="task-comments__count">{{ comments.length }}</span>
    </div>

    <ul v-if="comments.length" class="task-comments__list scroll-thin">
      <li v-for="comment in comments" :key="comment.id" class="task-comments__item">
        <UserAvatar :user-id="comment.userId" size="sm" />
        <div class="task-comments__body">
          <div class="task-comments__meta">
            <span class="font-medium text-[#172b4d]">
              {{ resolveUser(comment.userId)?.name ?? 'Usuario' }}
            </span>
            <time class="text-xs text-[#626f86]">{{ formatDateTime(comment.createdAt) }}</time>
            <button
              v-if="comment.userId === auth.currentUserId"
              type="button"
              class="task-comments__delete"
              title="Eliminar"
              @click="remove(comment.id)"
            >
              <Trash2 :size="12" />
            </button>
          </div>
          <p class="task-comments__text">{{ comment.content }}</p>
        </div>
      </li>
    </ul>

    <p v-else class="task-comments__empty">Sé el primero en comentar.</p>

    <form class="task-comments__form" @submit.prevent="submit">
      <textarea
        v-model="draft"
        rows="2"
        class="project-create-modal__input resize-none"
        placeholder="Escribe un comentario para el equipo..."
        @focus="onFocus"
        @blur="onBlur"
      />
      <button
        type="submit"
        class="btn-brand inline-flex items-center gap-1.5 self-end"
        :disabled="!draft.trim()"
      >
        <Send :size="14" />
        Enviar
      </button>
    </form>
  </div>
</template>

<style scoped>
.task-comments {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-radius: 0.875rem;
  border: 1px solid #ebebed;
  background: #fafafb;
  padding: 1rem;
}

.task-comments__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.task-comments__count {
  margin-left: auto;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #626f86;
  background: #ebebed;
  border-radius: 999px;
  padding: 0.125rem 0.5rem;
}

.task-comments__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 14rem;
  overflow-y: auto;
}

.task-comments__item {
  display: flex;
  gap: 0.625rem;
}

.task-comments__body {
  min-width: 0;
  flex: 1;
}

.task-comments__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.5rem;
  margin-bottom: 0.25rem;
}

.task-comments__text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: #44546f;
  white-space: pre-wrap;
}

.task-comments__delete {
  margin-left: auto;
  color: #626f86;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.task-comments__item:hover .task-comments__delete {
  opacity: 1;
}

.task-comments__delete:hover {
  color: #ef4444;
}

.task-comments__empty {
  margin: 0;
  font-size: 0.8125rem;
  color: #626f86;
}

.task-comments__form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
