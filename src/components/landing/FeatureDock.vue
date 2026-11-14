<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight } from '@lucide/vue'
import MktConfetti from '@/components/marketing/MktConfetti.vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import { pagesOfKind } from '@/seo/marketing'
import { showcaseByPath } from '@/seo/showcase'

const items = pagesOfKind('solucion')
  .map((page) => ({ page, sc: showcaseByPath[page.path]! }))
  .filter((x) => !!x.sc)
</script>

<template>
  <section id="funciones" class="relative overflow-hidden bg-[#101214] py-20 text-white lg:py-28" aria-labelledby="features-heading">
    <MktConfetti side="left" variant="b" />
    <MktConfetti side="right" variant="a" />
    <div class="relative mx-auto max-w-[1200px] px-10 sm:px-14 lg:px-[110px]">
      <div class="mx-auto max-w-2xl text-center">
        <p class="ql-eyebrow ql-eyebrow--light">Funciones</p>
        <h2 id="features-heading" class="mt-3 text-[2rem] leading-[1.15] text-white lg:text-[3rem] lg:leading-[1.14]">
          Todo lo que necesita tu equipo
        </h2>
        <p class="mt-4 text-[15px] leading-relaxed text-white/75 lg:text-lg">
          Kanban, proyectos, presupuesto, IA e integraciones en un solo lugar. Sin pagar cinco apps.
        </p>
      </div>

      <ul class="features-rail mt-12">
        <li v-for="it in items" :key="it.page.path" class="features-rail__item">
          <RouterLink
            :to="it.page.path"
            class="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.07] sm:p-6"
          >
            <span class="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/85">
              <MktIcon :name="it.sc.icon" :size="20" :stroke-width="1.4" />
            </span>
            <h3 class="mt-4 text-base font-semibold text-white">{{ it.page.navLabel }}</h3>
            <p class="mt-1.5 flex-1 text-sm leading-relaxed text-white/60">{{ it.page.description }}</p>
            <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white/80 group-hover:text-white">
              Ver más
              <ArrowRight :size="14" class="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.features-rail {
  display: flex;
  gap: 0.875rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 1.25rem;
  margin-inline: -1.25rem;
  padding: 0.25rem 1.25rem 0.85rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
  -webkit-overflow-scrolling: touch;
}

.features-rail::-webkit-scrollbar {
  height: 6px;
}

.features-rail::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999px;
}

.features-rail__item {
  flex: 0 0 min(78%, 300px);
  scroll-snap-align: start;
}

@media (min-width: 640px) {
  .features-rail__item {
    flex-basis: 280px;
  }
}

@media (min-width: 1024px) {
  .features-rail {
    margin-inline: 0;
    padding-inline: 0;
    scroll-padding-inline: 0;
  }

  .features-rail__item {
    flex-basis: 300px;
  }
}
</style>
