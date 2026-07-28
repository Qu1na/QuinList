<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatCurrencyInput, parseCurrencyInput, getCurrencyOption } from '@/utils/currency'

const props = withDefaults(
  defineProps<{
    modelValue: number
    currency?: string
    placeholder?: string
    disabled?: boolean
  }>(),
  { currency: 'COP', placeholder: '0' },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const display = ref('')
const focused = ref(false)

function syncFromModel() {
  if (focused.value) return
  display.value = props.modelValue > 0 ? formatCurrencyInput(props.modelValue, props.currency) : ''
}

watch(() => props.modelValue, syncFromModel, { immediate: true })
watch(() => props.currency, syncFromModel)

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  display.value = raw
  emit('update:modelValue', parseCurrencyInput(raw, props.currency))
}

function onFocus() {
  focused.value = true
  if (props.modelValue > 0) {
    display.value = formatCurrencyInput(props.modelValue, props.currency)
  }
}

function onBlur() {
  focused.value = false
  display.value = props.modelValue > 0 ? formatCurrencyInput(props.modelValue, props.currency) : ''
}

const symbol = () => {
  const opt = getCurrencyOption(props.currency)
  return new Intl.NumberFormat(opt.locale, { style: 'currency', currency: opt.code })
    .formatToParts(0)
    .find((p) => p.type === 'currency')?.value ?? '$'
}
</script>

<template>
  <div class="relative">
    <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[#626f86]">
      {{ symbol() }}
    </span>
    <input
      :value="display"
      type="text"
      inputmode="decimal"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-lg border border-[#091e4229] py-2 pr-3 pl-9 text-sm outline-none focus:border-[#0c66e4] disabled:bg-[#091e420a]"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
  </div>
</template>
