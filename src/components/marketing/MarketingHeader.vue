<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, ChevronDown, FileSpreadsheet, Menu, X } from '@lucide/vue'
import AppLogo from '@/components/brand/AppLogo.vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import { ACCENT } from '@/components/marketing/accent'
import { pagesOfKind } from '@/seo/marketing'
import { showcaseByPath } from '@/seo/showcase'
import { rememberStartPlan } from '@/lib/startPlan'

const menuOpen = ref(false)
const solutionsOpen = ref(false)
const mobileSolutions = ref(true)
const scrolled = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | undefined

function withShowcase(kind: 'solucion' | 'industria') {
  return pagesOfKind(kind)
    .map((p) => ({ page: p, sc: showcaseByPath[p.path] }))
    .filter((x): x is { page: (typeof x)['page']; sc: NonNullable<(typeof x)['sc']> } => !!x.sc)
}
const features = withShowcase('solucion')
const teams = withShowcase('industria')

const links = [
  { to: '/#funciones', label: 'Funciones' },
  { to: '/precios', label: 'Precios' },
  { to: '/alternativa-a-excel-para-proyectos', label: 'Deja el Excel' },
  { to: '/guias', label: 'Guías' },
]

function openSolutions() {
  clearTimeout(closeTimer)
  solutionsOpen.value = true
}
function scheduleClose() {
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => (solutionsOpen.value = false), 140)
}
function close() {
  clearTimeout(closeTimer)
  menuOpen.value = false
  solutionsOpen.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
function onScroll() {
  scrolled.value = window.scrollY > 12
}

// En celular, el menú ocupa la pantalla: bloquea el scroll de fondo mientras está abierto.
watch(menuOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
  onScroll()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
  clearTimeout(closeTimer)
})
</script>

