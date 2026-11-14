<script setup lang="ts">
import { computed, defineAsyncComponent, hydrateOnIdle, hydrateOnVisible } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowRight, Check, ChevronRight, Minus } from '@lucide/vue'
import MarketingHeader from '@/components/marketing/MarketingHeader.vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import SolutionVisual from '@/components/marketing/SolutionVisual.vue'
import CompareVisual, { type CompareVisualKind } from '@/components/marketing/CompareVisual.vue'
import { getMarketingPage, marketingPageByPath, pagesOfKind, type MarketingSection } from '@/seo/marketing'
import { getShowcase } from '@/seo/showcase'
import { resolvePageSeo } from '@/seo/pages'
import { rememberStartPlan } from '@/lib/startPlan'
import { useReveal } from '@/composables/useReveal'

const route = useRoute()
const page = computed(() => getMarketingPage(String(route.meta.marketingPath ?? route.path))!)
const sc = computed(() => getShowcase(page.value.path))
/** Visual propio de precios y comparativas (cada una distinta). */
const COMPARE_VISUAL: Record<string, CompareVisualKind> = {
  '/precios': 'pricing',
  '/alternativa-a-excel-para-proyectos': 'excel',
  '/alternativa-a-trello': 'trello',
  '/alternativa-a-asana-y-monday': 'suite',
}
const compareKind = computed(() => COMPARE_VISUAL[page.value.path])

