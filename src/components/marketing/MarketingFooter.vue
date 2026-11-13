<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Mail } from '@lucide/vue'
import AppLogo from '@/components/brand/AppLogo.vue'
import { marketingGroups, pagesOfKind, PRODUCT } from '@/seo/marketing'

const year = new Date().getFullYear()
const groups = marketingGroups.map((g) => ({ ...g, pages: pagesOfKind(g.kind) }))
</script>

<template>
  <!-- Navy del sidebar de la app -->
  <footer class="bg-[#1a2b4a] text-white" aria-labelledby="footer-heading">
    <h2 id="footer-heading" class="sr-only">Mapa del sitio de QuinList</h2>
    <div class="mx-auto max-w-6xl px-5 pb-10 pt-16 lg:px-8">
      <div class="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-7">
        <div class="col-span-2 sm:col-span-3 lg:col-span-2 lg:pr-6">
          <RouterLink to="/" class="flex items-center gap-2.5" aria-label="QuinList, inicio">
            <AppLogo size="sm" />
            <span class="text-base font-bold">QuinList</span>
          </RouterLink>
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-white/75">
            Gestión de proyectos y finanzas para empresas. Hecho en {{ PRODUCT.country }} para Latinoamérica.
          </p>
          <a
            :href="`mailto:${PRODUCT.email}`"
            class="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            <Mail :size="15" aria-hidden="true" /> {{ PRODUCT.email }}
          </a>
        </div>

        <nav v-for="g in groups" :key="g.kind" :aria-label="g.title">
          <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-[#5bbce4]">{{ g.title }}</h3>
          <ul class="mt-4 space-y-2.5 text-sm text-white/80">
            <li v-for="p in g.pages" :key="p.path">
              <RouterLink :to="p.path" class="transition-colors hover:text-white">{{ p.navLabel }}</RouterLink>
            </li>
          </ul>
        </nav>
      </div>

      <div class="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
        <ul class="flex flex-wrap gap-x-5 gap-y-2">
          <li><RouterLink to="/precios" class="hover:text-white">Precios</RouterLink></li>
          <li><RouterLink to="/ayuda" class="hover:text-white">Centro de ayuda</RouterLink></li>
          <li><RouterLink to="/privacidad" class="hover:text-white">Privacidad</RouterLink></li>
          <li><RouterLink to="/terminos" class="hover:text-white">Términos</RouterLink></li>
          <li><RouterLink to="/login" class="hover:text-white">Iniciar sesión</RouterLink></li>
        </ul>
        <p>
          © {{ year }} QuinList ·
          <a href="https://matubyte.com" target="_blank" rel="noopener" class="font-semibold text-white hover:underline">{{ PRODUCT.company }}</a>
          · {{ PRODUCT.country }}
        </p>
      </div>
    </div>
  </footer>
</template>
