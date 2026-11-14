<script setup lang="ts">
import { RouterLink } from 'vue-router'
import MarketingHeader from '@/components/marketing/MarketingHeader.vue'
import MarketingFooter from '@/components/marketing/MarketingFooter.vue'

const shortcuts = [
  { to: '/', label: 'Inicio' },
  { to: '/software-gestion-de-proyectos', label: 'Software de gestión de proyectos' },
  { to: '/precios', label: 'Precios' },
  { to: '/ayuda', label: 'Centro de ayuda' },
]
</script>

<template>
  <div class="landing-page bg-white text-[#101214]">
    <MarketingHeader />
    <main class="mx-auto max-w-2xl px-5 pb-24 pt-32 text-center">
      <p class="text-sm font-semibold text-[#c2410c]">Error 404</p>
      <h1 class="mt-2 text-4xl font-extrabold tracking-tight">No encontramos esta página</h1>
      <p class="mt-4 text-[#666]">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      <ul class="mt-8 flex flex-wrap justify-center gap-3">
        <li v-for="s in shortcuts" :key="s.to">
          <RouterLink :to="s.to" class="landing-enroll-btn">{{ s.label }}</RouterLink>
        </li>
      </ul>
    </main>
    <MarketingFooter />
  </div>
</template>
