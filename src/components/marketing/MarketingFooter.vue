<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/brand/AppLogo.vue'
import { marketingGroups, pagesOfKind, PRODUCT } from '@/seo/marketing'

const year = new Date().getFullYear()
const groups = marketingGroups.map((g) => ({ ...g, pages: pagesOfKind(g.kind) }))
</script>

<template>
  <footer class="border-t border-[#f0f1f2] bg-white" aria-labelledby="footer-heading">
    <h2 id="footer-heading" class="sr-only">Mapa del sitio de QuinList</h2>
    <div class="mx-auto max-w-[1200px] px-6 pb-10 pt-16 lg:px-8">
      <div class="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-7">
        <div class="col-span-2 sm:col-span-3 lg:col-span-2 lg:pr-8">
          <RouterLink to="/" class="flex items-center gap-2.5" aria-label="QuinList, inicio">
            <AppLogo size="sm" />
            <span class="ql-display text-[18px] font-semibold text-[#101214]">QuinList</span>
          </RouterLink>
          <p class="mt-4 max-w-xs text-[14px] leading-relaxed text-[#42526e]">
            Gestión de proyectos y finanzas para empresas. Hecho en {{ PRODUCT.country }} para Latinoamérica.
          </p>
          <a :href="`mailto:${PRODUCT.email}`" class="ql-link mt-4 text-[14px]">{{ PRODUCT.email }}</a>
        </div>

        <nav v-for="g in groups" :key="g.kind" :aria-label="g.title">
          <h3 class="text-[14px] font-semibold text-[#101214]">{{ g.title }}</h3>
          <ul class="mt-4 space-y-2.5 text-[14px] text-[#42526e]">
            <li v-for="p in g.pages" :key="p.path">
              <RouterLink :to="p.path" class="transition-colors hover:text-[#1868db] hover:underline">{{ p.navLabel }}</RouterLink>
            </li>
          </ul>
        </nav>
      </div>

      <div class="mt-14 flex flex-col gap-4 border-t border-[#f0f1f2] pt-8 text-[13px] text-[#42526e] md:flex-row md:items-center md:justify-between">
        <ul class="flex flex-wrap gap-x-5 gap-y-2">
          <li><RouterLink to="/precios" class="hover:text-[#1868db]">Precios</RouterLink></li>
          <li><RouterLink to="/blog" class="hover:text-[#1868db]">Blog</RouterLink></li>
          <li><RouterLink to="/ayuda" class="hover:text-[#1868db]">Centro de ayuda</RouterLink></li>
          <li><RouterLink to="/privacidad" class="hover:text-[#1868db]">Privacidad</RouterLink></li>
          <li><RouterLink to="/terminos" class="hover:text-[#1868db]">Términos</RouterLink></li>
          <li><RouterLink to="/login" class="hover:text-[#1868db]">Iniciar sesión</RouterLink></li>
        </ul>
        <p>
          © {{ year }} QuinList ·
          <a href="https://matubyte.com" target="_blank" rel="noopener" class="font-medium text-[#101214] hover:text-[#1868db]">{{ PRODUCT.company }}</a>
          · {{ PRODUCT.country }}
        </p>
      </div>
    </div>
  </footer>
</template>
