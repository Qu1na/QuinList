<script setup lang="ts">
import type { Component } from 'vue'
import { onMounted, onUnmounted, ref } from 'vue'

export interface DesktopMenuItem {
  id: string
  label: string
  icon?: Component
  disabled?: boolean
  danger?: boolean
}

defineProps<{
  x: number
  y: number
  items: DesktopMenuItem[]
}>()

const emit = defineEmits<{
  select: [id: string]
  close: []
}>()

const menuRef = ref<HTMLElement | null>(null)

let attachTimer: ReturnType<typeof setTimeout> | null = null
let onOutsidePointer: ((e: PointerEvent) => void) | null = null
let onEscapeKey: ((e: KeyboardEvent) => void) | null = null

function pick(id: string, disabled?: boolean) {
  if (disabled) return
  emit('select', id)
  emit('close')
}

onMounted(() => {
  attachTimer = window.setTimeout(() => {
    attachTimer = null
    onOutsidePointer = (e: PointerEvent) => {
      if (e.button !== 0) return
      const el = menuRef.value
      if (el && e.target instanceof Node && el.contains(e.target)) return
      emit('close')
    }
    onEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') emit('close')
    }
    document.addEventListener('pointerdown', onOutsidePointer)
    document.addEventListener('keydown', onEscapeKey)
  }, 0)
})

onUnmounted(() => {
  if (attachTimer !== null) {
    window.clearTimeout(attachTimer)
    attachTimer = null
  }
  if (onOutsidePointer) {
    document.removeEventListener('pointerdown', onOutsidePointer)
    onOutsidePointer = null
  }
  if (onEscapeKey) {
    document.removeEventListener('keydown', onEscapeKey)
    onEscapeKey = null
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="menuRef"
      class="desktop-context-menu"
      :style="{ left: `${x}px`, top: `${y}px` }"
      @contextmenu.prevent.stop
    >
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="desktop-context-menu__item"
        :class="{
          'desktop-context-menu__item--danger': item.danger,
          'desktop-context-menu__item--disabled': item.disabled,
        }"
        :disabled="item.disabled"
        @click="pick(item.id, item.disabled)"
      >
        <component :is="item.icon" v-if="item.icon" :size="16" class="shrink-0 opacity-80" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </Teleport>
</template>
