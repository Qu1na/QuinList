<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppLogo from '@/components/brand/AppLogo.vue'

const year = new Date().getFullYear()
const route = useRoute()
const searchQuery = computed(() => {
  const q = route.query.q
  return typeof q === 'string' ? q.trim() : ''
})
</script>

<template>
  <div class="min-h-full bg-white text-[#2d2d2d]">
    <header class="border-b border-[#eee]">
      <div class="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
        <RouterLink to="/" class="flex items-center gap-2" aria-label="QuinList — volver al inicio">
          <AppLogo size="sm" />
          <span class="text-sm font-bold">QuinList</span>
        </RouterLink>
        <RouterLink to="/register" class="text-sm font-semibold text-[#f4845f] hover:underline">
          Comenzar gratis
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-5 py-12">
      <nav class="text-sm text-[#888]" aria-label="Miga de pan">
        <RouterLink to="/" class="hover:text-[#2d2d2d]">Inicio</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-[#2d2d2d]">Centro de ayuda</span>
      </nav>

      <h1 class="mt-6 text-3xl font-extrabold tracking-tight">
        Centro de ayuda — software de gestión de proyectos
      </h1>
      <p class="mt-3 text-[#666] leading-relaxed">
        Encuentra respuestas sobre QuinList: gestor de proyectos, tablero Kanban, workspace,
        administración de equipos, task manager y colaboración en tiempo real.
      </p>

      <p v-if="searchQuery" class="mt-4 rounded-xl border border-[#eee] bg-[#fafafa] px-4 py-3 text-sm text-[#555]">
        Resultados relacionados con:
        <span class="font-semibold text-[#2d2d2d]">“{{ searchQuery }}”</span>
      </p>

      <section class="mt-10 space-y-8">
        <article>
          <h2 class="text-xl font-bold">Primeros pasos con QuinList</h2>
          <p class="mt-2 text-sm leading-relaxed text-[#666]">
            Crea tu cuenta, invita a tu equipo y configura tu primer espacio de trabajo. Desde el
            dashboard podrás planificar proyectos, crear tableros Kanban y asignar tareas en minutos.
          </p>
        </article>
        <article>
          <h2 class="text-xl font-bold">Gestión de tareas y project tracker</h2>
          <p class="mt-2 text-sm leading-relaxed text-[#666]">
            Organiza el trabajo con columnas, prioridades, fechas límite, responsables, comentarios
            y archivos adjuntos. El control de tareas queda visible para todo el equipo.
          </p>
        </article>
        <article>
          <h2 class="text-xl font-bold">Soporte y contacto</h2>
          <p class="mt-2 text-sm leading-relaxed text-[#666]">
            Escríbenos a
            <a class="font-medium text-[#f4845f] hover:underline" href="mailto:contacto@matubyte.com"
              >contacto@matubyte.com</a
            >
            o solicita una demostración desde la
            <RouterLink to="/#contacto" class="font-medium text-[#f4845f] hover:underline"
              >landing</RouterLink
            >.
          </p>
        </article>
      </section>

      <div class="mt-12 flex flex-wrap gap-3">
        <RouterLink
          to="/register"
          class="inline-flex rounded-full bg-[#f4845f] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e8754f]"
        >
          Crear cuenta
        </RouterLink>
        <RouterLink
          to="/login"
          class="inline-flex rounded-full border-2 border-[#2d2d2d] px-6 py-2.5 text-sm font-semibold hover:bg-[#2d2d2d] hover:text-white"
        >
          Iniciar sesión
        </RouterLink>
      </div>
    </main>

    <footer class="border-t border-[#eee] py-8 text-center text-sm text-[#888]">
      <p>© {{ year }} QuinList · MatuByte S.A.S.</p>
    </footer>
  </div>
</template>
