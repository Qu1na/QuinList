<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Star } from '@lucide/vue'
import type { ReviewItem } from '@/utils/reviews'

const props = defineProps<{
  reviews: ReviewItem[]
}>()

const trackRef = ref<HTMLElement | null>(null)
const offset = ref(0)
const isDragging = ref(false)
const isPaused = ref(false)
const prefersReducedMotion = ref(false)

const SPEED = 0.45
let rafId = 0
let lastTs = 0
let dragStartX = 0
let dragStartOffset = 0
let halfWidth = 0

const loopReviews = computed(() => [...props.reviews, ...props.reviews])

function measure() {
  const el = trackRef.value
  if (!el) return
  halfWidth = el.scrollWidth / 2
}

function tick(ts: number) {
  if (!lastTs) lastTs = ts
  const dt = ts - lastTs
  lastTs = ts

  if (!isDragging.value && !isPaused.value && !prefersReducedMotion.value && halfWidth > 0) {
    offset.value -= SPEED * (dt / 16.67)
    if (Math.abs(offset.value) >= halfWidth) {
      offset.value += halfWidth
    }
  }

  rafId = requestAnimationFrame(tick)
}

function onPointerDown(e: PointerEvent) {
  if (!trackRef.value) return
  isDragging.value = true
  isPaused.value = true
  dragStartX = e.clientX
  dragStartOffset = offset.value
  trackRef.value.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  offset.value = dragStartOffset + (e.clientX - dragStartX)
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value || !trackRef.value) return
  isDragging.value = false
  trackRef.value.releasePointerCapture(e.pointerId)

  if (halfWidth > 0) {
    while (offset.value > 0) offset.value -= halfWidth
    while (Math.abs(offset.value) >= halfWidth) offset.value += halfWidth
  }

  window.setTimeout(() => {
    if (!isDragging.value) isPaused.value = false
  }, 800)
}

function onEnter() {
  isPaused.value = true
}

function onLeave() {
  if (!isDragging.value) isPaused.value = false
}

onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  measure()
  window.addEventListener('resize', measure)
  rafId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', measure)
})

watch(
  () => props.reviews.length,
  () => {
    requestAnimationFrame(measure)
  },
)
</script>

<template>
  <div
    class="landing-reviews-carousel relative select-none"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div class="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-16" />
    <div class="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-16" />

    <div
      ref="trackRef"
      class="landing-reviews-track flex w-max gap-4 px-2 will-change-transform"
      :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
      :style="{ transform: `translate3d(${offset}px, 0, 0)` }"
      role="list"
      aria-label="Carrusel de reseñas de clientes"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <article
        v-for="(t, i) in loopReviews"
        :key="`${t.id}-${i}`"
        class="landing-review-card flex w-[280px] shrink-0 flex-col rounded-2xl border border-[#eee] bg-white p-5 text-left shadow-sm sm:w-[300px]"
        role="listitem"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex gap-0.5" :aria-label="`${t.rating} de 5 estrellas`">
            <Star
              v-for="n in 5"
              :key="n"
              :size="13"
              :class="n <= t.rating ? 'fill-[#f4845f] text-[#f4845f]' : 'fill-[#eee] text-[#eee]'"
              aria-hidden="true"
            />
          </div>
          <span class="text-[11px] font-semibold text-[#aaa]">Reseña verificada</span>
        </div>
        <p class="mt-3 flex-1 text-sm leading-relaxed text-[#555]">“{{ t.quote }}”</p>
        <footer class="mt-4 flex items-center gap-3 border-t border-[#f0f0f0] pt-4">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff5f0] text-xs font-bold text-[#f4845f]"
            aria-hidden="true"
          >
            {{ t.name.charAt(0) }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-bold text-[#2d2d2d]">{{ t.name }}</p>
            <p class="truncate text-xs text-[#999]">{{ t.role }} · {{ t.company }}</p>
          </div>
        </footer>
      </article>
    </div>

    <p class="mt-4 text-center text-xs text-[#aaa]">
      Arrastra para explorar · se desplaza automáticamente
    </p>
  </div>
</template>
