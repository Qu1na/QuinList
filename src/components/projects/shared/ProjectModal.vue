<script setup lang="ts">
import { X } from '@lucide/vue'

defineProps<{
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{ close: [] }>()

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      @click.self="emit('close')"
    >
      <div
        class="w-full rounded-xl bg-white shadow-2xl"
        :class="sizeClass[size ?? 'md']"
        role="dialog"
        aria-modal="true"
      >
        <header class="flex items-start justify-between border-b border-[#091e4214] px-5 py-4">
          <div>
            <h3 class="font-semibold text-[#172b4d]">{{ title }}</h3>
            <p v-if="subtitle" class="mt-0.5 text-xs text-[#626f86]">{{ subtitle }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1.5 text-[#626f86] hover:bg-[#091e420a]"
            @click="emit('close')"
          >
            <X :size="18" />
          </button>
        </header>
        <div class="px-5 py-4">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="flex justify-end gap-2 border-t border-[#091e4214] px-5 py-3">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>
