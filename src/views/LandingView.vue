<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Play, Star, LayoutGrid, FolderKanban, Radio, Menu, X } from '@lucide/vue'
import AppLogo from '@/components/brand/AppLogo.vue'

const menuOpen = ref(false)

const modules = [
  {
    id: 'kanban',
    icon: LayoutGrid,
    title: 'Tableros Kanban',
    rating: '4.9',
    desc: 'Organiza tareas en columnas, arrastra tarjetas y mantén al equipo alineado en cada sprint.',
    lists: '12 listas',
    cards: '2.4k tarjetas',
    featured: true,
  },
  {
    id: 'projects',
    icon: FolderKanban,
    title: 'Gestión de proyectos',
    rating: '4.8',
    desc: 'Presupuesto, cronograma, riesgos y entregables conectados al trabajo diario del equipo.',
    lists: '8 módulos',
    cards: '1.8k equipos',
    featured: false,
  },
  {
    id: 'realtime',
    icon: Radio,
    title: 'Colaboración en vivo',
    rating: '4.9',
    desc: 'Presencia del equipo, chat en tablero y sincronización instantánea desde cualquier lugar.',
    lists: '24/7 online',
    cards: '3.2k usuarios',
    featured: false,
  },
]
</script>

<template>
  <div class="landing-page overflow-x-hidden bg-white text-[#2d2d2d]">
    <!-- Nav -->
    <header class="relative z-20">
      <div class="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 lg:px-8">
        <RouterLink to="/">
          <AppLogo size="md" />
        </RouterLink>

        <nav class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
          <a href="#" class="text-sm font-medium text-[#2d2d2d]">Inicio</a>
          <a href="#modulos" class="text-sm font-medium text-[#555] hover:text-[#2d2d2d]">Módulos</a>
          <a href="#nosotros" class="text-sm font-medium text-[#555] hover:text-[#2d2d2d]">Nosotros</a>
          <a href="#opiniones" class="text-sm font-medium text-[#555] hover:text-[#2d2d2d]">Opiniones</a>
        </nav>

        <div class="hidden md:block">
          <RouterLink to="/register" class="landing-enroll-btn">Empezar ahora</RouterLink>
        </div>

        <button class="md:hidden" @click="menuOpen = !menuOpen">
          <X v-if="menuOpen" :size="24" />
          <Menu v-else :size="24" />
        </button>
      </div>

      <div v-if="menuOpen" class="border-t border-[#eee] px-5 py-4 md:hidden">
        <a href="#modulos" class="block py-2 text-sm" @click="menuOpen = false">Módulos</a>
        <a href="#nosotros" class="block py-2 text-sm" @click="menuOpen = false">Nosotros</a>
        <a href="#opiniones" class="block py-2 text-sm" @click="menuOpen = false">Opiniones</a>
        <RouterLink to="/register" class="landing-enroll-btn mt-3 inline-flex" @click="menuOpen = false">
          Empezar ahora
        </RouterLink>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden pb-16 lg:pb-24">
      <!-- Decoración fondo -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <svg class="absolute top-20 right-[8%] h-64 w-64 opacity-[0.07]" viewBox="0 0 200 200">
          <text x="20" y="40" font-size="28" fill="#2d2d2d" font-family="serif">∫</text>
          <text x="120" y="80" font-size="22" fill="#2d2d2d" font-family="serif">Σ</text>
          <path d="M40 120 Q80 80 120 130" stroke="#2d2d2d" stroke-width="1.5" fill="none" opacity="0.5" />
          <text x="60" y="170" font-size="20" fill="#2d2d2d">π</text>
        </svg>
        <div class="landing-float-shape absolute top-32 right-[30%] h-10 w-10 rotate-12 rounded-lg bg-[#f4845f]/80" />
        <div class="landing-float-shape absolute top-48 right-[18%] h-6 w-6 rounded-full bg-[#5bbce4]/70" style="animation-delay: 1s" />
        <div class="landing-float-shape absolute top-64 right-[42%] h-8 w-8 -rotate-6 rounded-md bg-[#f4845f]/50" style="animation-delay: 2s" />
        <svg class="landing-float-shape absolute top-40 right-[12%] h-8 w-16 text-[#5bbce4]/60" style="animation-delay: 0.5s" viewBox="0 0 60 20" fill="none">
          <path d="M5 15 Q20 5 35 12 T55 8" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
      </div>

      <div class="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pt-6 lg:grid-cols-2 lg:gap-6 lg:px-8 lg:pt-10">
        <!-- Texto -->
        <div class="z-10 max-w-xl">
          <h1 class="text-[2.4rem] leading-[1.08] font-extrabold tracking-tight sm:text-[2.8rem] lg:text-[3.2rem]">
            <span class="text-[#f4845f]">Organiza</span>
            <span class="text-[#2d2d2d]">, impulsa y transforma tu</span>
            <span class="text-[#5bbce4]"> equipo</span>
          </h1>
          <p class="mt-5 max-w-md text-sm leading-relaxed text-[#777] lg:text-[15px]">
            QuinList es la plataforma donde tu equipo planifica, ejecuta y entrega.
            Tableros Kanban, proyectos y colaboración en tiempo real — todo en un solo lugar.
          </p>
          <div class="mt-7 flex items-center gap-4">
            <RouterLink to="/register" class="landing-explore-btn">
              Explorar QuinList
            </RouterLink>
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-full bg-[#5bbce4] text-white shadow-md shadow-sky-200 transition-transform hover:scale-105"
              aria-label="Ver demo"
            >
              <Play :size="18" class="ml-0.5" fill="currentColor" />
            </button>
          </div>
        </div>

        <!-- Visual hero -->
        <div class="relative flex justify-center lg:justify-end">
          <div class="relative w-full max-w-[420px]">
            <!-- Persona / ilustración -->
            <div class="relative z-10 mx-auto w-[85%] lg:mr-0 lg:ml-auto">
              <div
                class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#fff5f0] to-[#e8f6fc] pt-8"
              >
                <div
                  class="mx-auto flex h-56 w-56 items-end justify-center sm:h-64 sm:w-64"
                >
                  <div
                    class="relative flex h-[92%] w-[75%] flex-col items-center justify-end rounded-t-[3rem] bg-[#f4845f] pb-0"
                  >
                    <div
                      class="absolute -top-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fcd9c8] ring-4 ring-white"
                    >
                      <div class="h-14 w-14 rounded-full bg-[#e8b89a]" />
                    </div>
                    <div class="mb-6 mt-14 h-24 w-32 rounded-2xl bg-[#2d2d2d]/90 p-2 shadow-xl">
                      <div class="mb-1.5 flex gap-1">
                        <div class="h-1.5 w-1.5 rounded-full bg-red-400" />
                        <div class="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                        <div class="h-1.5 w-1.5 rounded-full bg-green-400" />
                      </div>
                      <div class="space-y-1">
                        <div class="h-2 w-full rounded bg-white/20" />
                        <div class="h-2 w-3/4 rounded bg-white/15" />
                        <div class="mt-2 h-6 w-full rounded bg-[#5bbce4]/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stats superpuestas -->
            <div
              class="absolute -bottom-2 left-0 z-20 w-[58%] -rotate-6 rounded-2xl bg-[#f4845f] px-5 py-4 text-white shadow-xl lg:-left-6"
            >
              <p class="text-xs font-medium text-white/80">Equipos activos</p>
              <p class="text-2xl font-extrabold">500+</p>
            </div>
            <div
              class="absolute right-0 bottom-6 z-20 w-[52%] rotate-3 rounded-2xl bg-[#fcd0b8] px-5 py-4 text-[#2d2d2d] shadow-lg lg:-right-4"
            >
              <p class="text-xs font-medium text-[#666]">Tableros creados</p>
              <p class="text-2xl font-extrabold">10K+</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Módulos destacados -->
    <section id="modulos" class="bg-[#fafafa] py-16 lg:py-20">
      <div class="mx-auto max-w-6xl px-5 lg:px-8">
        <div class="text-center">
          <h2 class="text-2xl font-extrabold text-[#2d2d2d] lg:text-3xl">Nuestros módulos principales</h2>
          <p class="mx-auto mt-3 max-w-lg text-sm text-[#888]">
            Todo lo que tu equipo necesita para planificar, ejecutar y medir resultados.
          </p>
        </div>

        <div class="mt-12 grid gap-5 md:grid-cols-3">
          <article
            v-for="mod in modules"
            :key="mod.id"
            class="landing-module-card"
            :class="mod.featured ? 'landing-module-card--featured' : ''"
          >
            <div class="flex items-start justify-between">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl"
                :class="mod.featured ? 'bg-white/20' : 'bg-[#f4845f]/10 text-[#f4845f]'"
              >
                <component :is="mod.icon" :size="20" />
              </div>
              <div class="flex items-center gap-1 text-sm font-semibold" :class="mod.featured ? 'text-white' : 'text-[#2d2d2d]'">
                <Star :size="14" :class="mod.featured ? 'fill-white text-white' : 'fill-[#f4845f] text-[#f4845f]'" />
                {{ mod.rating }}
              </div>
            </div>
            <h3 class="mt-4 text-lg font-bold" :class="mod.featured ? 'text-white' : 'text-[#2d2d2d]'">
              {{ mod.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed" :class="mod.featured ? 'text-white/85' : 'text-[#888]'">
              {{ mod.desc }}
            </p>
            <div
              class="mt-5 flex items-center justify-between border-t pt-4 text-xs font-medium"
              :class="mod.featured ? 'border-white/20 text-white/75' : 'border-[#eee] text-[#aaa]'"
            >
              <span>{{ mod.lists }}</span>
              <span>{{ mod.cards }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Nosotros -->
    <section id="nosotros" class="py-16 lg:py-20">
      <div class="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <p class="text-sm font-semibold text-[#f4845f]">Sobre QuinList</p>
          <h2 class="mt-2 text-2xl font-extrabold lg:text-3xl">
            Hecho para equipos que necesitan claridad, no más reuniones
          </h2>
          <p class="mt-4 text-sm leading-relaxed text-[#777]">
            Nacimos con una idea simple: que gestionar proyectos no debería ser complicado.
            QuinList combina lo mejor de los tableros visuales con herramientas de proyecto
            reales, diseñado para equipos en Latinoamérica.
          </p>
          <RouterLink to="/register" class="landing-explore-btn mt-7 inline-flex">
            Crear cuenta gratis
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-2xl bg-[#fff5f0] p-6">
            <p class="text-3xl font-extrabold text-[#f4845f]">98%</p>
            <p class="mt-1 text-sm text-[#777]">Equipos que adoptan en la primera semana</p>
          </div>
          <div class="rounded-2xl bg-[#e8f6fc] p-6">
            <p class="text-3xl font-extrabold text-[#5bbce4]">24/7</p>
            <p class="mt-1 text-sm text-[#777]">Acceso desde cualquier dispositivo</p>
          </div>
          <div class="col-span-2 rounded-2xl border border-[#eee] bg-white p-6">
            <p class="text-sm font-semibold text-[#2d2d2d]">Sin tarjeta de crédito</p>
            <p class="mt-1 text-sm text-[#888]">Empieza gratis y escala cuando tu equipo crezca.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Opiniones -->
    <section id="opiniones" class="bg-[#fafafa] py-16 lg:py-20">
      <div class="mx-auto max-w-6xl px-5 text-center lg:px-8">
        <h2 class="text-2xl font-extrabold lg:text-3xl">Lo que dicen los equipos</h2>
        <div class="mt-10 grid gap-5 md:grid-cols-3">
          <blockquote
            v-for="q in [
              { t: 'Pasamos de Excel a QuinList y el equipo no volvió atrás. Todo visible en un tablero.', a: 'María G. · Operaciones' },
              { t: 'Lo configuramos en un día. El drag & drop y el chat del tablero son lo que más usamos.', a: 'Carlos M. · PM' },
              { t: 'Por fin una herramienta que no parece hecha para corporativos de otro planeta.', a: 'Ana R. · Startup' },
            ]"
            :key="q.a"
            class="rounded-2xl border border-[#eee] bg-white p-6 text-left"
          >
            <div class="flex gap-0.5">
              <Star v-for="i in 5" :key="i" :size="13" class="fill-[#f4845f] text-[#f4845f]" />
            </div>
            <p class="mt-3 text-sm leading-relaxed text-[#555]">"{{ q.t }}"</p>
            <footer class="mt-4 text-xs font-semibold text-[#aaa]">{{ q.a }}</footer>
          </blockquote>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
      <div class="rounded-3xl bg-[#2d2d2d] px-8 py-12 text-center lg:px-16">
        <h2 class="text-2xl font-extrabold text-white lg:text-3xl">
          ¿Listo para transformar tu equipo?
        </h2>
        <p class="mx-auto mt-3 max-w-md text-sm text-white/60">
          Únete a cientos de equipos que ya organizan su trabajo con QuinList.
        </p>
        <div class="mt-7 flex flex-wrap justify-center gap-3">
          <RouterLink to="/register" class="landing-explore-btn">Empezar gratis</RouterLink>
          <RouterLink
            to="/login"
            class="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Ya tengo cuenta
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-[#eee] py-8">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-[#aaa] md:flex-row lg:px-8">
        <AppLogo size="sm" />
        <p>© {{ new Date().getFullYear() }} QuinList · hola@quinlist.app</p>
      </div>
    </footer>
  </div>
</template>
