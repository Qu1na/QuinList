<script setup lang="ts">
import { computed, defineAsyncComponent, hydrateOnIdle, hydrateOnVisible } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowRight, Check, ChevronRight } from '@lucide/vue'
import MarketingHeader from '@/components/marketing/MarketingHeader.vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import SolutionVisual from '@/components/marketing/SolutionVisual.vue'
import { ACCENT } from '@/components/marketing/accent'
import { getMarketingPage, marketingPageByPath, pagesOfKind, type MarketingSection } from '@/seo/marketing'
import { getShowcase } from '@/seo/showcase'
import { resolvePageSeo } from '@/seo/pages'
import { rememberStartPlan } from '@/lib/startPlan'
import { useReveal } from '@/composables/useReveal'

const route = useRoute()
const page = computed(() => getMarketingPage(String(route.meta.marketingPath ?? route.path))!)
const sc = computed(() => getShowcase(page.value.path))
const accent = computed(() => ACCENT[sc.value?.accent ?? 'sky'])
const isGuide = computed(() => page.value.kind === 'guia')
const breadcrumbs = computed(() => resolvePageSeo(page.value.path).breadcrumbs ?? [])
const related = computed(() =>
  page.value.hub
    ? pagesOfKind(page.value.kind).filter((p) => !p.hub)
    : page.value.related.map((p) => marketingPageByPath[p]).filter((p) => p !== undefined),
)
const updatedLabel = computed(() =>
  new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(page.value.updated)),
)

/** Tipo de bloque para elegir el diseño de cada sección. */
function blockType(s: MarketingSection) {
  if (s.steps) return 'steps'
  if (s.bullets && s.bullets.length >= 3) return 'cards'
  return 'text'
}

useReveal()

const visible = { hydrate: hydrateOnVisible({ rootMargin: '300px' }) }
const PricingCards = defineAsyncComponent({ loader: () => import('@/components/marketing/PricingCards.vue'), ...visible })
const MarketingFaq = defineAsyncComponent({ loader: () => import('@/components/marketing/MarketingFaq.vue'), ...visible })
const MarketingCta = defineAsyncComponent({ loader: () => import('@/components/marketing/MarketingCta.vue'), ...visible })
const MarketingFooter = defineAsyncComponent({
  loader: () => import('@/components/marketing/MarketingFooter.vue'),
  hydrate: hydrateOnIdle(),
})
</script>

