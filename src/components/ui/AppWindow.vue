<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  title: string
  subtitle?: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="app-window" v-bind="$attrs" @click.stop>
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

    <div class="app-window__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="app-window__footer">
      <slot name="footer" />
    </div>
  </div>
</template>
