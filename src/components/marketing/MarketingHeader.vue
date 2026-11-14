<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, ChevronDown, FileSpreadsheet, Menu, X } from '@lucide/vue'
import AppLogo from '@/components/brand/AppLogo.vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import { pagesOfKind } from '@/seo/marketing'
import { showcaseByPath } from '@/seo/showcase'
import { rememberStartPlan } from '@/lib/startPlan'

const menuOpen = ref(false)
const solutionsOpen = ref(false)
const mobileSolutions = ref(true)
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
  { to: '/blog', label: 'Blog' },
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

// En celular, el menú ocupa la pantalla: bloquea el scroll de fondo mientras está abierto.
watch(menuOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
})

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
  clearTimeout(closeTimer)
})
</script>

<template>
  <header class="landing-nav fixed inset-x-0 top-0 z-50">
    <div class="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-5 lg:gap-6 lg:px-8">
      <RouterLink to="/" class="flex shrink-0 items-center gap-2.5" aria-label="QuinList, inicio" @click="close">
        <AppLogo size="sm" eager />
        <span class="ql-display text-[18px] font-semibold text-[#101214]">QuinList</span>
      </RouterLink>

      <!-- Navegación de escritorio -->
      <nav class="ml-4 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Principal">
        <button
          type="button"
          class="landing-nav-link inline-flex items-center gap-1"
          :class="solutionsOpen ? 'text-[#1868db]' : ''"
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

      <div class="ml-auto hidden items-center gap-3 sm:flex">
        <RouterLink to="/login" class="landing-nav-login">¿Ya eres cliente?</RouterLink>
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
        class="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-[#101214] hover:bg-[#f0f1f2] sm:ml-1 lg:hidden"
        :aria-expanded="menuOpen"
        aria-controls="mkt-mobile-menu"
        :aria-label="menuOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="22" />
        <Menu v-else :size="22" />
      </button>
    </div>

    <!-- Mega menú “Soluciones” (escritorio) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-show="solutionsOpen"
        id="mkt-solutions"
        class="absolute inset-x-0 top-full hidden px-5 pt-2 lg:block"
        @mouseenter="openSolutions"
        @mouseleave="scheduleClose"
      >
        <div class="ql-card mx-auto grid max-w-[1100px] grid-cols-[1fr_1fr_17rem] gap-2 p-3 shadow-[0_24px_48px_-24px_rgba(9,30,66,0.35),0_0_1px_rgba(9,30,66,0.31)]">
          <div class="p-3">
            <p class="px-3 pb-2 text-[13px] font-medium text-[#42526e]">Funciones</p>
            <ul>
              <li v-for="{ page, sc } in features" :key="page.path">
                <RouterLink
                  :to="page.path"
                  class="group flex items-start gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[#f0f1f2]"
                  @click="close"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dfe1e6] text-[#101214]">
                    <MktIcon :name="sc.icon" :size="18" :stroke-width="1.4" />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-[14px] font-medium text-[#101214] group-hover:text-[#1868db]">{{ page.navLabel }}</span>
                    <span class="block text-[13px] leading-snug text-[#42526e]">{{ sc.menuDesc }}</span>
                  </span>
                </RouterLink>
              </li>
            </ul>
          </div>

          <div class="border-l border-[#f0f1f2] p-3">
            <p class="px-3 pb-2 text-[13px] font-medium text-[#42526e]">Por tipo de equipo</p>
            <ul>
              <li v-for="{ page, sc } in teams" :key="page.path">
                <RouterLink
                  :to="page.path"
                  class="group flex items-start gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[#f0f1f2]"
                  @click="close"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dfe1e6] text-[#101214]">
                    <MktIcon :name="sc.icon" :size="18" :stroke-width="1.4" />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-[14px] font-medium text-[#101214] group-hover:text-[#1868db]">{{ page.navLabel }}</span>
                    <span class="block text-[13px] leading-snug text-[#42526e]">{{ sc.menuDesc }}</span>
                  </span>
                </RouterLink>
              </li>
            </ul>
            <div class="mx-3 mt-3 border-t border-[#f0f1f2] pt-3">
              <p class="text-[13px] font-medium text-[#42526e]">Comparativas</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <RouterLink
                  v-for="c in pagesOfKind('comparativa')"
                  :key="c.path"
                  :to="c.path"
                  class="rounded-full bg-[#f0f1f2] px-2.5 py-1 text-[13px] font-medium text-[#42526e] hover:bg-[#e9f2fe] hover:text-[#1868db]"
                  @click="close"
                >
                  {{ c.navLabel }}
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Banda lavanda destacada -->
          <div class="flex flex-col rounded-[20px] bg-[#eed7fc] p-6 text-[#101214]">
            <FileSpreadsheet :size="26" aria-hidden="true" />
            <p class="ql-display mt-4 text-[20px] font-medium leading-snug">¿Tus proyectos viven en Excel y WhatsApp?</p>
            <p class="mt-2 text-[14px] leading-relaxed">Pásalos a un solo lugar en una tarde. Gratis para siempre; VIP por 7 USD al mes.</p>
            <div class="mt-auto pt-5">
              <RouterLink
                :to="{ path: '/register', query: { plan: 'free' } }"
                class="ql-btn w-full py-2.5 text-[14px]"
                @click="rememberStartPlan('free'); close()"
              >
                Empieza gratis
              </RouterLink>
              <RouterLink
                to="/alternativa-a-excel-para-proyectos"
                class="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-medium text-[#101214] underline-offset-4 hover:underline"
                @click="close"
              >
                Cómo dejar el Excel <ArrowRight :size="14" aria-hidden="true" />
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Menú móvil y tablet: pantalla completa (absolute + altura explícita bajo el header). -->
    <div
      v-if="menuOpen"
      id="mkt-mobile-menu"
      class="absolute inset-x-0 top-full flex h-[calc(100dvh-4rem)] flex-col bg-white lg:hidden"
    >
      <nav class="flex-1 overflow-y-auto px-5 pb-6 pt-2" aria-label="Menú móvil">
        <ul class="ql-grouped">
          <li v-for="l in links" :key="l.to">
            <RouterLink
              :to="l.to"
              class="ql-display flex items-center justify-between py-4 text-[20px] font-medium text-[#101214]"
              @click="close"
            >
              {{ l.label }}
              <ArrowRight :size="18" class="text-[#1868db]" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>

        <button
          type="button"
          class="mt-6 flex w-full items-center justify-between text-[13px] font-medium text-[#42526e]"
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
                class="flex h-full flex-col gap-2.5 rounded-[20px] bg-[#f0f1f2] p-4 active:bg-[#e9f2fe]"
                @click="close"
              >
                <span class="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe1e6] bg-white text-[#101214]">
                  <MktIcon :name="sc.icon" :size="18" :stroke-width="1.4" />
                </span>
                <span class="text-[14px] font-medium leading-tight text-[#101214]">{{ page.navLabel }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>
      <div class="grid grid-cols-2 gap-2 border-t border-[#f0f1f2] bg-white px-5 py-4">
        <RouterLink to="/login" class="py-3 text-center text-[15px] font-medium text-[#42526e]" @click="close">¿Ya eres cliente?</RouterLink>
        <RouterLink
          :to="{ path: '/register', query: { plan: 'free' } }"
          class="ql-btn py-3 text-[15px]"
          @click="rememberStartPlan('free'); close()"
        >
          Empieza gratis
        </RouterLink>
      </div>
    </div>
  </header>
</template>