<template>
  <header
    class="landing-nav fixed inset-x-0 top-0 z-50 transition-all duration-300"
    :class="scrolled || menuOpen || solutionsOpen ? 'landing-nav--solid' : 'landing-nav--top'"
  >
    <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 lg:h-[68px] lg:gap-6 lg:px-8">
      <RouterLink to="/" class="flex shrink-0 items-center gap-2.5" aria-label="QuinList, inicio" @click="close">
        <AppLogo size="sm" eager />
        <span class="text-[16px] font-bold tracking-tight text-[#172b4d]">QuinList</span>
      </RouterLink>

      <!-- Navegación de escritorio -->
      <nav class="ml-2 hidden flex-1 items-center justify-center gap-0.5 lg:flex" aria-label="Principal">
        <button
          type="button"
          class="landing-nav-link inline-flex items-center gap-1"
          :class="solutionsOpen ? 'bg-[#eef5fb] text-[#172b4d]' : ''"
          :aria-expanded="solutionsOpen"
          aria-controls="mkt-solutions"
          @click="solutionsOpen ? close() : openSolutions()"
          @mouseenter="openSolutions"
          @mouseleave="scheduleClose"
        >
          Soluciones
          <ChevronDown :size="15" class="transition-transform duration-200" :class="solutionsOpen ? 'rotate-180' : ''" aria-hidden="true" />
        </button>
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="landing-nav-link" @click="close">
          {{ l.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto hidden items-center gap-1.5 sm:flex">
        <RouterLink to="/login" class="landing-nav-login">Iniciar sesión</RouterLink>
        <RouterLink
          :to="{ path: '/register', query: { plan: 'free' } }"
          class="landing-nav-cta"
          @click="rememberStartPlan('free')"
        >
          Empieza gratis
        </RouterLink>
      </div>

      <button
        type="button"
        class="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#172b4d] hover:bg-[#eef5fb] sm:ml-1 lg:hidden"
        :aria-expanded="menuOpen"
        aria-controls="mkt-mobile-menu"
        :aria-label="menuOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="22" />
        <Menu v-else :size="22" />
      </button>
    </div>

    <!-- Mega menú “Soluciones” (escritorio): panel de vidrio -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2 scale-[0.99]"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-show="solutionsOpen"
        id="mkt-solutions"
        class="absolute inset-x-0 top-full hidden px-5 pt-2 lg:block"
        @mouseenter="openSolutions"
        @mouseleave="scheduleClose"
      >
        <div class="ql-glass mx-auto grid max-w-5xl grid-cols-[1fr_1fr_16.5rem] gap-1 rounded-[1.4rem] p-2.5">
          <div class="rounded-2xl bg-white/70 p-3">
            <p class="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#5e6c84]">Funciones</p>
            <ul>
              <li v-for="{ page, sc } in features" :key="page.path">
                <RouterLink
                  :to="page.path"
                  class="group flex items-start gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[#eef5fb]"
                  @click="close"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-transform duration-200 group-hover:scale-110" :class="ACCENT[sc.accent].tile">
                    <MktIcon :name="sc.icon" :size="18" />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-sm font-semibold text-[#172b4d]">{{ page.navLabel }}</span>
                    <span class="block text-xs leading-snug text-[#5e6c84]">{{ sc.menuDesc }}</span>
                  </span>
                </RouterLink>
              </li>
            </ul>
          </div>

          <div class="rounded-2xl bg-white/70 p-3">
            <p class="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#5e6c84]">Por tipo de equipo</p>
            <ul>
              <li v-for="{ page, sc } in teams" :key="page.path">
                <RouterLink
                  :to="page.path"
                  class="group flex items-start gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[#eef5fb]"
                  @click="close"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-transform duration-200 group-hover:scale-110" :class="ACCENT[sc.accent].tile">
                    <MktIcon :name="sc.icon" :size="18" />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-sm font-semibold text-[#172b4d]">{{ page.navLabel }}</span>
                    <span class="block text-xs leading-snug text-[#5e6c84]">{{ sc.menuDesc }}</span>
                  </span>
                </RouterLink>
              </li>
            </ul>
            <div class="mx-3 mt-2 border-t border-[#e4e9f0] pt-3">
              <p class="text-[11px] font-bold uppercase tracking-[0.1em] text-[#5e6c84]">Comparativas</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <RouterLink
                  v-for="c in pagesOfKind('comparativa')"
                  :key="c.path"
                  :to="c.path"
                  class="rounded-full bg-[#eef5fb] px-2.5 py-1 text-xs font-semibold text-[#2a72a8] hover:bg-[#dbeaf6]"
                  @click="close"
                >
                  {{ c.navLabel }}
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Destacado en azul de marca (como el header de la app) -->
          <div class="flex flex-col rounded-2xl bg-[#2a72a8] p-5 text-white">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <FileSpreadsheet :size="20" aria-hidden="true" />
            </span>
            <p class="mt-4 text-base font-bold leading-snug">¿Tus proyectos viven en Excel y WhatsApp?</p>
            <p class="mt-2 text-[13px] leading-relaxed text-white">
              Pásalos a un solo lugar en una tarde. Plan gratis para siempre, VIP por 15 USD al mes.
            </p>
            <div class="mt-auto pt-5">
              <RouterLink
                :to="{ path: '/register', query: { plan: 'free' } }"
                class="ql-btn ql-btn--light w-full py-2.5 text-sm"
                @click="rememberStartPlan('free'); close()"
              >
                Empieza gratis <ArrowRight :size="15" aria-hidden="true" />
              </RouterLink>
              <RouterLink
                to="/alternativa-a-excel-para-proyectos"
                class="mt-2 block text-center text-xs font-semibold text-white underline-offset-2 hover:underline"
                @click="close"
              >
                Cómo dejar el Excel
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Menú móvil y tablet: pantalla completa.
         Va con `absolute` + altura explícita: el backdrop-filter del header convierte al header
         en el contenedor de los `fixed`, así que `fixed inset-0` quedaría con 0 px de alto. -->
    <div
      v-if="menuOpen"
      id="mkt-mobile-menu"
      class="absolute inset-x-0 top-full flex h-[calc(100dvh-4rem)] flex-col border-t border-[#e4e9f0] bg-[#f6f8fb] lg:hidden"
    >
      <nav class="flex-1 overflow-y-auto px-5 pb-6 pt-4" aria-label="Menú móvil">
        <ul class="ql-grouped">
          <li v-for="l in links" :key="l.to">
            <RouterLink
              :to="l.to"
              class="flex items-center justify-between px-4 py-3.5 text-[15px] font-semibold text-[#172b4d] active:bg-[#eef5fb]"
              @click="close"
            >
              {{ l.label }}
              <ChevronDown :size="16" class="-rotate-90 text-[#5e6c84]" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>

        <button
          type="button"
          class="mt-6 flex w-full items-center justify-between px-1 text-[12px] font-bold uppercase tracking-[0.1em] text-[#5e6c84]"
          :aria-expanded="mobileSolutions"
          aria-controls="mkt-mobile-solutions"
          @click="mobileSolutions = !mobileSolutions"
        >
          Soluciones
          <ChevronDown :size="16" class="transition-transform" :class="mobileSolutions ? 'rotate-180' : ''" aria-hidden="true" />
        </button>
        <div v-show="mobileSolutions" id="mkt-mobile-solutions">
          <ul class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <li v-for="{ page, sc } in [...features, ...teams]" :key="page.path">
              <RouterLink
                :to="page.path"
                class="flex h-full flex-col gap-2.5 rounded-2xl bg-white p-3.5 shadow-[0_1px_2px_rgba(23,43,77,0.06)] ring-1 ring-[#e4e9f0] active:scale-[0.98]"
                @click="close"
              >
                <span class="flex h-9 w-9 items-center justify-center rounded-[10px]" :class="ACCENT[sc.accent].tile">
                  <MktIcon :name="sc.icon" :size="18" />
                </span>
                <span class="text-[13px] font-semibold leading-tight text-[#172b4d]">{{ page.navLabel }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>
      <div class="grid grid-cols-2 gap-2 border-t border-[#e4e9f0] bg-white/90 px-5 py-4 backdrop-blur">
        <RouterLink to="/login" class="ql-btn--ghost py-3" @click="close">Iniciar sesión</RouterLink>
        <RouterLink
          :to="{ path: '/register', query: { plan: 'free' } }"
          class="ql-btn py-3"
          @click="rememberStartPlan('free'); close()"
        >
          Empieza gratis
        </RouterLink>
      </div>
    </div>
  </header>
</template>
