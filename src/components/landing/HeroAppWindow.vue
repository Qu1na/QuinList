<script setup lang="ts">
/**
 * Réplica de la app real (header azul, escritorio de proyectos) para el hero.
 * Es HTML puro: pesa casi nada, se ve nítido y sale en el HTML prerenderizado.
 */
import { Bell, ChevronDown, CircleAlert, Clock, Plus, Search, TrendingUp } from '@lucide/vue'

const folders = [
  { name: 'Remodelación oficina', pct: 68, tone: '#5b8def' },
  { name: 'Campaña Q1', pct: 92, tone: '#2563eb' },
  { name: 'App clientes', pct: 41, tone: '#5b8def' },
  { name: 'Torre Sur', pct: 27, tone: '#3b6fd8' },
]
</script>

<template>
  <div class="relative mx-auto w-full max-w-[600px]" role="img" aria-label="Vista de la app QuinList: escritorio de proyectos con avance y tareas">
    <!-- Ventana de la app -->
    <div class="ql-window landing-product-frame" aria-hidden="true">
      <div class="ql-window__bar">
        <span class="ql-dots"><i /><i /><i /></span>
        <span class="mx-auto truncate text-[11px] font-medium text-[#5e6c84]">app.quinlist · Proyectos</span>
        <span class="w-10" />
      </div>

      <!-- Header azul, igual al de la app -->
      <div class="flex items-center gap-2 bg-[#2a72a8] px-3 py-2">
        <span class="flex h-6 w-6 items-center justify-center rounded-md bg-[#1d5d8c] text-[10px] font-extrabold text-white">Q</span>
        <span class="hidden shrink-0 items-center gap-1 rounded-md bg-[#1d5d8c] px-2 py-1 text-[10px] font-semibold text-white xl:inline-flex">
          Espacio de tu empresa <ChevronDown :size="11" />
        </span>
        <span class="flex min-w-0 flex-1 items-center gap-1.5 truncate whitespace-nowrap rounded-md bg-[#1d5d8c] px-2 py-1 text-[10px] text-white">
          <Search :size="11" class="shrink-0" /> <span class="truncate">Buscar tarjetas, proyectos…</span>
        </span>
        <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1d5d8c] px-2 py-1 text-[10px] font-semibold text-white">
          <Plus :size="11" /> Crear
        </span>
        <Bell :size="13" class="text-white" />
        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#6554c0] text-[9px] font-bold text-white">JE</span>
      </div>

      <!-- Escritorio de proyectos -->
      <div class="bg-white px-4 pb-5 pt-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="flex items-center gap-1.5 text-[15px] font-bold text-[#172b4d]">
              <span class="h-4 w-4 rounded border-2 border-[#f4845f]" /> Proyectos
            </p>
            <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#44546f]">
              <span><b class="text-[#172b4d]">4</b> proyectos</span>
              <span class="inline-flex items-center gap-0.5"><TrendingUp :size="10" class="text-[#2a72a8]" /><b class="text-[#172b4d]">57%</b> avance</span>
              <span class="inline-flex items-center gap-0.5"><Clock :size="10" class="text-emerald-600" /><b class="text-[#172b4d]">3</b> activos</span>
              <span class="inline-flex items-center gap-0.5 text-red-700"><CircleAlert :size="10" /><b>1</b> vencido</span>
            </div>
          </div>
          <span class="shrink-0 whitespace-nowrap rounded-lg bg-[#f4845f] px-2.5 py-1.5 text-[10px] font-bold text-[#1a2b4a]">+ Nuevo proyecto</span>
        </div>

        <ul class="mt-5 grid grid-cols-4 gap-2">
          <li v-for="f in folders" :key="f.name" class="flex flex-col items-center gap-1.5 text-center">
            <span class="relative block h-11 w-14">
              <span class="absolute left-0 top-0 h-3 w-6 rounded-t-md" :style="{ background: f.tone }" />
              <span class="absolute inset-x-0 bottom-0 top-1.5 rounded-md" :style="{ background: f.tone }" />
              <span class="absolute -bottom-1.5 -right-1.5 rounded-full bg-[#172b4d] px-1.5 py-0.5 text-[8px] font-bold text-white">{{ f.pct }}%</span>
            </span>
            <span class="mt-1 line-clamp-2 text-[10px] font-medium leading-tight text-[#172b4d]">{{ f.name }}</span>
          </li>
        </ul>

        <div class="mt-5 grid grid-cols-3 gap-2">
          <div class="rounded-lg bg-[#eef5fb] p-2.5">
            <p class="text-[9px] font-semibold text-[#44546f]">Tareas de hoy</p>
            <p class="text-base font-extrabold text-[#172b4d]">12</p>
          </div>
          <div class="rounded-lg bg-[#fff3ee] p-2.5">
            <p class="text-[9px] font-semibold text-[#44546f]">Por vencer</p>
            <p class="text-base font-extrabold text-[#172b4d]">5</p>
          </div>
          <div class="rounded-lg bg-emerald-50 p-2.5">
            <p class="text-[9px] font-semibold text-[#44546f]">Presupuesto</p>
            <p class="text-base font-extrabold text-[#172b4d]">54%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
