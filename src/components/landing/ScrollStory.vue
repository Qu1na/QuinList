<script setup lang="ts">
/**
 * Historia con scroll: a la izquierda avanzan los capítulos; a la derecha una ventana fija
 * (sticky) cambia de escena según el capítulo activo, con una barra de progreso.
 *
 * Rendimiento: el capítulo activo se detecta con IntersectionObserver (no con cálculos en
 * cada scroll) y la barra de progreso usa un solo listener con requestAnimationFrame que
 * solo trabaja mientras la sección está en pantalla. Respeta “reducir movimiento”.
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight } from '@lucide/vue'
import SolutionVisual from '@/components/marketing/SolutionVisual.vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import type { IconName, VisualKind } from '@/seo/showcase'

const chapters: {
  key: string
  icon: IconName
  label: string
  title: string
  text: string
  points: string[]
  visual: VisualKind
  visualLabel: string
  to: string
}[] = [
  {
    key: 'organiza',
    icon: 'LayoutGrid',
    label: 'Organiza',
    title: 'Todo el trabajo, visible en un tablero',
    text: 'Cada tarea es una tarjeta con responsable, fecha y prioridad. El equipo la mueve de “Por hacer” a “Hecho” y todos ven lo mismo, en tiempo real.',
    points: ['Arrastrar y soltar', 'Checklist y adjuntos', 'Comentarios y menciones'],
    visual: 'kanban',
    visualLabel: 'Tablero Kanban de QuinList',
    to: '/tablero-kanban-online',
  },
  {
    key: 'planea',
    icon: 'SquareChartGantt',
    label: 'Planea',
    title: 'El cronograma se arma solo',
    text: 'Pon fecha de inicio y fin a las tareas y el diagrama de Gantt aparece listo, con la línea de hoy para ver qué va atrasado.',
    points: ['Gantt automático', 'Hitos con progreso', 'Lista, Kanban y Gantt'],
    visual: 'gantt',
    visualLabel: 'Diagrama de Gantt de QuinList',
    to: '/diagrama-de-gantt-online',
  },
  {
    key: 'controla',
    icon: 'CircleDollarSign',
    label: 'Controla el dinero',
    title: 'Las tareas y la plata, juntas',
    text: 'Cada proyecto tiene su caja: presupuesto, ingresos, egresos, flujo de caja y rentabilidad, en la moneda de tu cliente.',
    points: ['Libro mayor', 'Flujo de caja mensual', '9 monedas'],
    visual: 'finance',
    visualLabel: 'Finanzas de un proyecto en QuinList',
    to: '/control-de-presupuesto-de-proyectos',
  },
  {
    key: 'coordina',
    icon: 'MessagesSquare',
    label: 'Coordina',
    title: 'La conversación, junto al trabajo',
    text: 'Chat de equipo con canales, menciones y presencia. Las decisiones quedan escritas, no perdidas en un audio de WhatsApp.',
    points: ['Canales y menciones', 'Quién está en línea', 'Notificaciones'],
    visual: 'chat',
    visualLabel: 'Chat de equipo de QuinList',
    to: '/gestion-de-proyectos-para-equipos-remotos',
  },
  {
    key: 'decide',
    icon: 'Cpu',
    label: 'Decide con IA',
    title: 'Pregúntale a tu proyecto',
    text: '“¿Qué está atrasado?”, “Resume el avance para el cliente”. El asistente conoce tus tableros y proyectos y responde con ese contexto.',
    points: ['Detecta atrasos', 'Resume el avance', 'Redacta tareas'],
    visual: 'ai',
    visualLabel: 'Asistente de IA de QuinList',
    to: '/gestion-de-proyectos-con-ia',
  },
]

const active = ref(0)
const progress = ref(0)
const section = ref<HTMLElement | null>(null)
const markers = ref<HTMLElement[]>([])
let io: IntersectionObserver | null = null
let sectionIo: IntersectionObserver | null = null
let raf = 0
let inView = false
const dim = ref(false)

function measure() {
  raf = 0
  const el = section.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const total = r.height - window.innerHeight
  progress.value = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0
}

function onScroll() {
  if (!inView || raf) return
  raf = requestAnimationFrame(measure)
}

function goTo(i: number) {
  markers.value[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) active.value = Number((e.target as HTMLElement).dataset.index ?? 0)
      }
    },
    { rootMargin: '-45% 0px -45% 0px' },
  )
  markers.value.forEach((m) => io!.observe(m))

  sectionIo = new IntersectionObserver(([e]) => {
    inView = !!e?.isIntersecting
    dim.value = inView
    if (inView) onScroll()
  })
  if (section.value) sectionIo.observe(section.value)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  io?.disconnect()
  sectionIo?.disconnect()
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <section id="como-funciona" ref="section" class="ql-story relative bg-white py-12 lg:py-16" aria-labelledby="story-heading">
    <div class="mx-auto max-w-[1200px] px-5 lg:px-8">
      <h2 id="story-heading" class="sr-only">Cómo funciona QuinList</h2>

      <div class="lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <!-- Capítulos -->
        <ol class="relative" :class="dim ? 'is-dim' : ''">
          <li
            v-for="(c, i) in chapters"
            :key="c.key"
            ref="markers"
            :data-index="i"
            class="story-step relative pb-14 last:pb-0 lg:flex lg:min-h-[72vh] lg:flex-col lg:justify-center lg:pb-0"
            :class="active === i ? 'is-active' : ''"
          >
            <button
              type="button"
              class="flex items-center gap-3 text-left"
              :aria-current="active === i ? 'step' : undefined"
              @click="goTo(i)"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-200"
                :class="active === i ? 'border-[#101214] text-[#101214]' : 'border-[#dfe1e6] text-[#42526e]'"
              >
                <MktIcon :name="c.icon" :size="20" :stroke-width="1.4" />
              </span>
              <span class="text-sm font-bold uppercase tracking-[0.08em] text-[#42526e]">
                {{ String(i + 1).padStart(2, '0') }} · {{ c.label }}
              </span>
            </button>
            <h3 class="mt-4 text-2xl font-bold leading-tight text-[#101214] lg:text-[2rem]">{{ c.title }}</h3>
            <p class="mt-3 text-[15px] leading-relaxed text-[#42526e] lg:text-base">{{ c.text }}</p>
            <ul class="mt-4 flex flex-wrap gap-2">
              <li v-for="p in c.points" :key="p" class="rounded-full bg-[#f0f1f2] px-3 py-1 text-[13px] font-medium text-[#42526e]">
                {{ p }}
              </li>
            </ul>
            <RouterLink :to="c.to" class="ql-link mt-5 text-[15px]">
              Conocer más <ArrowRight :size="15" aria-hidden="true" />
            </RouterLink>

            <!-- En celular, cada capítulo trae su propia ilustración -->
            <div class="ql-shot mt-8 p-5 lg:hidden">
              <div class="ql-shot__tilt"><SolutionVisual :kind="c.visual" :label="c.visualLabel" /></div>
            </div>
          </li>
        </ol>

        <!-- Ventana fija (escritorio) -->
        <div class="hidden lg:block" aria-hidden="true">
          <div class="sticky top-[calc(50vh-15rem)]">
            <div class="mb-5 flex items-center gap-3">
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0f1f2]">
                <div class="h-full origin-left rounded-full bg-[#1868db]" :style="{ transform: `scaleX(${progress})` }" />
              </div>
              <span class="w-16 text-right text-xs font-bold tabular-nums text-[#42526e]">{{ active + 1 }} / {{ chapters.length }}</span>
            </div>
            <div class="relative h-[30rem] rounded-[20px] bg-[#1868db] p-8">
              <div
                v-for="(c, i) in chapters"
                :key="c.key"
                class="ql-scene flex items-center justify-center p-6"
                :class="active === i ? 'is-active' : ''"
              >
                <SolutionVisual :kind="c.visual" :label="c.visualLabel" />
              </div>
            </div>
            <div class="mt-5 flex justify-center gap-2">
              <span
                v-for="(c, i) in chapters"
                :key="c.key"
                class="h-1.5 rounded-full transition-all duration-300"
                :class="active === i ? 'w-8 bg-[#1868db]' : 'w-1.5 bg-[#b7b9be]'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@media (min-width: 1024px) {
  .story-step {
    transition: opacity 0.4s ease;
  }

  /* Solo atenúa mientras la sección está en pantalla (el capítulo activo queda al 100%). */
  .is-dim .story-step:not(.is-active) {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-step {
    transition: none;
  }
}
</style>
