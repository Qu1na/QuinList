<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/brand/AppLogo.vue'

defineProps<{
  title: string
  subtitle: string
}>()

const slides = [
  {
    title: 'Conecta con todo tu equipo.',
    desc: 'Tableros, proyectos y tareas en un solo lugar. Sin perder el hilo.',
  },
  {
    title: 'Ve el avance en tiempo real.',
    desc: 'Quién está trabajando en qué, al instante, desde cualquier dispositivo.',
  },
  {
    title: 'Entrega con claridad.',
    desc: 'Prioridades visibles, fechas claras y menos reuniones de seguimiento.',
  },
]

const activeSlide = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % slides.length
  }, 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="auth-page flex h-screen w-screen overflow-hidden">
    <!-- Formulario — izquierda -->
    <section class="flex h-full w-full flex-col overflow-hidden bg-white lg:w-1/2">
      <div class="flex flex-1 flex-col justify-center overflow-hidden px-6 py-5 sm:px-12 lg:px-16 xl:px-20">
        <RouterLink to="/" class="mb-5 inline-flex shrink-0 self-start lg:mb-8">
          <AppLogo size="md" />
        </RouterLink>

        <div class="mx-auto w-full max-w-[380px]">
          <h1 class="text-[1.65rem] leading-tight font-bold text-[#1e293b]">{{ title }}</h1>
          <p class="mt-1.5 text-sm text-[#64748b]">{{ subtitle }}</p>
          <div class="mt-6">
            <slot />
          </div>
        </div>
      </div>
    </section>

    <!-- Panel promocional — derecha -->
    <aside
      class="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-[#2563eb] lg:flex"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12)_0%,transparent_55%)]"
      />

      <!-- Ilustración -->
      <div class="relative mb-10 flex h-52 w-52 items-center justify-center">
        <div class="absolute inset-0 rounded-full bg-white/10" />
        <div class="absolute inset-4 rounded-full bg-white/8" />
        <svg viewBox="0 0 200 200" class="relative h-40 w-40" fill="none">
          <rect x="70" y="55" width="90" height="70" rx="8" fill="white" fill-opacity="0.95" />
          <rect x="78" y="63" width="74" height="8" rx="2" fill="#2563eb" fill-opacity="0.3" />
          <rect x="78" y="76" width="50" height="5" rx="1.5" fill="#cbd5e1" />
          <rect x="78" y="86" width="60" height="5" rx="1.5" fill="#cbd5e1" />
          <rect x="78" y="96" width="40" height="5" rx="1.5" fill="#cbd5e1" />
          <rect x="78" y="110" width="30" height="8" rx="4" fill="#2563eb" />
          <circle cx="45" cy="75" r="14" fill="white" fill-opacity="0.9" />
          <text x="45" y="79" text-anchor="middle" fill="#2563eb" font-size="11" font-weight="700">
            K
          </text>
          <circle cx="35" cy="115" r="12" fill="white" fill-opacity="0.85" />
          <text x="35" y="119" text-anchor="middle" fill="#64748b" font-size="9" font-weight="600">
            T
          </text>
          <circle cx="55" cy="130" r="11" fill="white" fill-opacity="0.85" />
          <text x="55" y="134" text-anchor="middle" fill="#64748b" font-size="9" font-weight="600">
            P
          </text>
          <path
            d="M59 82 L70 88 M45 97 L70 100 M46 122 L78 115"
            stroke="white"
            stroke-width="1.5"
            stroke-opacity="0.6"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <div class="relative max-w-xs px-8 text-center">
        <Transition name="auth-slide" mode="out-in">
          <div :key="activeSlide">
            <h2 class="text-xl font-bold text-white">{{ slides[activeSlide]!.title }}</h2>
            <p class="mt-2 text-sm leading-relaxed text-white/75">
              {{ slides[activeSlide]!.desc }}
            </p>
          </div>
        </Transition>
      </div>

      <div class="relative mt-8 flex gap-2">
        <button
          v-for="(_, i) in slides"
          :key="i"
          type="button"
          class="h-2 rounded-full transition-all"
          :class="i === activeSlide ? 'w-5 bg-white' : 'w-2 bg-white/40'"
          :aria-label="`Slide ${i + 1}`"
          @click="activeSlide = i"
        />
      </div>
    </aside>
  </div>
</template>

<style scoped>
.auth-slide-enter-active,
.auth-slide-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.auth-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.auth-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
