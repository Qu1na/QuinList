<script setup lang="ts">
/**
 * Ilustraciones del producto para las páginas de solución. Son HTML (no imágenes): pesan casi
 * nada, se ven nítidas en cualquier pantalla y salen en el HTML prerenderizado.
 */
import { Bot, Check, CheckCircle2, Hash, Send, Sparkles, TriangleAlert, Webhook, Zap } from '@lucide/vue'
import ProductMockup from '@/components/landing/ProductMockup.vue'
import type { VisualKind } from '@/seo/showcase'

defineProps<{ kind: VisualKind; label: string }>()

const ganttRows = [
  { name: 'Diseño', start: 0, span: 28, color: 'bg-emerald-400', done: true },
  { name: 'Contenido', start: 18, span: 30, color: 'bg-emerald-400', done: true },
  { name: 'Desarrollo', start: 34, span: 38, color: 'bg-[#5bbce4]' },
  { name: 'Pruebas', start: 62, span: 20, color: 'bg-[#f4845f]' },
  { name: 'Lanzamiento', start: 82, span: 14, color: 'bg-[#cbd5e1]' },
]
const tasks = [
  { t: 'Enviar cotización al cliente', who: 'AR', date: 'Hoy', prio: 'Alta', done: false },
  { t: 'Revisar planos v2', who: 'JM', date: 'Mañana', prio: 'Media', done: false },
  { t: 'Comprar materiales', who: 'LC', date: 'Vie', prio: 'Alta', done: false },
  { t: 'Acta de inicio firmada', who: 'AR', date: 'Lun', prio: 'Baja', done: true },
  { t: 'Kickoff con el equipo', who: 'JM', date: 'Lun', prio: 'Media', done: true },
]
const clients = [
  { c: 'Café Andino', p: 'Campaña de lanzamiento', s: 'En curso', pct: 72, r: '31%' },
  { c: 'Clínica Norte', p: 'Sitio web', s: 'Revisión', pct: 90, r: '24%' },
  { c: 'Moda Sur', p: 'Redes sociales', s: 'En curso', pct: 45, r: '18%' },
  { c: 'Grupo Delta', p: 'Branding', s: 'Por iniciar', pct: 8, r: '—' },
]
const risks = [
  { r: 'Retraso en entrega de acero', sev: 'Crítica', cls: 'bg-red-100 text-red-800', st: 'Abierto' },
  { r: 'Lluvias en fase de cimentación', sev: 'Alta', cls: 'bg-orange-100 text-orange-800', st: 'Mitigado' },
  { r: 'Cambio de diseño en fachada', sev: 'Media', cls: 'bg-amber-100 text-amber-800', st: 'Abierto' },
  { r: 'Permiso de ruido nocturno', sev: 'Baja', cls: 'bg-emerald-100 text-emerald-800', st: 'Cerrado' },
]
</script>

