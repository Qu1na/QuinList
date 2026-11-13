<script setup lang="ts">
/**
 * Dock de funciones con magnificación estilo macOS.
 * Al pasar el mouse, los íconos cercanos crecen según la distancia al cursor (una sola
 * variable CSS por ícono, actualizada en requestAnimationFrame). En táctil no hay
 * magnificación: el dock es un carril horizontal y se elige con un toque.
 */
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Check } from '@lucide/vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import { ACCENT } from '@/components/marketing/accent'
import { pagesOfKind } from '@/seo/marketing'
import { showcaseByPath } from '@/seo/showcase'

const items = pagesOfKind('solucion')
  .map((page) => ({ page, sc: showcaseByPath[page.path]! }))
  .filter((x) => !!x.sc)

const active = ref(0)
const current = computed(() => items[active.value]!)
const dock = ref<HTMLElement | null>(null)
const itemEls = ref<HTMLElement[]>([])
let raf = 0
let lastX = 0

const RANGE = 140
const BOOST = 0.55

function apply() {
  raf = 0
  const host = dock.value
  if (!host) return
  // offsetLeft no incluye el transform: el centro real no “salta” al agrandarse el ícono.
  const base = host.getBoundingClientRect().left - host.scrollLeft
  for (const el of itemEls.value) {
    const d = Math.abs(lastX - (base + el.offsetLeft + el.offsetWidth / 2))
    const s = 1 + BOOST * Math.max(0, 1 - d / RANGE) ** 2
    el.style.setProperty('--s', s.toFixed(3))
  }
}

function onMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  lastX = e.clientX
  if (!raf) raf = requestAnimationFrame(apply)
}

function onLeave() {
  cancelAnimationFrame(raf)
  raf = 0
  for (const el of itemEls.value) el.style.setProperty('--s', '1')
}
</script>

<template>
  <section id="funciones" class="relative overflow-hidden bg-[#2a72a8] py-20 text-white lg:py-28" aria-labelledby="dock-heading">
    <!-- Fondo de escritorio: puntos sobre azul sólido -->
    <div
      class="pointer-events-none absolute inset-0 opacity-30"
      aria-hidden="true"
      style="background-image: radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px); background-size: 22px 22px"
    />
    <div class="relative mx-auto max-w-6xl px-5 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <p class="ql-eyebrow ql-eyebrow--light">Funciones</p>
        <h2 id="dock-heading" class="mt-3 text-3xl font-bold text-white lg:text-[2.75rem] lg:leading-[1.1]">
          Todo lo que necesitas, en un solo dock
        </h2>
        <p class="mt-4 text-[15px] leading-relaxed text-white lg:text-lg">
          Pasa el mouse o toca cada ícono. Sin pagar cinco apps distintas.
        </p>
      </div>

      <div class="mt-10 flex flex-col md:mt-12">
      <!-- Tarjeta de la función activa (en celular va debajo del dock) -->
      <div class="order-2 mx-auto mt-6 w-full max-w-3xl md:order-1 md:mt-0">
        <Transition mode="out-in" enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
          <article :key="current.page.path" class="rounded-[1.6rem] bg-white p-6 text-[#172b4d] shadow-[0_30px_60px_-30px_rgba(15,28,51,0.6)] sm:p-8">
            <div class="flex items-start gap-4">
              <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" :class="ACCENT[current.sc.accent].tile">
                <MktIcon :name="current.sc.icon" :size="24" />
              </span>
              <div class="min-w-0">
                <h3 class="text-xl font-bold sm:text-2xl">{{ current.page.navLabel }}</h3>
                <p class="mt-1 text-[15px] text-[#44546f]">{{ current.page.description }}</p>
              </div>
            </div>
            <ul class="mt-6 grid gap-2.5 sm:grid-cols-3">
              <li v-for="f in current.sc.features.slice(0, 3)" :key="f.title" class="flex items-start gap-2 rounded-xl bg-[#f6f8fb] p-3 text-sm">
                <Check :size="16" class="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span><b class="block font-semibold">{{ f.title }}</b><span class="text-[#5e6c84]">{{ f.text }}</span></span>
              </li>
            </ul>
            <RouterLink :to="current.page.path" class="ql-btn mt-6 py-2.5 text-sm">
              Ver {{ current.page.navLabel.toLowerCase() }} <ArrowRight :size="15" aria-hidden="true" />
            </RouterLink>
          </article>
        </Transition>
      </div>

      <!-- Dock (en celular va arriba para elegir sin hacer scroll) -->
      <div class="order-1 flex justify-center md:order-2 md:mt-10">
        <div
          ref="dock"
          class="ql-dock relative max-w-full overflow-x-auto bg-white/15 ring-1 ring-white/30 backdrop-blur-xl [scrollbar-width:none] md:overflow-visible"
          role="toolbar"
          aria-label="Funciones de QuinList"
          @pointermove="onMove"
          @pointerleave="onLeave"
        >
          <button
            v-for="(it, i) in items"
            :key="it.page.path"
            ref="itemEls"
            type="button"
            class="ql-dock__item group bg-white shadow-[0_6px_14px_-6px_rgba(15,28,51,0.5)]"
            :aria-pressed="active === i"
            :aria-label="it.page.navLabel"
            @click="active = i"
            @mouseenter="active = i"
            @focus="active = i"
          >
            <span class="flex h-full w-full items-center justify-center rounded-[0.9rem]" :class="ACCENT[it.sc.accent].tile">
              <MktIcon :name="it.sc.icon" :size="24" />
            </span>
            <!-- Etiqueta tipo macOS -->
            <span
              class="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1a2b4a] px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 md:block"
              aria-hidden="true"
            >
              {{ it.page.navLabel }}
            </span>
          </button>
        </div>
      </div>
      </div>
    </div>
  </section>
</template>
