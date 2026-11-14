<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { CheckCircle2, FileSpreadsheet, Folder, MessageCircle, NotebookPen, X } from '@lucide/vue'
import { landingBeforeAfter } from '@/seo/marketing'

const mode = ref<'antes' | 'despues'>('antes')
const root = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let touched = false

function pick(m: 'antes' | 'despues') {
  touched = true
  mode.value = m
}

// La primera vez que la sección se ve, pasa sola a “Con QuinList” para mostrar el cambio.
onMounted(() => {
  if (!root.value || typeof IntersectionObserver === 'undefined') return
  io = new IntersectionObserver(
    ([e]) => {
      if (e?.isIntersecting) {
        timer = setTimeout(() => {
          if (!touched) mode.value = 'despues'
        }, 1600)
        io?.disconnect()
      }
    },
    { threshold: 0.55 },
  )
  io.observe(root.value)
})
onUnmounted(() => {
  io?.disconnect()
  clearTimeout(timer)
})

const chaos = [
  { icon: FileSpreadsheet, label: 'Cronograma_final_v3_AHORA_SI.xlsx', cls: 'bg-emerald-50 text-emerald-800 -rotate-3', pos: 'left-[4%] top-[8%]' },
  { icon: MessageCircle, label: '“¿Quién quedó con lo del cliente?” 🤔', cls: 'bg-[#e7f9ee] text-[#14532d] rotate-2', pos: 'right-[5%] top-[14%]' },
  { icon: Folder, label: 'Drive / Proyectos / Viejos / NO BORRAR', cls: 'bg-amber-50 text-amber-900 rotate-1', pos: 'left-[10%] top-[40%]' },
  { icon: NotebookPen, label: 'Cuaderno: “pagar a proveedor ??”', cls: 'bg-[#fff8db] text-[#713f12] -rotate-2', pos: 'right-[8%] top-[46%]' },
  { icon: MessageCircle, label: '47 mensajes sin leer en “Obra Sur”', cls: 'bg-[#e7f9ee] text-[#14532d] -rotate-1', pos: 'left-[6%] top-[72%]' },
  { icon: FileSpreadsheet, label: 'Presupuesto (copia) (2).xlsx', cls: 'bg-emerald-50 text-emerald-800 rotate-3', pos: 'right-[6%] top-[76%]' },
]
</script>

<template>
  <section id="problema" ref="root" class="py-20 lg:py-28" aria-labelledby="pain-heading">
    <div class="mx-auto max-w-[1200px] px-5 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <p class="ql-eyebrow">El problema</p>
        <h2 id="pain-heading" class="mt-3 text-[2rem] leading-[1.15] text-[#101214] lg:text-[3rem] lg:leading-[1.14]">
          Tu equipo trabaja duro. <span class="ql-mark">La información, no.</span>
        </h2>
        <p class="mt-4 text-[15px] leading-relaxed text-[#42526e] lg:text-lg">
          Cuando el trabajo vive en cinco lugares distintos, se pierden horas, entregas y plata. Mira la diferencia.
        </p>

        <div class="ql-segmented mt-8" role="tablist" aria-label="Comparar antes y después">
          <span
            class="ql-segmented__thumb"
            :style="{ width: 'calc(50% - 0.25rem)', transform: mode === 'despues' ? 'translateX(100%)' : 'none' }"
            aria-hidden="true"
          />
          <button type="button" role="tab" :aria-selected="mode === 'antes'" aria-controls="ba-antes" @click="pick('antes')">
            Antes
          </button>
          <button type="button" role="tab" :aria-selected="mode === 'despues'" aria-controls="ba-despues" @click="pick('despues')">
            Con QuinList
          </button>
        </div>
      </div>

      <div class="relative mx-auto mt-10 max-w-4xl">
        <!-- ANTES: el caos -->
        <div
          id="ba-antes"
          role="tabpanel"
          class="ba-panel relative h-[380px] overflow-hidden rounded-[20px] border border-[#f0f1f2] bg-[#f0f1f2] sm:h-[420px]"
          :class="mode === 'antes' ? 'is-active' : ''"
          :aria-hidden="mode !== 'antes'"
        >
          <div
            class="pointer-events-none absolute inset-0 opacity-60"
            style="background-image: radial-gradient(rgba(23, 43, 77, 0.12) 1px, transparent 1px); background-size: 18px 18px"
            aria-hidden="true"
          />
          <ul>
            <li
              v-for="(c, i) in chaos"
              :key="c.label"
              class="ba-chip absolute flex max-w-[78%] items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold shadow-[0_8px_20px_-12px_rgba(23,43,77,0.45)] sm:max-w-[46%]"
              :class="[c.cls, c.pos]"
              :style="{ transitionDelay: `${i * 50}ms` }"
            >
              <component :is="c.icon" :size="16" class="shrink-0" aria-hidden="true" />
              <span class="truncate">{{ c.label }}</span>
            </li>
          </ul>
        </div>

        <!-- DESPUÉS: todo ordenado -->
        <div
          id="ba-despues"
          role="tabpanel"
          class="ba-panel absolute inset-0 overflow-hidden rounded-[20px] border border-[#cfe1fd] bg-white"
          :class="mode === 'despues' ? 'is-active' : ''"
          :aria-hidden="mode !== 'despues'"
        >
          <div class="flex items-center gap-2 bg-[#2a72a8] px-4 py-2.5 text-xs font-semibold text-white">
            <span class="flex h-5 w-5 items-center justify-center rounded bg-[#1d5d8c] text-[9px] font-extrabold">Q</span>
            Obra Sur · todo en un solo lugar
          </div>
          <ul class="grid h-[calc(100%-2.5rem)] content-start gap-2 overflow-y-auto p-4 sm:grid-cols-2 sm:gap-3 sm:p-6">
            <li
              v-for="(row, i) in landingBeforeAfter"
              :key="row.after"
              class="ba-row flex items-start gap-3 rounded-[20px] bg-[#f0f1f2] p-3 sm:p-4"
              :style="{ transitionDelay: `${120 + i * 60}ms` }"
            >
              <CheckCircle2 :size="20" class="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
              <span class="min-w-0">
                <span class="block text-[14px] font-semibold text-[#101214]">{{ row.after }}</span>
                <span class="mt-0.5 flex items-center gap-1 text-xs text-[#42526e]">
                  <X :size="12" class="text-red-600" aria-hidden="true" /> Antes: {{ row.before }}
                </span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ba-panel {
  opacity: 0;
  visibility: hidden;
  transform: scale(0.98);
  transition:
    opacity 0.45s ease,
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear 0.45s;
}

.ba-panel.is-active {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition-delay: 0s;
}

.ba-chip,
.ba-row {
  transition:
    opacity 0.5s ease,
    transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.ba-panel:not(.is-active) .ba-chip {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

.ba-panel:not(.is-active) .ba-row {
  opacity: 0;
  transform: translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .ba-panel,
  .ba-chip,
  .ba-row {
    transition: none;
  }
}
</style>