<template>
  <div class="landing-page overflow-x-clip">
    <a href="#contenido-principal" class="landing-skip">Saltar al contenido</a>
    <MarketingHeader />

    <main id="contenido-principal">
      <!-- ============ HERO ============ -->
      <section class="relative overflow-hidden pb-14 pt-24 lg:pb-24 lg:pt-32" aria-labelledby="page-h1">
        <div class="landing-hero-bg pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          class="relative mx-auto px-5 lg:px-8"
          :class="
            sc
              ? 'grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14'
              : 'max-w-4xl text-center'
          "
        >
          <div class="min-w-0">
            <nav
              aria-label="Miga de pan"
              class="mb-6 flex flex-wrap items-center gap-1 text-xs font-medium text-[#5e6c84]"
              :class="sc ? '' : 'justify-center'"
            >
              <template v-for="(c, i) in breadcrumbs" :key="c.path">
                <ChevronRight v-if="i > 0" :size="12" aria-hidden="true" />
                <RouterLink v-if="i < breadcrumbs.length - 1" :to="c.path" class="hover:text-[#2a72a8]">{{ c.name }}</RouterLink>
                <span v-else aria-current="page" class="text-[#172b4d]">{{ c.name }}</span>
              </template>
            </nav>

            <p
              class="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3.5 text-xs font-bold shadow-[0_1px_2px_rgba(23,43,77,0.08)] ring-1 ring-[#e4e9f0]"
              :class="sc ? accent.text : 'text-[#2a72a8]'"
            >
              <span v-if="sc" class="flex h-6 w-6 items-center justify-center rounded-full" :class="accent.tile">
                <MktIcon :name="sc.icon" :size="14" />
              </span>
              <span :class="sc ? '' : 'pl-2.5'">{{ page.eyebrow }}</span>
            </p>
            <h1
              id="page-h1"
              class="mt-5 text-[2.15rem] font-extrabold leading-[1.06] text-[#172b4d] sm:text-5xl"
              :class="sc ? 'lg:text-[3.3rem]' : ''"
            >
              {{ page.h1 }}
            </h1>
            <p class="mt-5 text-lg leading-relaxed text-[#44546f]" :class="sc ? 'max-w-xl' : 'mx-auto max-w-2xl'">
              {{ page.intro }}
            </p>

            <div v-if="page.kind !== 'precios'" class="mt-8 flex flex-wrap gap-3" :class="sc ? '' : 'justify-center'">
              <RouterLink
                :to="{ path: '/register', query: { plan: 'free' } }"
                class="ql-btn px-6 py-3.5 text-base"
                @click="rememberStartPlan('free')"
              >
                Empieza gratis <ArrowRight :size="17" aria-hidden="true" />
              </RouterLink>
              <RouterLink to="/precios" class="ql-btn--ghost px-6 py-3.5 text-base">Ver precios</RouterLink>
            </div>

            <!-- Puntos clave: carril horizontal en celular -->
            <ul
              class="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible"
              :class="sc ? '' : 'sm:justify-center'"
            >
              <li
                v-for="h in page.highlights"
                :key="h"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#172b4d] ring-1 ring-[#e4e9f0]"
              >
                <Check :size="13" class="text-emerald-600" aria-hidden="true" /> {{ h }}
              </li>
            </ul>
          </div>

          <div v-if="sc" class="relative min-w-0">
            <div class="absolute -inset-4 rounded-[2.5rem] sm:-inset-8" :class="accent.soft" aria-hidden="true" />
            <SolutionVisual :kind="sc.visual" :label="sc.visualLabel" class="relative" />
          </div>
        </div>
      </section>

      <!-- ============ DATOS CLAVE (banda azul de marca) ============ -->
      <section v-if="sc" class="bg-[#2a72a8] text-white" aria-label="Datos clave">
        <dl class="mx-auto grid max-w-6xl grid-cols-2 px-5 lg:grid-cols-4 lg:px-8">
          <div
            v-for="(f, i) in sc.facts"
            :key="f.label"
            class="px-2 py-7 text-center lg:py-10"
            :class="[i % 2 === 1 ? 'border-l border-white/15' : '', i > 1 ? 'border-t border-white/15 lg:border-t-0' : '', i === 2 ? 'lg:border-l' : '']"
          >
            <dt class="sr-only">{{ f.label }}</dt>
            <dd>
              <span class="block text-3xl font-extrabold tracking-tight lg:text-4xl">{{ f.value }}</span>
              <span class="mt-1.5 block text-xs font-medium text-white lg:text-sm">{{ f.label }}</span>
            </dd>
          </div>
        </dl>
      </section>

      <!-- ============ PRECIOS ============ -->
      <section v-if="page.kind === 'precios'" class="bg-[#f6f8fb] pb-20 pt-6" aria-labelledby="planes-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 id="planes-heading" class="sr-only">Planes y precios de QuinList</h2>
          <PricingCards />
        </div>
      </section>

      <!-- ============ FUNCIONES ============ -->
      <section v-if="sc" class="bg-white py-20 lg:py-28" aria-labelledby="features-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <div class="max-w-2xl">
            <p class="ql-eyebrow">Funciones</p>
            <h2 id="features-heading" class="mt-3 text-3xl font-bold text-[#172b4d] lg:text-[2.6rem] lg:leading-[1.1]">{{ sc.featuresTitle }}</h2>
          </div>
          <ul class="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <li
              v-for="(f, i) in sc.features"
              :key="f.title"
              class="landing-reveal group rounded-2xl bg-[#f6f8fb] p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_40px_-24px_rgba(23,43,77,0.4)] hover:ring-1 hover:ring-[#e4e9f0] sm:p-6"
              :style="{ transitionDelay: `${(i % 3) * 50}ms` }"
            >
              <span class="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" :class="accent.tile">
                <MktIcon :name="f.icon" :size="21" />
              </span>
              <h3 class="mt-4 text-[15px] font-bold text-[#172b4d] sm:text-base">{{ f.title }}</h3>
              <p class="mt-1.5 text-xs leading-relaxed text-[#44546f] sm:text-sm">{{ f.text }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- ============ SECCIONES (soluciones, países, comparativas) ============ -->
      <template v-if="!isGuide">
        <section
          v-for="(s, i) in page.sections"
          :key="s.heading"
          class="py-16 lg:py-24"
          :class="i % 2 === 0 ? 'bg-[#f6f8fb]' : 'bg-white'"
        >
          <div class="mx-auto max-w-6xl px-5 lg:px-8">
            <!-- Texto: título a la izquierda, párrafos a la derecha -->
            <div v-if="blockType(s) === 'text'" class="landing-reveal grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <h2 class="text-2xl font-bold text-[#172b4d] lg:text-[2.1rem] lg:leading-tight">{{ s.heading }}</h2>
              <div>
                <p v-for="(b, j) in s.body ?? []" :key="j" class="text-base leading-relaxed text-[#44546f] [&+p]:mt-4">{{ b }}</p>
                <ul v-if="s.bullets" class="mt-4 space-y-2">
                  <li v-for="b in s.bullets" :key="b" class="flex gap-2 text-[15px] text-[#172b4d]">
                    <Check :size="18" class="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" /> {{ b }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Lista → tarjetas (carril en celular) -->
            <template v-else-if="blockType(s) === 'cards'">
              <div class="landing-reveal max-w-3xl">
                <h2 class="text-2xl font-bold text-[#172b4d] lg:text-[2.1rem] lg:leading-tight">{{ s.heading }}</h2>
                <p v-for="(b, j) in s.body ?? []" :key="j" class="mt-3 text-base leading-relaxed text-[#44546f]">{{ b }}</p>
              </div>
              <ul class="mkt-rail mkt-rail--3 mt-10">
                <li
                  v-for="(b, k) in s.bullets"
                  :key="b"
                  class="flex gap-3.5 rounded-2xl bg-white p-5 text-[15px] leading-snug text-[#172b4d] shadow-[0_1px_2px_rgba(23,43,77,0.05)] ring-1 ring-[#e4e9f0]"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold" :class="accent.tile">
                    {{ k + 1 }}
                  </span>
                  <span>{{ b }}</span>
                </li>
              </ul>
            </template>

            <!-- Pasos → línea de tiempo horizontal -->
            <template v-else>
              <h2 class="landing-reveal max-w-3xl text-2xl font-bold text-[#172b4d] lg:text-[2.1rem] lg:leading-tight">{{ s.heading }}</h2>
              <p v-for="(b, j) in s.body ?? []" :key="j" class="mt-3 max-w-3xl text-base leading-relaxed text-[#44546f]">{{ b }}</p>
              <ol class="mkt-rail mt-10" :class="(s.steps?.length ?? 0) >= 4 ? 'mkt-rail--4' : 'mkt-rail--3'">
                <li v-for="(st, k) in s.steps" :key="st.title" class="relative rounded-2xl bg-white p-6 ring-1 ring-[#e4e9f0]">
                  <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a72a8] text-sm font-extrabold text-white">{{ k + 1 }}</span>
                  <h3 class="mt-4 font-bold text-[#172b4d]">{{ st.title }}</h3>
                  <p class="mt-1.5 text-sm leading-relaxed text-[#44546f]">{{ st.text }}</p>
                </li>
              </ol>
            </template>
          </div>
        </section>
      </template>

      <!-- ============ SECCIONES (guías: formato de artículo) ============ -->
      <article v-else class="mx-auto max-w-3xl px-5 pb-6 lg:px-8">
        <section v-for="(s, i) in page.sections" :key="s.heading" class="landing-reveal py-9" :class="i > 0 ? 'border-t border-[#e4e9f0]' : ''">
          <h2 class="text-2xl font-bold text-[#172b4d] lg:text-3xl">{{ s.heading }}</h2>
          <p v-for="(b, j) in s.body ?? []" :key="j" class="mt-4 text-[17px] leading-[1.75] text-[#44546f]">{{ b }}</p>
          <ul v-if="s.bullets" class="mt-5 space-y-3">
            <li v-for="b in s.bullets" :key="b" class="flex gap-3 text-[16px] leading-relaxed text-[#172b4d]">
              <span class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef5fb] text-[#2a72a8]">
                <Check :size="13" aria-hidden="true" />
              </span>
              {{ b }}
            </li>
          </ul>
          <ol v-if="s.steps" class="mkt-rail mt-6">
            <li v-for="(st, k) in s.steps" :key="st.title" class="rounded-2xl bg-[#f6f8fb] p-5">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a72a8] text-xs font-extrabold text-white">{{ k + 1 }}</span>
              <h3 class="mt-3 font-bold text-[#172b4d]">{{ st.title }}</h3>
              <p class="mt-1 text-sm leading-relaxed text-[#44546f]">{{ st.text }}</p>
            </li>
          </ol>
        </section>
      </article>

      <!-- ============ IDEAL PARA ============ -->
      <section v-if="sc" class="bg-white py-14" aria-labelledby="ideal-heading">
        <div class="mx-auto flex max-w-6xl flex-col items-center px-5 text-center lg:px-8">
          <h2 id="ideal-heading" class="ql-eyebrow">Ideal para</h2>
          <ul class="mt-5 flex flex-wrap justify-center gap-2.5">
            <li v-for="t in sc.idealFor" :key="t" class="rounded-full px-4 py-2 text-sm font-semibold ring-1" :class="[accent.tile, accent.ring]">
              {{ t }}
            </li>
          </ul>
        </div>
      </section>

      <!-- ============ COMPARATIVA ============ -->
      <section v-if="page.comparison" class="bg-white py-16 lg:py-24">
        <div class="landing-reveal mx-auto max-w-4xl px-5 lg:px-8">
          <h2 class="text-2xl font-bold text-[#172b4d] lg:text-3xl">{{ page.comparison.caption }}</h2>
          <div class="mt-6 overflow-x-auto rounded-2xl ring-1 ring-[#e4e9f0]">
            <table class="w-full min-w-[520px] text-left text-sm">
              <caption class="sr-only">{{ page.comparison.caption }}</caption>
              <thead class="bg-[#f6f8fb] text-[#172b4d]">
                <tr>
                  <th v-for="(h, i) in page.comparison.headers" :key="h" scope="col" class="px-4 py-3.5 font-bold" :class="i === 2 ? 'bg-[#2a72a8] text-white' : ''">
                    {{ h }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in page.comparison.rows" :key="row[0]" class="border-t border-[#e4e9f0]">
                  <th scope="row" class="px-4 py-3.5 font-semibold text-[#172b4d]">{{ row[0] }}</th>
                  <td class="px-4 py-3.5 text-[#44546f]">{{ row[1] }}</td>
                  <td class="bg-[#eef5fb] px-4 py-3.5 font-semibold text-[#172b4d]">{{ row[2] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div class="bg-white">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <p v-if="page.disclaimer" class="pb-2 text-xs leading-relaxed text-[#5e6c84]">{{ page.disclaimer }}</p>
          <p class="pb-6 text-xs text-[#5e6c84]">
            Actualizado el <time :datetime="page.updated">{{ updatedLabel }}</time> · Equipo QuinList, MatuByte S.A.S.
          </p>
        </div>
      </div>

      <!-- ============ FAQ ============ -->
      <MarketingFaq v-if="page.faqs.length" :faqs="page.faqs" id-prefix="mkt-faq" />

      <!-- ============ RELACIONADOS ============ -->
      <section v-if="related.length" class="bg-[#f6f8fb] py-20" aria-labelledby="related-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 id="related-heading" class="text-2xl font-bold text-[#172b4d] lg:text-3xl" :class="page.hub ? '' : 'text-center'">
            {{ page.hub ? 'Todas las guías' : 'Sigue explorando' }}
          </h2>
          <ul class="mkt-rail mkt-rail--4 mt-10">
            <li v-for="r in related" :key="r.path">
              <RouterLink
                :to="r.path"
                class="group flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-[#e4e9f0] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(23,43,77,0.4)]"
              >
                <span class="flex items-center gap-2 text-xs font-semibold text-[#5e6c84]">
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg"
                    :class="getShowcase(r.path) ? ACCENT[getShowcase(r.path)!.accent].tile : 'bg-[#eef5fb] text-[#2a72a8]'"
                  >
                    <MktIcon :name="getShowcase(r.path)?.icon ?? 'FileText'" :size="16" />
                  </span>
                  {{ r.eyebrow }}
                </span>
                <span class="mt-3 flex-1 font-bold leading-snug text-[#172b4d]">{{ r.h1 }}</span>
                <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2a72a8]">
                  Ver más <ArrowRight :size="14" class="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </section>

      <MarketingCta />
    </main>

    <MarketingFooter />
  </div>
</template>
