<script setup lang="ts">
import AppWindow from '@/components/ui/AppWindow.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    size?: 'sm' | 'md' | 'lg'
    step?: number
    totalSteps?: number
  }>(),
  { size: 'md' },
)

const emit = defineEmits<{ close: [] }>()

const sizeClass: Record<string, string> = {
  sm: 'app-window--sm',
  md: 'app-window--md',
  lg: 'app-window--wide',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="app-window-overlay fixed inset-0 z-[2000] flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <AppWindow
        :title="title"
        :subtitle="subtitle"
        :class="sizeClass[props.size]"
        v-bind="$attrs"
        @close="emit('close')"
      >
        <div
          v-if="step != null && totalSteps != null && totalSteps > 1"
          class="mb-4 flex items-center gap-1.5"
        >
          <span
            v-for="s in totalSteps"
            :key="s"
            class="app-step-bar"
            :class="{ 'app-step-bar--active': step >= s }"
          />
        </div>

        <div class="app-window-form">
          <slot />
        </div>

        <template v-if="$slots.footer" #footer>
          <div class="app-window-footer-actions">
            <slot name="footer" />
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>
</template>