/** Celda de comparativa → ícono (sí / no) o texto. */
function cellKind(v: string) {
  if (/^(sí|incluido)/i.test(v)) return 'yes'
  if (/^(no|no incluido|no es su enfoque)/i.test(v)) return 'no'
  return 'text'
}

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
      <section
        class="relative overflow-hidden pt-24"
        :class="page.kind === 'precios' ? 'pb-10 lg:pb-12 lg:pt-28' : 'pb-14 lg:pb-24 lg:pt-32'"
        aria-labelledby="page-h1"
      >
        <div class="landing-hero-bg pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          class="relative mx-auto px-5 lg:px-8"
          :class="
            sc
              ? 'grid max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14'
              : 'max-w-3xl text-center'
          "
        >
          <div class="min-w-0">
            <nav
              aria-label="Miga de pan"
              class="mb-6 flex flex-wrap items-center gap-1 text-xs font-medium text-[#42526e]"
              :class="sc ? '' : 'justify-center'"
            >
              <template v-for="(c, i) in breadcrumbs" :key="c.path">
                <ChevronRight v-if="i > 0" :size="12" aria-hidden="true" />
                <RouterLink v-if="i < breadcrumbs.length - 1" :to="c.path" class="hover:text-[#1868db]">{{ c.name }}</RouterLink>
                <span v-else aria-current="page" class="text-[#101214]">{{ c.name }}</span>
              </template>
            </nav>

            <p class="ql-eyebrow">
              <MktIcon v-if="sc" :name="sc.icon" :size="14" />
              {{ page.eyebrow }}
            </p>
            <h1
              id="page-h1"
              class="mt-5 text-[2.3rem] leading-[1.08] text-[#101214] sm:text-[3.2rem]"
              :class="sc ? 'lg:text-[3.6rem]' : ''"
            >
              {{ page.h1 }}
            </h1>
            <p class="mt-5 text-lg leading-relaxed text-[#42526e]" :class="sc ? 'max-w-xl' : 'mx-auto max-w-2xl'">
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
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#101214] ring-1 ring-[#f0f1f2]"
              >
                <Check :size="13" class="text-emerald-600" aria-hidden="true" /> {{ h }}
              </li>
            </ul>
          </div>

          <div v-if="sc" class="relative min-w-0">
            <CompareVisual v-if="compareKind" :kind="compareKind" :label="sc.visualLabel" />
            <div v-else class="ql-shot p-6 sm:p-8">
              <div class="ql-shot__tilt"><SolutionVisual :kind="sc.visual" :label="sc.visualLabel" /></div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ DATOS CLAVE (banda azul de marca) ============ -->
      <section v-if="sc" class="bg-[#eed7fc] text-[#101214]" aria-label="Datos clave">
        <dl class="mx-auto grid max-w-[1200px] grid-cols-2 px-5 lg:grid-cols-4 lg:px-8">
          <div
            v-for="(f, i) in sc.facts"
            :key="f.label"
            class="px-2 py-7 text-center lg:py-10"
            :class="[i % 2 === 1 ? 'border-l border-[#101214]/10' : '', i > 1 ? 'border-t border-[#101214]/10 lg:border-t-0' : '', i === 2 ? 'lg:border-l' : '']"
          >
            <dt class="sr-only">{{ f.label }}</dt>
            <dd>
              <span class="ql-display block text-[2.25rem] font-medium leading-none lg:text-[3rem]">{{ f.value }}</span>
              <span class="mt-2 block text-[13px] text-[#292a2e] lg:text-[15px]">{{ f.label }}</span>
            </dd>
          </div>
        </dl>
      </section>

      <!-- ============ PRECIOS ============ -->
      <section
        v-if="page.kind === 'precios'"
        class="bg-[#f0f1f2] pb-16 pt-2 lg:pb-24"
        aria-labelledby="planes-heading"
      >
        <div class="mx-auto max-w-[1200px] px-5 lg:px-8">
          <h2 id="planes-heading" class="sr-only">Planes y precios de QuinList</h2>
          <PricingCards />
        </div>
      </section>

      <!-- ============ FUNCIONES ============ -->
      <section v-if="sc && page.kind !== 'precios'" class="bg-white py-20 lg:py-28" aria-labelledby="features-heading">
        <div class="mx-auto max-w-[1200px] px-5 lg:px-8">
          <div class="max-w-2xl">
            <p class="ql-eyebrow">Funciones</p>
            <h2 id="features-heading" class="mt-3 text-[2rem] leading-[1.15] text-[#101214] lg:text-[3rem] lg:leading-[1.14]">{{ sc.featuresTitle }}</h2>
          </div>
          <ul class="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <li
              v-for="(f, i) in sc.features"
              :key="f.title"
              class="landing-reveal group rounded-2xl border border-[#dfe1e6] bg-white p-4 transition-colors duration-200 hover:border-[#c1c7d0] sm:p-6"
              :style="{ transitionDelay: `${(i % 3) * 50}ms` }"
            >
              <span class="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dfe1e6] text-[#101214]">
                <MktIcon :name="f.icon" :size="20" :stroke-width="1.4" />
              </span>
              <h3 class="mt-4 text-[15px] font-bold text-[#101214] sm:text-base">{{ f.title }}</h3>
              <p class="mt-1.5 text-xs leading-relaxed text-[#42526e] sm:text-sm">{{ f.text }}</p>
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
          :class="i % 2 === 0 ? 'bg-[#f0f1f2]' : 'bg-white'"
        >
          <div class="mx-auto max-w-[1200px] px-5 lg:px-8">
            <!-- Texto: título a la izquierda, párrafos a la derecha -->
            <div v-if="blockType(s) === 'text'" class="landing-reveal grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <h2 class="text-[1.75rem] leading-[1.2] text-[#101214] lg:text-[2.5rem] lg:leading-[1.14]">{{ s.heading }}</h2>
              <div>
                <p v-for="(b, j) in s.body ?? []" :key="j" class="text-base leading-relaxed text-[#42526e] [&+p]:mt-4">{{ b }}</p>
                <ul v-if="s.bullets" class="mt-4 space-y-2">
                  <li v-for="b in s.bullets" :key="b" class="flex gap-2 text-[15px] text-[#101214]">
                    <Check :size="18" class="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" /> {{ b }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Lista → tarjetas (carril en celular) -->
            <template v-else-if="blockType(s) === 'cards'">
              <div class="landing-reveal max-w-3xl">
                <h2 class="text-[1.75rem] leading-[1.2] text-[#101214] lg:text-[2.5rem] lg:leading-[1.14]">{{ s.heading }}</h2>
                <p v-for="(b, j) in s.body ?? []" :key="j" class="mt-3 text-base leading-relaxed text-[#42526e]">{{ b }}</p>
              </div>
              <ul class="mkt-rail mkt-rail--3 mt-10">
                <li
                  v-for="(b, k) in s.bullets"
                  :key="b"
                  class="flex gap-3.5 rounded-[20px] bg-white p-5 text-[15px] leading-snug text-[#101214] shadow-[0_1px_2px_rgba(23,43,77,0.05)] ring-1 ring-[#f0f1f2]"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#dfe1e6] text-xs font-semibold text-[#101214]">
                    {{ k + 1 }}
                  </span>
                  <span>{{ b }}</span>
                </li>
              </ul>
            </template>

            <!-- Pasos → línea de tiempo horizontal -->
            <template v-else>
              <h2 class="landing-reveal max-w-3xl text-[1.75rem] leading-[1.2] text-[#101214] lg:text-[2.5rem] lg:leading-[1.14]">{{ s.heading }}</h2>
              <p v-for="(b, j) in s.body ?? []" :key="j" class="mt-3 max-w-3xl text-base leading-relaxed text-[#42526e]">{{ b }}</p>
              <ol class="mkt-rail mt-10" :class="(s.steps?.length ?? 0) >= 4 ? 'mkt-rail--4' : 'mkt-rail--3'">
                <li v-for="(st, k) in s.steps" :key="st.title" class="relative rounded-[20px] bg-white p-6 ring-1 ring-[#f0f1f2]">
                  <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#1868db] text-sm font-semibold text-white">{{ k + 1 }}</span>
                  <h3 class="mt-4 font-bold text-[#101214]">{{ st.title }}</h3>
                  <p class="mt-1.5 text-sm leading-relaxed text-[#42526e]">{{ st.text }}</p>
                </li>
              </ol>
            </template>
          </div>
        </section>
      </template>

      <!-- ============ SECCIONES (guías: formato de artículo) ============ -->
      <article v-else class="mx-auto max-w-3xl px-5 pb-6 lg:px-8">
        <section v-for="(s, i) in page.sections" :key="s.heading" class="landing-reveal py-9" :class="i > 0 ? 'border-t border-[#f0f1f2]' : ''">
          <h2 class="text-2xl font-bold text-[#101214] lg:text-3xl">{{ s.heading }}</h2>
          <p v-for="(b, j) in s.body ?? []" :key="j" class="mt-4 text-[17px] leading-[1.75] text-[#42526e]">{{ b }}</p>
          <ul v-if="s.bullets" class="mt-5 space-y-3">
            <li v-for="b in s.bullets" :key="b" class="flex gap-3 text-[16px] leading-relaxed text-[#101214]">
              <span class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e9f2fe] text-[#1868db]">
                <Check :size="13" aria-hidden="true" />
              </span>
              {{ b }}
            </li>
          </ul>
          <ol v-if="s.steps" class="mkt-rail mt-6">
            <li v-for="(st, k) in s.steps" :key="st.title" class="rounded-[20px] bg-[#f0f1f2] p-5">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#1868db] text-xs font-semibold text-white">{{ k + 1 }}</span>
              <h3 class="mt-3 font-bold text-[#101214]">{{ st.title }}</h3>
              <p class="mt-1 text-sm leading-relaxed text-[#42526e]">{{ st.text }}</p>
            </li>
          </ol>
        </section>
      </article>

      <!-- ============ IDEAL PARA ============ -->
      <section v-if="sc && page.kind !== 'precios'" class="bg-white py-14" aria-labelledby="ideal-heading">
        <div class="mx-auto flex max-w-[1200px] flex-col items-center px-5 text-center lg:px-8">
          <h2 id="ideal-heading" class="ql-eyebrow">Ideal para</h2>
          <ul class="mt-5 flex flex-wrap justify-center gap-2.5">
            <li v-for="t in sc.idealFor" :key="t" class="rounded-md border border-[#dfe1e6] bg-white px-3.5 py-1.5 text-sm font-medium text-[#101214]">
              {{ t }}
            </li>
          </ul>
        </div>
      </section>

      <!-- ============ COMPARATIVA ============ -->
      <section v-if="page.comparison" class="bg-[#e9f2fe] py-16 lg:py-24" aria-labelledby="compare-heading">
        <div class="landing-reveal mx-auto max-w-5xl px-5 lg:px-8">
          <div class="text-center">
            <p class="ql-eyebrow bg-white">{{ page.kind === 'precios' ? 'Planes' : 'Comparativa' }}</p>
            <h2 id="compare-heading" class="mt-4 text-[2rem] leading-[1.14] text-[#101214] lg:text-[2.8rem]">
              {{ page.comparison.caption }}
            </h2>
          </div>
          <div class="mt-10 overflow-x-auto rounded-[20px] bg-white shadow-[0_0_1px_rgba(9,30,66,0.31),0_20px_40px_-28px_rgba(9,30,66,0.45)]">
            <table class="w-full min-w-[560px] text-left text-[15px]">
              <caption class="sr-only">{{ page.comparison.caption }}</caption>
              <thead>
                <tr>
                  <th
                    v-for="(h, i) in page.comparison.headers"
                    :key="h"
                    scope="col"
                    class="px-5 py-5 text-[14px] font-semibold"
                    :class="i === 2 ? 'bg-[#1868db] text-center text-white' : i === 1 ? 'text-center text-[#42526e]' : 'text-[#42526e]'"
                  >
                    <span v-if="i === 2" class="inline-flex items-center gap-1.5"><span class="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[10px] font-extrabold">Q</span>{{ h }}</span>
                    <template v-else>{{ h }}</template>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in page.comparison.rows" :key="row[0]" class="border-t border-[#f0f1f2]">
                  <th scope="row" class="px-5 py-4 font-medium text-[#101214]">{{ row[0] }}</th>
                  <td v-for="j in [1, 2]" :key="j" class="px-5 py-4 text-center" :class="j === 2 ? 'bg-[#f3f8ff] font-semibold text-[#101214]' : 'text-[#42526e]'">
                    <span v-if="cellKind(row[j]!) === 'yes'" class="inline-flex items-center gap-1.5">
                      <span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check :size="14" aria-hidden="true" /></span>
                      <span v-if="row[j]!.length > 3" class="text-[14px]">{{ row[j] }}</span>
                      <span v-else class="sr-only">Sí</span>
                    </span>
                    <span v-else-if="cellKind(row[j]!) === 'no'" class="inline-flex items-center gap-1.5 text-[#6b778c]">
                      <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f1f2]"><Minus :size="14" aria-hidden="true" /></span>
                      <span class="text-[14px]">{{ row[j] === 'No' ? 'No' : row[j] }}</span>
                    </span>
                    <span v-else>{{ row[j] }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="page.kind !== 'precios'" class="mt-8 flex justify-center">
            <RouterLink :to="{ path: '/register', query: { plan: 'free' } }" class="ql-btn px-6 py-3.5" @click="rememberStartPlan('free')">
              Pruébalo gratis <ArrowRight :size="17" aria-hidden="true" />
            </RouterLink>
          </div>
        </div>
      </section>

      <div class="bg-white">
        <div class="mx-auto max-w-[1200px] px-5 lg:px-8">
          <p v-if="page.disclaimer" class="pb-2 text-xs leading-relaxed text-[#42526e]">{{ page.disclaimer }}</p>
          <p class="pb-6 text-xs text-[#42526e]">
            Actualizado el <time :datetime="page.updated">{{ updatedLabel }}</time> · Equipo QuinList, MatuByte S.A.S.
          </p>
        </div>
      </div>

      <!-- ============ FAQ ============ -->
      <MarketingFaq v-if="page.faqs.length" :faqs="page.faqs" id-prefix="mkt-faq" />

      <!-- ============ RELACIONADOS ============ -->
      <section v-if="related.length" class="bg-[#f0f1f2] py-20" aria-labelledby="related-heading">
        <div class="mx-auto max-w-[1200px] px-5 lg:px-8">
          <h2 id="related-heading" class="text-2xl font-bold text-[#101214] lg:text-3xl" :class="page.hub ? '' : 'text-center'">
            {{ page.hub ? 'Todas las guías' : 'Sigue explorando' }}
          </h2>
          <ul class="mkt-rail mkt-rail--4 mt-10">
            <li v-for="r in related" :key="r.path">
              <RouterLink
                :to="r.path"
                class="group flex h-full flex-col rounded-[20px] bg-white p-5 ring-1 ring-[#f0f1f2] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(23,43,77,0.4)]"
              >
                <span class="flex items-center gap-2 text-xs font-semibold text-[#42526e]">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe1e6] text-[#101214]">
                    <MktIcon :name="getShowcase(r.path)?.icon ?? 'FileText'" :size="16" :stroke-width="1.4" />
                  </span>
                  {{ r.eyebrow }}
                </span>
                <span class="mt-3 flex-1 font-bold leading-snug text-[#101214]">{{ r.h1 }}</span>
                <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1868db]">
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
