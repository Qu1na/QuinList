<script setup lang="ts">
/**
 * Confeti geométrico (docs/desing.md): rectángulos rasgados y barras en ángulo, en cuatro
 * colores planos (violeta, amarillo, azul, verde). Solo enmarca paneles oscuros; se sale
 * del borde y nunca toca la UI funcional. Sin degradados, sin sombras, sin trazo.
 */
withDefaults(defineProps<{ side?: 'left' | 'right'; variant?: 'a' | 'b' }>(), { side: 'left', variant: 'a' })
</script>

<template>
  <svg
    class="pointer-events-none absolute top-0 h-full w-[96px] sm:w-[150px] lg:w-[190px]"
    :class="side === 'left' ? 'left-0 -translate-x-[55%] lg:-translate-x-[45%]' : 'right-0 translate-x-[55%] -scale-x-100 lg:translate-x-[45%]'"
    viewBox="0 0 220 600"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="variant === 'a'">
      <polygon points="0,0 118,0 92,74 0,96" fill="#bf63f3" />
      <polygon points="0,112 70,98 82,196 0,214" fill="#fca700" />
      <polygon points="-10,236 132,214 104,300 -10,318" fill="#4d8ced" />
      <polygon points="22,334 64,326 72,398 18,410" fill="#6a9a23" />
      <polygon points="0,430 96,418 76,520 0,548" fill="#bf63f3" />
      <polygon points="0,560 150,552 140,600 0,600" fill="#fca700" />
      <polygon points="104,40 128,34 122,58" fill="#fca700" />
      <polygon points="96,350 120,344 116,372 92,376" fill="#4d8ced" />
    </template>
    <template v-else>
      <polygon points="0,0 70,0 88,86 0,110" fill="#4d8ced" />
      <polygon points="0,124 112,110 96,190 0,206" fill="#6a9a23" />
      <polygon points="0,224 58,216 70,300 0,312" fill="#fca700" />
      <polygon points="-6,330 140,318 112,410 -6,424" fill="#bf63f3" />
      <polygon points="12,440 74,430 82,512 8,526" fill="#4d8ced" />
      <polygon points="0,540 120,532 98,600 0,600" fill="#6a9a23" />
      <polygon points="94,150 116,146 112,170 90,172" fill="#bf63f3" />
    </template>
  </svg>
</template>
