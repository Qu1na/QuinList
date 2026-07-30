<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Send, AtSign, Hash, Smile, Paperclip } from '@lucide/vue'
import ChatFilePreview from '@/components/chat/ChatFilePreview.vue'
import type { MentionCandidate } from '@/utils/mentionSuggestions'
import { filterMentionCandidates } from '@/utils/mentionSuggestions'
import {
  User,
  Users,
  ListTodo,
  Package,
  FileText,
  StickyNote,
  Flag,
  FolderKanban,
  CreditCard,
  FolderOpen,
} from '@lucide/vue'
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    candidates: MentionCandidate[]
    channelName?: string
    placeholder?: string
    disabled?: boolean
    sending?: boolean
    pendingFile?: File | null
  }>(),
  {},
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:pendingFile': [file: File | null]
  submit: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const editorRef = ref<HTMLDivElement | null>(null)
const dropdownOpen = ref(false)
const activeIndex = ref(0)
const mentionTrigger = ref<'@' | '#' | null>(null)
const mentionQuery = ref('')
const isEmpty = ref(true)

const placeholderText = computed(
  () => props.placeholder ?? `Mensaje #${props.channelName ?? 'general'}`,
)

const kindIcon: Record<string, Component> = {
  user: User,
  team: Users,
  task: ListTodo,
  deliverable: Package,
  document: FileText,
  note: StickyNote,
  milestone: Flag,
  project: FolderOpen,
  board: FolderKanban,
  card: CreditCard,
}

const filtered = computed(() => {
  if (!mentionTrigger.value) return []
  return filterMentionCandidates(props.candidates, mentionTrigger.value, mentionQuery.value)
})

watch(filtered, () => {
  activeIndex.value = 0
})

watch(
  () => props.modelValue,
  (value) => {
    if (!value && editorRef.value) {
      editorRef.value.innerHTML = ''
      isEmpty.value = true
    }
  },
)

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (node instanceof HTMLElement) {
    const token = node.dataset.token
    if (token) return `${token} `
    if (node.tagName === 'BR') return '\n'
    let out = ''
    for (const child of node.childNodes) out += serializeNode(child)
    return out
  }
  return ''
}

function serializeEditor(): string {
  if (!editorRef.value) return ''
  let out = ''
  for (const child of editorRef.value.childNodes) out += serializeNode(child)
  return out.replace(/\u00a0/g, ' ').trimEnd()
}

function getTextBeforeCaret(): string {
  const root = editorRef.value
  const sel = window.getSelection()
  if (!root || !sel?.rangeCount) return ''

  const range = sel.getRangeAt(0)
  if (!root.contains(range.startContainer)) return ''

  const pre = range.cloneRange()
  pre.selectNodeContents(root)
  pre.setEnd(range.startContainer, range.startOffset)

  const fragment = pre.cloneContents()
  let text = ''
  for (const child of fragment.childNodes) text += serializeNode(child)
  return text.replace(/\u00a0/g, ' ')
}

