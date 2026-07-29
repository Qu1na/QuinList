<script setup lang="ts">
const model = defineModel<boolean>({ default: true })

withDefaults(
  defineProps<{
    label: string
    hint?: string
  }>(),
  { hint: '' },
)
</script>

<template>
  <label class="field-switch">
    <span class="field-switch__copy">
      <span class="field-switch__label">{{ label }}</span>
      <span v-if="hint" class="field-switch__hint">{{ hint }}</span>
    </span>
    <button
      type="button"
      role="switch"
      class="ui-switch"
      :class="{ 'ui-switch--on': model }"
      :aria-checked="model"
      @click="model = !model"
    >
      <span class="ui-switch__thumb" />
    </button>
  </label>
</template>
