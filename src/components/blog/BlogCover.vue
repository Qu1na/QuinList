<script setup lang="ts">
/** Portada de entrada: color plano por segmento + ícono + título corto. Sin imágenes (carga instantánea). */
import { computed } from 'vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import { getSegment } from '@/seo/blog'

const props = withDefaults(defineProps<{ segment: string; title?: string; size?: 'sm' | 'lg' | 'wide' }>(), { size: 'sm' })
const seg = computed(() => getSegment(props.segment)!)

const STYLE = {
  blue: 'bg-[#1868db] text-white',
  lavender: 'bg-[#eed7fc] text-[#101214]',
  navy: 'bg-[#101214] text-white',
  fog: 'bg-[#e9f2fe] text-[#101214]',
} as const
</script>

<template>
  <div
    class="relative flex overflow-hidden rounded-[20px]"
    :class="[STYLE[seg.cover], size === 'lg' ? 'aspect-[16/9] p-8 sm:p-10' : size === 'wide' ? 'aspect-[16/9] p-8 sm:aspect-[3/1] sm:p-10' : 'aspect-[16/10] p-6']"
    aria-hidden="true"
  >
    <!-- Fragmentos geométricos planos (decorativos) -->
    <svg class="absolute -right-6 -top-6 h-40 w-40 opacity-90 sm:h-48 sm:w-48" viewBox="0 0 100 100">
      <polygon points="40,0 100,0 100,46 62,38" fill="#fca700" />
      <polygon points="70,52 100,58 100,100 80,100" fill="#bf63f3" />
      <polygon points="20,10 44,6 38,30" fill="#4d8ced" />
    </svg>
    <div class="relative mt-auto max-w-[80%]">
      <span
        class="flex items-center justify-center rounded-xl"
        :class="[
          seg.cover === 'blue' || seg.cover === 'navy' ? 'bg-white/15' : 'bg-white text-[#1868db]',
          size !== 'sm' ? 'h-14 w-14' : 'h-11 w-11',
        ]"
      >
        <MktIcon :name="seg.icon" :size="size !== 'sm' ? 28 : 22" />
      </span>
      <p v-if="title" class="ql-display mt-4 font-medium leading-tight" :class="size !== 'sm' ? 'text-[1.6rem] sm:text-[2rem]' : 'text-[1.15rem]'">
        {{ title }}
      </p>
    </div>
  </div>
</template>