function updateMentionState() {
  const text = getTextBeforeCaret()
  const match = text.match(/(^|\s)([@#])([^\s@#]*)$/)
  if (!match) {
    dropdownOpen.value = false
    mentionTrigger.value = null
    return
  }
  mentionTrigger.value = match[2] as '@' | '#'
  mentionQuery.value = match[3] ?? ''
  dropdownOpen.value = filtered.value.length > 0
}

function syncValue() {
  const value = serializeEditor()
  isEmpty.value = !value.trim()
  emit('update:modelValue', value)
}

function onInput() {
  syncValue()
  nextTick(updateMentionState)
}

function createMentionPill(candidate: MentionCandidate): HTMLSpanElement {
  const span = document.createElement('span')
  span.className =
    candidate.kind === 'user' || candidate.kind === 'team'
      ? 'mention-pill mention-pill--user'
      : 'mention-pill mention-pill--entity'
  span.contentEditable = 'false'
  span.dataset.token = candidate.insertText.trim()
  span.textContent =
    candidate.kind === 'user' || candidate.kind === 'team'
      ? `@${candidate.label}`
      : `#${candidate.label}`
  return span
}

function deleteCharsBeforeCaret(count: number) {
  const sel = window.getSelection()
  if (!sel?.rangeCount || count <= 0) return
  const range = sel.getRangeAt(0)

  if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset >= count) {
    range.setStart(range.startContainer, range.startOffset - count)
    range.deleteContents()
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    return
  }

  for (let i = 0; i < count; i++) {
    const { startContainer, startOffset } = range
    if (startOffset > 0) range.setStart(startContainer, startOffset - 1)
    range.deleteContents()
    range.collapse(true)
  }
  sel.removeAllRanges()
  sel.addRange(range)
}

function insertCandidate(candidate: MentionCandidate) {
  const root = editorRef.value
  const sel = window.getSelection()
  if (!root || !sel?.rangeCount || mentionTrigger.value === null) return

  const text = getTextBeforeCaret()
  const match = text.match(/(^|\s)([@#])([^\s@#]*)$/)
  if (!match) return

  const toDelete = (match[2]?.length ?? 0) + (match[3]?.length ?? 0)
  deleteCharsBeforeCaret(toDelete)

  const range = sel.getRangeAt(0)
  const pill = createMentionPill(candidate)
  const space = document.createTextNode('\u00a0')
  range.insertNode(space)
  range.insertNode(pill)
  range.setStartAfter(space)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)

  dropdownOpen.value = false
  mentionTrigger.value = null
  syncValue()
  root.focus()
}

function insertTrigger(char: '@' | '#') {
  focusEditor()
  const sel = window.getSelection()
  if (!sel?.rangeCount || !editorRef.value) return
  const range = sel.getRangeAt(0)
  const node = document.createTextNode(char)
  range.insertNode(node)
  range.setStartAfter(node)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
  syncValue()
  nextTick(updateMentionState)
}

function onKeydown(e: KeyboardEvent) {
  if (dropdownOpen.value && filtered.value.length) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % filtered.value.length
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeIndex.value =
        (activeIndex.value - 1 + filtered.value.length) % filtered.value.length
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const selected = filtered.value[activeIndex.value]
      if (selected) insertCandidate(selected)
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      dropdownOpen.value = false
      return
    }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

function iconFor(kind: string): Component {
  return kindIcon[kind] ?? AtSign
}

function clearEditor() {
  if (editorRef.value) editorRef.value.innerHTML = ''
  isEmpty.value = true
  dropdownOpen.value = false
  emit('update:modelValue', '')
}

function handleSubmit() {
  if (!props.modelValue.trim() && !props.pendingFile) return
  if (props.disabled) return
  emit('submit')
  clearEditor()
  refocusEditor()
}

function refocusEditor() {
  nextTick(() => {
    focusEditor()
    requestAnimationFrame(() => focusEditor())
  })
}

function openFilePicker() {
  if (props.disabled) return
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = ''
  emit('update:pendingFile', file)
}

function focusEditor() {
  editorRef.value?.focus()
}

function clearFile() {
  emit('update:pendingFile', null)
}

defineExpose({ focusEditor, clearEditor })
</script>

<template>
  <div class="slack-composer">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="dropdownOpen && filtered.length"
        class="slack-composer__dropdown"
        role="listbox"
      >
        <p class="slack-composer__dropdown-title">
          {{ mentionTrigger === '@' ? 'Personas' : 'Referencias' }}
        </p>
        <button
          v-for="(item, idx) in filtered"
          :key="`${item.kind}-${item.id}`"
          type="button"
          class="slack-composer__option"
          :class="{ 'slack-composer__option--active': idx === activeIndex }"
          @mousedown.prevent="insertCandidate(item)"
        >
          <span class="slack-composer__option-icon">
            <component :is="iconFor(item.kind)" :size="14" />
          </span>
          <span class="slack-composer__option-text">
            <span class="slack-composer__option-label">{{ item.label }}</span>
            <span v-if="item.subtitle" class="slack-composer__option-sub">{{ item.subtitle }}</span>
          </span>
        </button>
      </div>
    </Transition>

    <form class="slack-composer__form" @submit.prevent="handleSubmit">
      <input
        ref="fileInputRef"
        type="file"
        tabindex="-1"
        class="slack-composer__file-input"
        accept="image/*,.pdf,.txt,.csv,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        @change="onFileSelected"
      />

      <ChatFilePreview
        v-if="pendingFile"
        :file="pendingFile"
        @remove="clearFile"
      />

      <div
        class="slack-composer__box"
        :class="{ 'slack-composer__box--focus': dropdownOpen }"
        @click="focusEditor"
      >
        <div
          ref="editorRef"
          class="slack-composer__editor"
          :class="{ 'slack-composer__editor--disabled': disabled }"
          contenteditable="true"
          role="textbox"
          aria-multiline="true"
          @input="onInput"
          @keydown="onKeydown"
          @keyup="updateMentionState"
          @click="updateMentionState"
        />

        <p v-if="isEmpty" class="slack-composer__placeholder">{{ placeholderText }}</p>

        <div class="slack-composer__toolbar">
          <button
            type="button"
            class="slack-composer__tool slack-composer__tool--attach"
            title="Adjuntar archivo"
            aria-label="Adjuntar archivo"
            :disabled="disabled"
            @click.stop="openFilePicker"
          >
            <Paperclip :size="18" />
            <span class="slack-composer__attach-label">Adjuntar</span>
          </button>
          <button type="button" class="slack-composer__tool" title="Emoji" disabled>
            <Smile :size="18" />
          </button>
          <button type="button" class="slack-composer__tool" title="Mencionar" @click.stop="insertTrigger('@')">
            <AtSign :size="18" />
          </button>
          <button type="button" class="slack-composer__tool" title="Referenciar" @click.stop="insertTrigger('#')">
            <Hash :size="18" />
          </button>
          <span class="slack-composer__spacer" />
          <button
            type="submit"
            class="slack-composer__send"
            :disabled="disabled || (!modelValue.trim() && !pendingFile)"
            aria-label="Enviar"
          >
            <Send :size="16" />
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.slack-composer {
  position: relative;
}

.slack-composer__dropdown {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  z-index: 30;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid #e8e9ed;
  background: #fff;
  box-shadow: 0 8px 24px rgba(29, 28, 29, 0.16);
}

.slack-composer__dropdown-title {
  margin: 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #616061;
  border-bottom: 1px solid #f0f1f3;
}

.slack-composer__option {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.slack-composer__option--active,
.slack-composer__option:hover {
  background: var(--ql-chat-hover, rgba(45, 126, 184, 0.06));
}

.slack-composer__option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  background: rgba(91, 188, 228, 0.15);
  color: var(--ql-chat-primary, #2d7eb8);
  flex-shrink: 0;
}

.slack-composer__option-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1d1c1d;
}

.slack-composer__option-sub {
  display: block;
  font-size: 0.75rem;
  color: #616061;
}

.slack-composer__form {
  position: relative;
  width: 100%;
}

.slack-composer__pending {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: var(--ql-chat-muted, #626f86);
  background: var(--ql-chat-bg, #f4f7fb);
  border: 1px solid var(--ql-chat-border, rgba(9, 30, 66, 0.1));
}

.slack-composer__pending-clear {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ql-chat-primary, #2d7eb8);
}

.hidden {
  display: none;
}

.slack-composer__file-input {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.slack-composer__box {
  position: relative;
  border: 1px solid var(--ql-chat-border, rgba(9, 30, 66, 0.14));
  border-radius: 0.75rem;
  background: var(--ql-chat-surface, #fff);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.slack-composer__box:focus-within,
.slack-composer__box--focus {
  border-color: var(--ql-chat-primary, #2d7eb8);
  box-shadow: 0 0 0 3px rgba(45, 126, 184, 0.15);
}

.slack-composer__editor {
  min-height: 2.75rem;
  max-height: 9rem;
  overflow-y: auto;
  padding: 0.75rem 0.875rem 0.25rem;
  font-size: 0.9375rem;
  line-height: 1.46667;
  color: #1d1c1d;
  outline: none;
  word-break: break-word;
}

.slack-composer__editor--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.slack-composer__placeholder {
  position: absolute;
  top: 0.75rem;
  left: 0.875rem;
  right: 0.875rem;
  margin: 0;
  font-size: 0.9375rem;
  color: #8b8b8b;
  pointer-events: none;
}

.slack-composer__toolbar {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.25rem 0.5rem 0.5rem;
  overflow-x: auto;
}

.slack-composer__tool {
  flex-shrink: 0;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  color: #616061;
  transition: background 0.12s ease, color 0.12s ease;
  cursor: pointer;
}

.slack-composer__tool--attach {
  width: auto;
  gap: 0.35rem;
  padding: 0 0.55rem;
  color: var(--ql-chat-primary, #2d7eb8);
  background: rgba(45, 126, 184, 0.12);
}

.slack-composer__attach-label {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
}

.slack-composer__tool--attach:hover:not(:disabled) {
  background: rgba(45, 126, 184, 0.22);
  color: var(--ql-chat-primary-dark, #256da3);
}

.slack-composer__tool--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.slack-composer__tool:hover:not(:disabled) {
  background: var(--ql-chat-hover, rgba(45, 126, 184, 0.1));
  color: var(--ql-chat-primary, #2d7eb8);
}

.slack-composer__tool:disabled {
  opacity: 0.4;
}

.slack-composer__spacer {
  flex: 1;
}

.slack-composer__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  color: #616061;
  transition: background 0.12s ease, color 0.12s ease;
}

.slack-composer__send:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--ql-chat-sky, #5bbce4) 0%, var(--ql-chat-primary, #2d7eb8) 100%);
  color: #fff;
}

.slack-composer__send:disabled {
  opacity: 0.35;
}

.slack-composer__editor :deep(.mention-pill) {
  display: inline;
  font-weight: 600;
  border-radius: 3px;
  padding: 0 0.15rem;
  margin: 0 0.05rem;
}

.slack-composer__editor :deep(.mention-pill--user) {
  color: var(--ql-chat-mention-text, #2d7eb8);
  background: var(--ql-chat-mention-bg, rgba(45, 126, 184, 0.14));
}

.slack-composer__editor :deep(.mention-pill--entity) {
  color: var(--ql-chat-entity-text, #6554c0);
  background: var(--ql-chat-entity-bg, rgba(101, 84, 192, 0.12));
}
</style>
