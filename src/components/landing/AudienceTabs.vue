<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight } from '@lucide/vue'
import CountryFlag from '@/components/marketing/CountryFlag.vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import SolutionVisual from '@/components/marketing/SolutionVisual.vue'
import { ACCENT } from '@/components/marketing/accent'
import { pagesOfKind } from '@/seo/marketing'
import { showcaseByPath } from '@/seo/showcase'

const teams = pagesOfKind('industria')
  .map((page) => ({ page, sc: showcaseByPath[page.path]! }))
  .filter((x) => !!x.sc)
const countries = pagesOfKind('pais')

const active = ref(0)
const current = computed(() => teams[active.value]!)
</script>

<template>
  <section id="para-quien" class="bg-[#eed7fc] py-20 lg:py-24" aria-labelledby="audience-heading">
    <div class="mx-auto max-w-[1200px] px-5 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <p class="ql-eyebrow">Para quién es</p>
        <h2 id="audience-heading" class="mt-3 text-[2rem] leading-[1.15] text-[#101214] lg:text-[3rem] lg:leading-[1.14]">
          Se adapta a la forma en que trabaja tu equipo
        </h2>
      </div>

      <!-- Control segmentado (desliza en celular) -->
      <div class="-mx-5 mt-8 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex sm:justify-center sm:px-0">
        <div class="ql-segmented" role="tablist" aria-label="Tipo de equipo">
          <span
            class="ql-segmented__thumb"
            :style="{ width: `calc(${100 / teams.length}% - ${0.5 / teams.length}rem)`, transform: `translateX(${active * 100}%)` }"
            aria-hidden="true"
          />
          <button
            v-for="(t, i) in teams"
            :id="`aud-tab-${i}`"
            :key="t.page.path"
            type="button"
            role="tab"
            :aria-selected="active === i"
            aria-controls="aud-panel"
            class="inline-flex items-center justify-center gap-1.5"
            @click="active = i"
          >
            <MktIcon :name="t.sc.icon" :size="15" />
            {{ t.page.navLabel }}
          </button>
        </div>
      </div>

      <Transition mode="out-in" enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-3" leave-active-class="transition duration-150" leave-to-class="opacity-0">
        <div
          id="aud-panel"
          :key="current.page.path"
          role="tabpanel"
          :aria-labelledby="`aud-tab-${active}`"
          class="ql-card mt-10 grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14"
        >
          <div class="min-w-0">
            <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" :class="ACCENT[current.sc.accent].tile">
              <MktIcon :name="current.sc.icon" :size="14" /> {{ current.page.eyebrow }}
            </span>
            <h3 class="mt-4 text-2xl font-bold leading-tight text-[#101214] lg:text-3xl">{{ current.page.h1 }}</h3>
            <p class="mt-3 text-[15px] leading-relaxed text-[#42526e]">{{ current.page.intro }}</p>
            <ul class="mt-6 grid grid-cols-2 gap-3">
              <li v-for="f in current.sc.features.slice(0, 4)" :key="f.title" class="flex items-start gap-2.5">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="ACCENT[current.sc.accent].tile">
                  <MktIcon :name="f.icon" :size="16" />
                </span>
                <span class="text-sm font-semibold leading-snug text-[#101214]">{{ f.title }}</span>
              </li>
            </ul>
            <RouterLink :to="current.page.path" class="ql-btn mt-8 py-2.5 text-sm">
              Ver solución para {{ current.page.navLabel.toLowerCase() }} <ArrowRight :size="15" aria-hidden="true" />
            </RouterLink>
          </div>
          <div class="ql-shot min-w-0 p-6">
            <div class="ql-shot__tilt"><SolutionVisual :kind="current.sc.visual" :label="current.sc.visualLabel" /></div>
          </div>
        </div>
      </Transition>

      <nav class="mt-12 text-center" aria-label="QuinList por país">
        <p class="text-[14px] font-medium text-[#101214]">Disponible en toda Latinoamérica</p>
        <ul class="mt-3 flex flex-wrap justify-center gap-2">
          <li v-for="c in countries" :key="c.path">
            <RouterLink
              :to="c.path"
              class="inline-flex items-center gap-1.5 rounded-full border border-[#101214] px-3.5 py-1.5 text-[14px] font-medium text-[#101214] transition-colors hover:bg-white"
            >
              <CountryFlag :code="c.country?.code" :size="16" />
              {{ c.navLabel }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </section>
</template>
