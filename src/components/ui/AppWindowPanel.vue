<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  title: string
  subtitle?: string
  maxWidth?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
  close: []
}>()

const widthClass: Record<string, string> = {
  sm: 'app-window--panel-sm',
  md: 'app-window--panel-md',
  lg: 'app-window--panel-lg',
}
</script>

<template>
  <aside
    class="app-window app-window--panel flex h-full flex-col"
    :class="widthClass[maxWidth ?? 'lg']"
    v-bind="$attrs"
    @click.stop
  >
    <div class="app-window__titlebar">
      <div class="app-window__traffic">
        <button
          type="button"
          class="app-window__dot app-window__dot--close"
          aria-label="Cerrar"
          @click="emit('close')"
        />
        <span class="app-window__dot app-window__dot--min" aria-hidden="true" />
        <span class="app-window__dot app-window__dot--max" aria-hidden="true" />
      </div>
      <div class="app-window__titles">
        <p class="app-window__title">{{ title }}</p>
        <p v-if="subtitle" class="app-window__subtitle">{{ subtitle }}</p>
      </div>
      <div class="app-window__spacer" aria-hidden="true" />
    </div>

    <div class="app-window__body app-window__body--panel">
      <slot />
    </div>

    <div v-if="$slots.footer" class="app-window__footer">
      <slot name="footer" />
    </div>
  </aside>
</template>
