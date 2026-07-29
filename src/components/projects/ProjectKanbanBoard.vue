<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import draggable from 'vuedraggable'
import { Plus, Calendar, Paperclip, MessageSquare, X } from '@lucide/vue'
import type { ProjectTask, ProjectTaskStatus } from '@/types/projects'
import type { Priority } from '@/types'
import { TASK_STATUS_LABELS, isTaskOverdue, PRIORITY_LABELS } from '@/utils/projectStats'
import { beginKanbanDrag, endKanbanDrag } from '@/composables/useKanbanDrag'
import { useProjectUsers } from '@/composables/useProjectUsers'
import { useProjectsStore } from '@/stores/projects'
import UserAvatar from './shared/UserAvatar.vue'

const projectsStore = useProjectsStore()
const { setPresenceActivity, resolveUser } = useProjectUsers()

const props = defineProps<{
  tasks: ProjectTask[]
}>()

const emit = defineEmits<{
  select: [taskId: string]
  move: [taskId: string, status: ProjectTaskStatus]
  create: [title: string, status: ProjectTaskStatus]
}>()

const BOARD_COLUMNS: ProjectTaskStatus[] = ['todo', 'in_progress', 'review', 'done']

const columnTasks = ref<Record<ProjectTaskStatus, ProjectTask[]>>({
  todo: [],
  in_progress: [],
  review: [],
  done: [],
  blocked: [],
})

const addingTo = ref<ProjectTaskStatus | null>(null)
const newTitle = ref('')
const isDragging = ref(false)
const addInputRefs = ref<Partial<Record<ProjectTaskStatus, HTMLTextAreaElement>>>({})

function setAddInputRef(col: ProjectTaskStatus, el: HTMLTextAreaElement | null) {
  if (el) addInputRefs.value[col] = el
  else delete addInputRefs.value[col]
}

const priorityTagClass: Record<Priority, string> = {
  baja: 'pkt-tag--sky',
  media: 'pkt-tag--amber',
  alta: 'pkt-tag--rose',
}

function syncColumns() {
  if (isDragging.value) return
  const map = Object.fromEntries(BOARD_COLUMNS.map((c) => [c, [] as ProjectTask[]])) as Record<
    ProjectTaskStatus,
    ProjectTask[]
  >
  map.blocked = []
  for (const t of props.tasks) {
    let col = (t.kanbanColumn || t.status) as ProjectTaskStatus
    if (col === 'blocked') col = 'todo'
    if (map[col]) map[col].push(t)
    else map.todo.push(t)
  }
  columnTasks.value = map
}

syncColumns()
watch(() => props.tasks, syncColumns, { deep: true })

function onDragStart() {
  isDragging.value = true
  beginKanbanDrag()
  void setPresenceActivity('editing', 'Moviendo tarea')
}

function onDragEnd() {
  isDragging.value = false
  endKanbanDrag()
  syncColumns()
  void setPresenceActivity('online')
}

function onChange(col: ProjectTaskStatus, evt: { added?: { element: ProjectTask } }) {
  if (evt.added) emit('move', evt.added.element.id, col)
}

function startAdding(col: ProjectTaskStatus) {
  addingTo.value = col
  newTitle.value = ''
  setTimeout(() => addInputRefs.value[col]?.focus(), 40)
}

function submitAdd(col: ProjectTaskStatus) {
  if (!newTitle.value.trim()) return
  emit('create', newTitle.value.trim(), col)
  newTitle.value = ''
  addingTo.value = null
}

function cancelAdd() {
  newTitle.value = ''
  addingTo.value = null
}

function onAddKeydown(e: KeyboardEvent, col: ProjectTaskStatus) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submitAdd(col)
  }
  if (e.key === 'Escape') cancelAdd()
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function creatorName(task: ProjectTask) {
  if (!task.createdBy) return 'Creador'
  return resolveUser(task.createdBy)?.name ?? 'Usuario'
}

function assigneeIds(task: ProjectTask) {
  return task.assigneeIds.filter((id) => id !== task.createdBy).slice(0, 3)
}

function extraAssignees(task: ProjectTask) {
  const total = assigneeIds(task).length
  return total > 3 ? total - 3 : 0
}

function tagClass(priority: Priority) {
  return priorityTagClass[priority]
}

function priorityLabel(priority: Priority) {
  return PRIORITY_LABELS[priority]
}