<template>
  <div class="mkt-visual relative mx-auto w-full max-w-[520px]" role="img" :aria-label="label">
    <!-- Kanban -->
    <ProductMockup v-if="kind === 'kanban'" />

    <div v-else class="ql-window landing-product-frame" aria-hidden="true">
      <div class="ql-window__bar">
        <span class="ql-dots"><i /><i /><i /></span>
        <span class="mx-auto truncate text-[11px] font-medium text-[#5e6c84]">app.quinlist</span>
        <span class="w-10" />
      </div>
      <!-- Header azul de la app -->
      <div class="flex items-center gap-2 bg-[#2a72a8] px-3 py-2 text-white">
        <span class="flex h-5 w-5 items-center justify-center rounded bg-[#1d5d8c] text-[9px] font-extrabold">Q</span>
        <span class="truncate text-[11px] font-semibold">
          {{
            {
              dashboard: 'Remodelación oficina · Dashboard',
              gantt: 'Lanzamiento web · Cronograma',
              finance: 'Remodelación oficina · Finanzas',
              ai: 'Asistente de IA',
              tasks: 'Mis tareas',
              automation: 'Tablero Ventas · Integraciones',
              clients: 'Proyectos por cliente',
              risks: 'Torre Sur · Riesgos e incidencias',
              chat: 'Chat · #equipo',
              kanban: '',
            }[kind]
          }}
        </span>
      </div>

      <div class="bg-white p-4 text-[#172b4d]">
        <!-- Dashboard de proyecto -->
        <template v-if="kind === 'dashboard'">
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-xl bg-[#fff5f0] p-3">
              <p class="text-[10px] font-semibold text-[#666]">Avance</p>
              <p class="text-xl font-extrabold">68%</p>
            </div>
            <div class="rounded-xl bg-[#e8f6fc] p-3">
              <p class="text-[10px] font-semibold text-[#666]">Pendientes</p>
              <p class="text-xl font-extrabold">14</p>
            </div>
            <div class="rounded-xl bg-emerald-50 p-3">
              <p class="text-[10px] font-semibold text-[#666]">Presupuesto</p>
              <p class="text-xl font-extrabold">54%</p>
            </div>
          </div>
          <div class="mt-3 h-2 rounded-full bg-[#f0f0f0]"><div class="h-2 w-[68%] rounded-full bg-[#f4845f]" /></div>
          <p class="mt-4 text-[11px] font-bold uppercase tracking-wide text-[#666]">Próximos vencimientos</p>
          <ul class="mt-2 space-y-2 text-xs">
            <li class="flex items-center justify-between rounded-lg border border-[#eee] px-3 py-2">
              <span class="font-semibold">Entrega de planos</span><span class="font-semibold text-[#c2410c]">Hoy</span>
            </li>
            <li class="flex items-center justify-between rounded-lg border border-[#eee] px-3 py-2">
              <span class="font-semibold">Hito: obra gris</span><span class="text-[#555]">Vie 21</span>
            </li>
            <li class="flex items-center justify-between rounded-lg border border-[#eee] px-3 py-2">
              <span class="font-semibold">Aprobación de acabados</span><span class="text-[#555]">Lun 24</span>
            </li>
          </ul>
        </template>

        <!-- Gantt -->
        <template v-else-if="kind === 'gantt'">
          <div class="mb-2 grid grid-cols-[84px_1fr] text-[10px] font-semibold text-[#666]">
            <span />
            <div class="grid grid-cols-4"><span>Oct</span><span>Nov</span><span>Dic</span><span>Ene</span></div>
          </div>
          <div class="relative space-y-2.5">
            <div class="absolute bottom-0 top-0 w-px bg-[#c2410c]" style="left: calc(84px + (100% - 84px) * 0.55)">
              <span class="absolute -top-1 -translate-x-1/2 rounded bg-[#c2410c] px-1 text-[9px] font-bold text-white">Hoy</span>
            </div>
            <div v-for="r in ganttRows" :key="r.name" class="grid grid-cols-[84px_1fr] items-center">
              <span class="truncate text-[11px] font-semibold">{{ r.name }}</span>
              <div class="relative h-5 rounded bg-[#f6f6f6]">
                <div
                  class="absolute inset-y-0 rounded"
                  :class="r.color"
                  :style="{ left: `${r.start}%`, width: `${r.span}%` }"
                />
              </div>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-3 text-[10px] font-semibold text-[#555]">
            <span class="inline-flex items-center gap-1"><i class="h-2 w-2 rounded-full bg-emerald-400" />Completada</span>
            <span class="inline-flex items-center gap-1"><i class="h-2 w-2 rounded-full bg-[#5bbce4]" />En curso</span>
            <span class="inline-flex items-center gap-1"><i class="h-2 w-2 rounded-full bg-[#f4845f]" />Atención</span>
          </div>
        </template>

        <!-- Finanzas -->
        <template v-else-if="kind === 'finance'">
          <div class="rounded-2xl bg-[#1a2b4a] p-4 text-white">
            <p class="text-[11px] text-white/75">Saldo disponible · COP</p>
            <p class="mt-1 text-2xl font-extrabold tracking-tight">$ 18.400.000</p>
            <div class="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <div><p class="text-white/75">Presupuesto</p><p class="font-bold">$ 40 M</p></div>
              <div><p class="text-white/75">Ingresos</p><p class="font-bold text-emerald-300">+ $ 12 M</p></div>
              <div><p class="text-white/75">Rentab.</p><p class="font-bold text-emerald-300">23%</p></div>
            </div>
          </div>
          <div class="mt-4 flex h-20 items-end gap-2">
            <div v-for="(h, i) in [40, 65, 30, 80, 55, 70]" :key="i" class="flex-1 rounded-t bg-[#5bbce4]/70" :style="{ height: `${h}%` }" />
          </div>
          <p class="mt-1 text-center text-[10px] font-semibold text-[#666]">Flujo de caja mensual</p>
          <ul class="mt-3 divide-y divide-[#f3f3f3] text-xs">
            <li class="flex justify-between py-1.5"><span>Anticipo del cliente</span><span class="font-bold text-emerald-700">+ $ 12.000.000</span></li>
            <li class="flex justify-between py-1.5"><span>Materiales</span><span class="font-bold text-red-700">− $ 9.800.000</span></li>
          </ul>
        </template>

        <!-- IA -->
        <template v-else-if="kind === 'ai'">
          <div class="space-y-3 text-xs">
            <div class="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-[#1a2b4a] px-3 py-2 text-white">
              ¿Qué está atrasado esta semana?
            </div>
            <div class="flex gap-2">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Bot :size="15" /></span>
              <div class="rounded-2xl rounded-tl-sm bg-[#f6f5ff] px-3 py-2 leading-relaxed">
                Hay <strong>3 tareas vencidas</strong> en “Lanzamiento web”:
                <ul class="mt-1.5 space-y-1">
                  <li class="flex gap-1.5"><TriangleAlert :size="13" class="mt-0.5 shrink-0 text-red-700" /> Pruebas de pago (2 días)</li>
                  <li class="flex gap-1.5"><TriangleAlert :size="13" class="mt-0.5 shrink-0 text-red-700" /> Textos legales (1 día)</li>
                  <li class="flex gap-1.5"><TriangleAlert :size="13" class="mt-0.5 shrink-0 text-amber-700" /> Fotos de producto (hoy)</li>
                </ul>
                <p class="mt-1.5">Te sugiero empezar por las pruebas de pago: bloquean el lanzamiento.</p>
              </div>
            </div>
            <div class="flex items-center gap-2 rounded-full border border-[#eee] px-3 py-2 text-[#666]">
              <Sparkles :size="14" class="text-violet-600" /> Pregunta sobre tus proyectos…
              <Send :size="14" class="ml-auto" />
            </div>
          </div>
        </template>

        <!-- Tareas -->
        <template v-else-if="kind === 'tasks'">
          <ul class="space-y-2 text-xs">
            <li
              v-for="t in tasks"
              :key="t.t"
              class="flex items-center gap-3 rounded-lg border border-[#eee] px-3 py-2"
              :class="t.done ? 'bg-[#fafafa]' : 'bg-white'"
            >
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                :class="t.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[#ccc]'"
              >
                <Check v-if="t.done" :size="11" />
              </span>
              <span class="flex-1 truncate font-semibold" :class="t.done ? 'text-[#666] line-through' : ''">{{ t.t }}</span>
              <span
                class="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                :class="t.prio === 'Alta' ? 'bg-red-50 text-red-800' : t.prio === 'Media' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'"
              >{{ t.prio }}</span>
              <span class="w-12 text-right text-[10px] font-semibold text-[#555]">{{ t.date }}</span>
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8f6fc] text-[9px] font-bold text-[#2a72a8]">{{ t.who }}</span>
            </li>
          </ul>
          <div class="mt-3 flex items-center justify-between rounded-lg bg-[#fff5f0] px-3 py-2 text-[11px] font-semibold">
            <span>Avance del proyecto</span><span class="text-[#c2410c]">40% · se calcula solo</span>
          </div>
        </template>

        <!-- Automatización -->
        <template v-else-if="kind === 'automation'">
          <div class="flex flex-col items-stretch gap-2 text-xs">
            <div class="rounded-xl border border-[#eee] p-3">
              <p class="text-[10px] font-bold uppercase tracking-wide text-[#666]">Cuando</p>
              <p class="mt-1 font-semibold">“Propuesta Café Andino” se mueve a <span class="rounded bg-emerald-50 px-1 text-emerald-800">Ganado</span></p>
            </div>
            <div class="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Zap :size="13" /></div>
            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-xl border border-[#eee] p-3">
                <p class="flex items-center gap-1 font-bold"><Hash :size="13" class="text-[#4A154B]" /> Slack</p>
                <p class="mt-1 text-[11px] text-[#555]">Aviso en #ventas</p>
              </div>
              <div class="rounded-xl border border-[#eee] p-3">
                <p class="flex items-center gap-1 font-bold"><Webhook :size="13" class="text-[#c2410c]" /> Webhook</p>
                <p class="mt-1 text-[11px] text-[#555]">n8n · Make · Zapier</p>
              </div>
            </div>
            <div class="rounded-xl bg-[#1a2b4a] p-3 font-mono text-[10px] leading-relaxed text-emerald-300">
              { "event": "card_moved", "board": "Ventas",<br />&nbsp;&nbsp;"title": "Propuesta Café Andino" }
            </div>
          </div>
        </template>

        <!-- Clientes (agencias) -->
        <template v-else-if="kind === 'clients'">
          <ul class="space-y-2 text-xs">
            <li v-for="c in clients" :key="c.c" class="rounded-lg border border-[#eee] p-3">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold">{{ c.c }}</span>
                <span class="rounded-full bg-[#e8f6fc] px-2 py-0.5 text-[9px] font-bold text-[#2a72a8]">{{ c.s }}</span>
              </div>
              <div class="mt-1 flex items-center justify-between text-[11px] text-[#555]">
                <span>{{ c.p }}</span><span>Rentabilidad <strong class="text-emerald-700">{{ c.r }}</strong></span>
              </div>
              <div class="mt-2 h-1.5 rounded-full bg-[#f0f0f0]"><div class="h-1.5 rounded-full bg-[#f4845f]" :style="{ width: `${c.pct}%` }" /></div>
            </li>
          </ul>
        </template>

        <!-- Riesgos (construcción) -->
        <template v-else-if="kind === 'risks'">
          <div class="mb-3 grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-xl bg-red-50 p-3"><p class="text-[10px] font-semibold text-red-800">Críticos abiertos</p><p class="text-xl font-extrabold text-red-800">1</p></div>
            <div class="rounded-xl bg-amber-50 p-3"><p class="text-[10px] font-semibold text-amber-800">Riesgos abiertos</p><p class="text-xl font-extrabold text-amber-800">2</p></div>
          </div>
          <ul class="space-y-2 text-xs">
            <li v-for="r in risks" :key="r.r" class="flex items-center gap-2 rounded-lg border border-[#eee] px-3 py-2">
              <span class="flex-1 truncate font-semibold">{{ r.r }}</span>
              <span class="rounded-full px-2 py-0.5 text-[9px] font-bold" :class="r.cls">{{ r.sev }}</span>
              <span class="w-14 text-right text-[10px] text-[#555]">{{ r.st }}</span>
            </li>
          </ul>
        </template>

        <!-- Chat (equipos remotos) -->
        <template v-else-if="kind === 'chat'">
          <div class="mb-3 flex items-center gap-2 text-[11px] text-[#555]">
            <span class="flex -space-x-1.5">
              <span class="h-6 w-6 rounded-full bg-[#f4845f] ring-2 ring-white" />
              <span class="h-6 w-6 rounded-full bg-[#5bbce4] ring-2 ring-white" />
              <span class="h-6 w-6 rounded-full bg-[#1a2b4a] ring-2 ring-white" />
            </span>
            <span class="inline-flex items-center gap-1"><i class="h-2 w-2 rounded-full bg-emerald-500" /> 3 en línea · Bogotá, CDMX, Lima</span>
          </div>
          <ul class="space-y-3 text-xs">
            <li class="flex gap-2">
              <span class="h-7 w-7 shrink-0 rounded-full bg-[#f4845f]" />
              <div><p class="font-bold">Ana <span class="font-normal text-[#666]">9:02</span></p><p class="mt-0.5">Subí el brief final a la tarjeta 👌</p></div>
            </li>
            <li class="flex gap-2">
              <span class="h-7 w-7 shrink-0 rounded-full bg-[#5bbce4]" />
              <div><p class="font-bold">Luis <span class="font-normal text-[#666]">9:05</span></p><p class="mt-0.5"><span class="rounded bg-[#e8f6fc] px-1 font-semibold text-[#2a72a8]">@Ana</span> perfecto, lo muevo a revisión.</p></div>
            </li>
            <li class="flex gap-2">
              <span class="h-7 w-7 shrink-0 rounded-full bg-[#1a2b4a]" />
              <div>
                <p class="font-bold">Sofía <span class="font-normal text-[#666]">9:06</span></p>
                <p class="mt-0.5 inline-flex items-center gap-1 rounded-lg border border-[#eee] px-2 py-1"><CheckCircle2 :size="12" class="text-emerald-700" /> Movió “Brief campaña” a Revisión</p>
              </div>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </div>
</template>
