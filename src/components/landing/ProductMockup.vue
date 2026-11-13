<script setup lang="ts">
import { CheckCircle2, Search } from '@lucide/vue'
</script>

<template>
  <div class="relative mx-auto w-full max-w-[520px]">
    <div
      class="landing-product-frame overflow-hidden rounded-xl border border-[#e4e9f0] bg-white shadow-[0_25px_60px_-24px_rgba(15,28,51,0.35)]"
      role="img"
      aria-label="Vista previa de QuinList: sidebar, tablero Kanban y tarjetas de tareas"
    >
      <!-- App chrome -->
      <div class="flex items-center gap-2 border-b border-[#ececec] bg-[#f8f8f8] px-3 py-2.5">
        <span class="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span class="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span class="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <div class="ml-2 flex flex-1 items-center gap-2 rounded-md bg-white px-2.5 py-1 text-[10px] text-[#666] ring-1 ring-[#eee]">
          <Search :size="11" aria-hidden="true" />
          Buscar en el workspace…
        </div>
      </div>

      <div class="flex min-h-[280px]">
        <!-- Mini sidebar -->
        <aside class="hidden w-[118px] shrink-0 border-r border-[#eee] bg-[#fafafa] p-2.5 sm:block" aria-hidden="true">
          <div class="mb-3 flex items-center gap-1.5 px-1">
            <span class="flex h-5 w-5 items-center justify-center rounded-md bg-[#2d7eb8] text-[9px] font-bold text-white">Q</span>
            <span class="truncate text-[11px] font-semibold text-[#172b4d]">QuinList</span>
          </div>
          <div class="space-y-1">
            <div class="rounded-md bg-[#e6f4fb] px-2 py-1.5 text-[10px] font-semibold text-[#2a72a8]">Tableros</div>
            <div class="px-2 py-1.5 text-[10px] text-[#666]">Proyectos</div>
            <div class="px-2 py-1.5 text-[10px] text-[#666]">Calendario</div>
            <div class="px-2 py-1.5 text-[10px] text-[#666]">Equipo</div>
            <div class="px-2 py-1.5 text-[10px] text-[#666]">Reportes</div>
          </div>
          <div class="mt-4 border-t border-[#eee] pt-3">
            <p class="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-wide text-[#666]">En línea</p>
            <div class="flex -space-x-1.5 px-1">
              <span class="h-5 w-5 rounded-full bg-[#f4845f] ring-2 ring-white" />
              <span class="h-5 w-5 rounded-full bg-[#5e6c84] ring-2 ring-white" />
              <span class="h-5 w-5 rounded-full bg-[#172b4d] ring-2 ring-white" />
            </div>
          </div>
        </aside>

        <!-- Board -->
        <div class="min-w-0 flex-1 bg-white p-3">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <p class="text-[13px] font-bold text-[#2d2d2d]">Sprint 14 · Producto</p>
              <p class="text-[10px] text-[#666]">12 tareas · 4 en curso</p>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="rounded-full bg-[#e8f6fc] px-2 py-0.5 text-[9px] font-semibold text-[#2a72a8]">Kanban</span>
              <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <!-- Col: Por hacer -->
            <div class="space-y-2">
              <div class="flex items-center justify-between px-0.5">
                <span class="text-[10px] font-bold uppercase tracking-wide text-[#666]">Por hacer</span>
                <span class="text-[10px] font-semibold text-[#666]">3</span>
              </div>
              <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 shadow-sm">
                <div class="mb-1.5 flex items-center gap-1">
                  <span class="h-1.5 w-1.5 rounded-full bg-[#f4845f]" />
                  <span class="text-[9px] font-semibold text-[#c2410c]">Alta</span>
                </div>
                <p class="text-[11px] font-semibold leading-snug text-[#2d2d2d]">Rediseñar onboarding</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="rounded bg-white px-1.5 py-0.5 text-[8px] font-medium text-[#666] ring-1 ring-[#eee]">UX</span>
                  <span class="h-4 w-4 rounded-full bg-[#5bbce4]" />
                </div>
              </div>
              <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 shadow-sm">
                <p class="text-[11px] font-semibold leading-snug text-[#2d2d2d]">API de notificaciones</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="rounded bg-white px-1.5 py-0.5 text-[8px] font-medium text-[#666] ring-1 ring-[#eee]">Backend</span>
                  <span class="text-[9px] text-[#666]">Vie</span>
                </div>
              </div>
              <div class="rounded-lg border border-dashed border-[#e5e5e5] bg-white/60 p-2">
                <p class="text-[11px] font-medium text-[#666]">Brief de campaña Q3</p>
              </div>
            </div>

            <!-- Col: En curso -->
            <div class="space-y-2">
              <div class="flex items-center justify-between px-0.5">
                <span class="text-[10px] font-bold uppercase tracking-wide text-[#2a72a8]">En curso</span>
                <span class="text-[10px] font-semibold text-[#666]">2</span>
              </div>
              <div class="rounded-lg border border-[#5bbce4]/35 bg-white p-2 shadow-md ring-1 ring-[#5bbce4]/15">
                <div class="mb-1.5 flex items-center justify-between">
                  <span class="rounded-full bg-[#e8f6fc] px-1.5 py-0.5 text-[8px] font-bold text-[#2a72a8]">En progreso</span>
                  <span class="text-[9px] font-medium text-[#c2410c]">Hoy</span>
                </div>
                <p class="text-[11px] font-semibold leading-snug text-[#2d2d2d]">Integrar calendario</p>
                <div class="mt-2 h-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                  <div class="h-full w-2/3 rounded-full bg-[#5bbce4]" />
                </div>
                <div class="mt-2 flex -space-x-1">
                  <span class="h-4 w-4 rounded-full bg-[#2a72a8] ring-2 ring-white" />
                  <span class="h-4 w-4 rounded-full bg-[#2d2d2d] ring-2 ring-white" />
                </div>
              </div>
              <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 shadow-sm">
                <p class="text-[11px] font-semibold leading-snug text-[#2d2d2d]">Permisos por rol</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="rounded bg-white px-1.5 py-0.5 text-[8px] font-medium text-[#666] ring-1 ring-[#eee]">Admin</span>
                  <span class="h-4 w-4 rounded-full bg-[#2a72a8]" />
                </div>
              </div>
            </div>

            <!-- Col: Hecho -->
            <div class="space-y-2">
              <div class="flex items-center justify-between px-0.5">
                <span class="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Hecho</span>
                <span class="text-[10px] font-semibold text-[#666]">2</span>
              </div>
              <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 shadow-sm">
                <div class="mb-1 flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 :size="11" aria-hidden="true" />
                  <span class="text-[9px] font-semibold">Completado</span>
                </div>
                <p class="text-[11px] font-semibold leading-snug text-[#555] line-through decoration-[#999]">
                  Setup de workspaces
                </p>
              </div>
              <div class="rounded-lg border border-[#eee] bg-[#fafafa] p-2 shadow-sm">
                <div class="mb-1 flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 :size="11" aria-hidden="true" />
                  <span class="text-[9px] font-semibold">Completado</span>
                </div>
                <p class="text-[11px] font-semibold leading-snug text-[#555] line-through decoration-[#999]">
                  Dashboard métricas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