function coverImage(task: ProjectTask) {
  const img = task.attachments.find((a) => a.type?.startsWith('image/'))
  return img?.url ?? null
}

function commentCount(task: ProjectTask) {
  return projectsStore.getTaskComments(task.id).length
}

onUnmounted(() => {
  if (isDragging.value) endKanbanDrag()
})
</script>

<template>
  <div class="pkt-board-scroll scroll-thin">
    <div v-for="col in BOARD_COLUMNS" :key="col" class="pkt-col">
      <h3 class="pkt-col__title">
        {{ TASK_STATUS_LABELS[col] }}
        <span class="pkt-col__count">({{ columnTasks[col].length }})</span>
      </h3>

      <div class="pkt-col__scroll scroll-thin">
        <draggable
          v-model="columnTasks[col]"
          group="project-kanban"
          item-key="id"
          tag="div"
          class="pkt-col__cards"
          :animation="220"
          easing="cubic-bezier(0.2, 0, 0, 1)"
          ghost-class="pkt-card--ghost"
          chosen-class="pkt-card--chosen"
          drag-class="pkt-card--drag"
          :force-fallback="true"
          :fallback-on-body="true"
          :scroll="true"
          :bubble-scroll="true"
          @start="onDragStart"
          @end="onDragEnd"
          @change="onChange(col, $event)"
        >
          <template #item="{ element: task }">
            <article class="pkt-card" @click="emit('select', task.id)">
              <div class="pkt-card__tags">
                <span class="pkt-tag" :class="tagClass(task.priority)">
                  {{ priorityLabel(task.priority) }}
                </span>
              </div>

              <h4 class="pkt-card__title">{{ task.title }}</h4>

              <p v-if="task.description" class="pkt-card__desc">
                {{ task.description }}
              </p>

              <div v-if="coverImage(task)" class="pkt-card__cover">
                <img :src="coverImage(task)!" :alt="task.title" loading="lazy" />
              </div>

              <div v-if="task.dueDate" class="pkt-card__date-row">
                <span
                  class="pkt-date"
                  :class="{ 'pkt-date--overdue': isTaskOverdue(task) }"
                >
                  <Calendar :size="13" />
                  {{ formatShortDate(task.dueDate) }}
                </span>
              </div>

              <div class="pkt-card__footer">
                <div class="pkt-card__avatars">
                  <UserAvatar
                    v-if="task.createdBy"
                    :user-id="task.createdBy"
                    size="sm"
                    class="pkt-card__avatar pkt-card__avatar--creator"
                    :title="`Creada por ${creatorName(task)}`"
                  />
                  <UserAvatar
                    v-for="uid in assigneeIds(task)"
                    :key="uid"
                    :user-id="uid"
                    size="sm"
                    class="pkt-card__avatar"
                    :title="resolveUser(uid)?.name ?? 'Asignado'"
                  />
                  <span v-if="extraAssignees(task)" class="pkt-card__avatar-more">
                    +{{ extraAssignees(task) }}
                  </span>
                </div>
                <div class="pkt-card__meta">
                  <span v-if="commentCount(task)" class="pkt-card__meta-item">
                    <MessageSquare :size="14" />
                    {{ commentCount(task) }}
                  </span>
                  <span v-if="task.attachments.length" class="pkt-card__meta-item">
                    <Paperclip :size="14" />
                    {{ task.attachments.length }}
                  </span>
                </div>
              </div>
            </article>
          </template>
        </draggable>
      </div>

      <div class="pkt-col__add">
        <div v-if="addingTo === col" class="pkt-add-form">
          <textarea
            :ref="(el) => setAddInputRef(col, el as HTMLTextAreaElement | null)"
            v-model="newTitle"
            rows="3"
            class="pkt-add-form__input"
            placeholder="Título de la tarea..."
            @keydown="onAddKeydown($event, col)"
          />
          <div class="pkt-add-form__actions">
            <button type="button" class="pkt-add-form__submit" @click="submitAdd(col)">
              Añadir tarea
            </button>
            <button type="button" class="pkt-add-form__cancel" aria-label="Cancelar" @click="cancelAdd">
              <X :size="18" />
            </button>
          </div>
        </div>
        <button
          v-else
          type="button"
          class="pkt-add-btn"
          @click="startAdding(col)"
        >
          <Plus :size="16" />
          Añadir tarea
        </button>
      </div>
    </div>
  </div>
</template>
