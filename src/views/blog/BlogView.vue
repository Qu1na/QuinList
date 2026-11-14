<script setup lang="ts">
/**
 * Blog: una sola vista para el índice (/blog), cada segmento (/blog/:segmento)
 * y cada entrada (/blog/:segmento/:entrada). El modo llega en route.meta.blogKind.
 */
import { computed, defineAsyncComponent, hydrateOnIdle, hydrateOnVisible } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowRight, ChevronRight, Lightbulb } from '@lucide/vue'
import MarketingHeader from '@/components/marketing/MarketingHeader.vue'
import MktIcon from '@/components/marketing/MktIcon.vue'
import BlogCard from '@/components/blog/BlogCard.vue'
import BlogCover from '@/components/blog/BlogCover.vue'
import {
  blogSegments,
  getPostByPath,
  getSegment,
  getSegmentByPath,
  postsOfSegment,
  readingMinutes,
  relatedPosts,
  segmentPath,
  sortedPosts,
} from '@/seo/blog'
import { marketingPageByPath } from '@/seo/marketing'
import { resolvePageSeo } from '@/seo/pages'
import { rememberStartPlan } from '@/lib/startPlan'

const route = useRoute()
const kind = computed(() => String(route.meta.blogKind ?? 'index') as 'index' | 'segment' | 'post')
const path = computed(() => String(route.meta.blogPath ?? route.path))

const post = computed(() => (kind.value === 'post' ? getPostByPath(path.value) : undefined))
const segment = computed(() =>
  kind.value === 'segment' ? getSegmentByPath(path.value) : post.value ? getSegment(post.value.segment) : undefined,
)
const list = computed(() => (kind.value === 'segment' && segment.value ? postsOfSegment(segment.value.slug) : sortedPosts))
const featured = computed(() => list.value[0])
const rest = computed(() => list.value.slice(1))
const breadcrumbs = computed(() => resolvePageSeo(path.value).breadcrumbs ?? [])
const toc = computed(() => post.value?.body.filter((b) => b.type === 'h2') ?? [])
const related = computed(() => (post.value ? relatedPosts(post.value) : []))
const relatedPages = computed(() =>
  (post.value?.related ?? []).map((p) => marketingPageByPath[p]).filter((p) => p !== undefined),
)

function fmt(d: string) {
  return new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(d))
}
function isInternal(to: string) {
  return to.startsWith('/')
}

const visible = { hydrate: hydrateOnVisible({ rootMargin: '300px' }) }
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

    <main id="contenido-principal" class="pt-16">
      <!-- Migas -->
      <nav aria-label="Miga de pan" class="mx-auto max-w-[1200px] px-6 pt-8 lg:px-8">
        <ol class="flex flex-wrap items-center gap-1 text-[13px] font-medium text-[#42526e]">
          <li v-for="(c, i) in breadcrumbs" :key="c.path" class="flex items-center gap-1">
            <ChevronRight v-if="i > 0" :size="12" aria-hidden="true" />
            <RouterLink v-if="i < breadcrumbs.length - 1" :to="c.path" class="hover:text-[#1868db]">{{ c.name }}</RouterLink>
            <span v-else aria-current="page" class="line-clamp-1 text-[#101214]">{{ c.name }}</span>
          </li>
        </ol>
      </nav>

      <!-- ================= ÍNDICE Y SEGMENTO ================= -->
      <template v-if="kind !== 'post'">
        <section class="mx-auto max-w-[1200px] px-6 pb-10 pt-8 lg:px-8 lg:pb-14" aria-labelledby="blog-h1">
          <p class="ql-eyebrow">
            <MktIcon v-if="segment" :name="segment.icon" :size="14" />
            {{ segment ? 'Segmento' : 'Blog de QuinList' }}
          </p>
          <h1 id="blog-h1" class="mt-5 max-w-3xl text-[2.4rem] leading-[1.08] text-[#101214] sm:text-[3.4rem] lg:text-[4rem]">
            <template v-if="segment">{{ segment.name }}</template>
            <template v-else>Ideas para gestionar proyectos <span class="ql-mark">sin caos</span></template>
          </h1>
          <p class="mt-5 max-w-2xl text-[18px] leading-relaxed text-[#42526e]">
            {{
              segment
                ? segment.description
                : 'Guías prácticas sobre gestión de proyectos, finanzas, equipos y herramientas para empresas de Latinoamérica.'
            }}
          </p>

          <!-- Segmentos -->
          <nav class="-mx-6 mt-8 overflow-x-auto px-6 [scrollbar-width:none] lg:mx-0 lg:px-0" aria-label="Segmentos del blog">
            <ul class="flex w-max gap-2">
              <li>
                <RouterLink
                  to="/blog"
                  class="inline-flex rounded-full border border-[#101214] px-4 py-2 text-[14px] font-medium transition-colors"
                  :class="!segment ? 'bg-[#101214] text-white' : 'text-[#101214] hover:bg-[#f0f1f2]'"
                  :aria-current="!segment ? 'page' : undefined"
                >
                  Todos
                </RouterLink>
              </li>
              <li v-for="s in blogSegments" :key="s.slug">
                <RouterLink
                  :to="segmentPath(s)"
                  class="inline-flex items-center gap-1.5 rounded-full border border-[#101214] px-4 py-2 text-[14px] font-medium transition-colors"
                  :class="segment?.slug === s.slug ? 'bg-[#101214] text-white' : 'text-[#101214] hover:bg-[#f0f1f2]'"
                  :aria-current="segment?.slug === s.slug ? 'page' : undefined"
                >
                  <MktIcon :name="s.icon" :size="15" /> {{ s.name }}
                  <span class="text-[12px] opacity-70">{{ postsOfSegment(s.slug).length }}</span>
                </RouterLink>
              </li>
            </ul>
          </nav>
        </section>

        <!-- Destacado -->
        <section v-if="featured" class="mx-auto max-w-[1200px] px-6 lg:px-8" aria-label="Entrada destacada">
          <RouterLink
            :to="`/blog/${featured.segment}/${featured.slug}`"
            class="group grid items-center gap-8 rounded-[20px] bg-[#f0f1f2] p-4 sm:p-6 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:p-8"
          >
            <BlogCover :segment="featured.segment" :title="getSegment(featured.segment)?.name" size="lg" />
            <div class="min-w-0 pb-2 lg:pb-0">
              <p class="text-[13px] font-medium text-[#1868db]">Lo más reciente · {{ getSegment(featured.segment)?.name }}</p>
              <h2 class="mt-2 text-[1.8rem] leading-[1.15] text-[#101214] group-hover:text-[#1868db] lg:text-[2.4rem]">
                {{ featured.h1 }}
              </h2>
              <p class="mt-4 text-[16px] leading-relaxed text-[#292a2e]">{{ featured.excerpt }}</p>
              <p class="mt-5 text-[13px] text-[#42526e]">
                <time :datetime="featured.published">{{ fmt(featured.published) }}</time> · {{ readingMinutes(featured) }} min de lectura
              </p>
              <span class="ql-link mt-5 text-[15px]">Leer artículo <ArrowRight :size="16" aria-hidden="true" /></span>
            </div>
          </RouterLink>
        </section>

        <!-- Resto de entradas -->
        <section v-if="rest.length" class="mx-auto max-w-[1200px] px-6 py-16 lg:px-8 lg:py-20" aria-labelledby="blog-list">
          <h2 id="blog-list" class="text-[1.75rem] text-[#101214] lg:text-[2.2rem]">
            {{ segment ? `Más sobre ${segment.name.toLowerCase()}` : 'Todas las entradas' }}
          </h2>
          <ul class="mkt-rail mkt-rail--3 mt-8 lg:gap-x-8 lg:gap-y-12">
            <li v-for="p in rest" :key="p.slug"><BlogCard :post="p" /></li>
          </ul>
        </section>

        <!-- Otros segmentos (en la página de un segmento) -->
        <section v-if="segment" class="bg-[#eed7fc] py-16" aria-labelledby="other-segments">
          <div class="mx-auto max-w-[1200px] px-6 lg:px-8">
            <h2 id="other-segments" class="text-[1.75rem] text-[#101214]">Explora otros segmentos</h2>
            <ul class="mt-8 grid gap-4 sm:grid-cols-3">
              <li v-for="s in blogSegments.filter((x) => x.slug !== segment!.slug)" :key="s.slug">
                <RouterLink :to="segmentPath(s)" class="ql-card group flex h-full flex-col p-6">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f2fe] text-[#1868db]">
                    <MktIcon :name="s.icon" :size="22" />
                  </span>
                  <span class="ql-display mt-4 text-[20px] font-medium text-[#101214] group-hover:text-[#1868db]">{{ s.name }}</span>
                  <span class="mt-2 text-[14px] leading-relaxed text-[#42526e]">{{ s.description }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>
        </section>
      </template>

      <!-- ================= ENTRADA ================= -->
      <template v-else-if="post && segment">
        <article>
          <header class="mx-auto max-w-[820px] px-6 pb-10 pt-8 lg:px-8">
            <RouterLink :to="segmentPath(segment)" class="ql-eyebrow hover:bg-[#d8e8fd]">
              <MktIcon :name="segment.icon" :size="14" /> {{ segment.name }}
            </RouterLink>
            <h1 class="mt-5 text-[2.2rem] leading-[1.1] text-[#101214] sm:text-[3rem] lg:text-[3.4rem]">{{ post.h1 }}</h1>
            <p class="mt-5 text-[19px] leading-relaxed text-[#42526e]">{{ post.excerpt }}</p>
            <p class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#42526e]">
              <span class="font-medium text-[#101214]">Equipo QuinList</span>
              <span aria-hidden="true">·</span>
              <time :datetime="post.published">{{ fmt(post.published) }}</time>
              <span aria-hidden="true">·</span>
              <span>{{ readingMinutes(post) }} min de lectura</span>
            </p>
          </header>

          <div class="mx-auto max-w-[1100px] px-6 lg:px-8">
            <BlogCover :segment="post.segment" :title="segment.name" size="wide" />
          </div>

          <div class="mx-auto grid max-w-[1100px] gap-12 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_260px] lg:px-8">
            <!-- Cuerpo -->
            <div class="min-w-0 max-w-[720px] text-[17px] leading-[1.75] text-[#292a2e]">
              <template v-for="(b, i) in post.body" :key="i">
                <p v-if="b.type === 'p'" class="mb-6">{{ b.text }}</p>
                <h2 v-else-if="b.type === 'h2'" :id="b.id" class="mb-4 mt-12 scroll-mt-24 text-[1.75rem] leading-[1.2] text-[#101214] lg:text-[2rem]">
                  {{ b.text }}
                </h2>
                <h3 v-else-if="b.type === 'h3'" class="mb-3 mt-8 text-[1.3rem] font-semibold text-[#101214]">{{ b.text }}</h3>
                <ul v-else-if="b.type === 'ul'" class="mb-6 space-y-2.5 pl-1">
                  <li v-for="it in b.items" :key="it" class="flex gap-3">
                    <span class="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1868db]" aria-hidden="true" />{{ it }}
                  </li>
                </ul>
                <ol v-else-if="b.type === 'ol'" class="mb-6 space-y-3">
                  <li v-for="(it, k) in b.items" :key="it" class="flex gap-3">
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e9f2fe] text-[13px] font-semibold text-[#1868db]">{{ k + 1 }}</span>
                    <span class="pt-0.5">{{ it }}</span>
                  </li>
                </ol>
                <blockquote v-else-if="b.type === 'quote'" class="ql-display my-10 border-l-4 border-[#fca700] pl-6 text-[1.5rem] leading-snug text-[#101214]">
                  {{ b.text }}
                </blockquote>
                <aside v-else-if="b.type === 'tip'" class="my-8 flex gap-4 rounded-[20px] bg-[#e9f2fe] p-6">
                  <Lightbulb :size="22" class="mt-1 shrink-0 text-[#1868db]" aria-hidden="true" />
                  <div>
                    <p class="font-semibold text-[#101214]">{{ b.title }}</p>
                    <p class="mt-1 text-[16px] leading-relaxed">{{ b.text }}</p>
                  </div>
                </aside>
                <div v-else-if="b.type === 'table'" class="my-8 overflow-x-auto rounded-[20px] ring-1 ring-[#f0f1f2]">
                  <table class="w-full min-w-[480px] text-left text-[15px]">
                    <caption class="sr-only">{{ b.caption }}</caption>
                    <thead class="bg-[#f0f1f2] text-[#101214]">
                      <tr><th v-for="h in b.headers" :key="h" scope="col" class="px-4 py-3 font-semibold">{{ h }}</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(r, k) in b.rows" :key="k" class="border-t border-[#f0f1f2]">
                        <td v-for="(c, j) in r" :key="j" class="px-4 py-3 align-top" :class="j === 0 ? 'font-medium text-[#101214]' : ''">{{ c }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else-if="b.type === 'cta'" class="my-10 flex flex-col items-start gap-4 rounded-[20px] bg-[#101214] p-7 text-white sm:flex-row sm:items-center sm:justify-between">
                  <p class="ql-display text-[1.25rem] leading-snug">{{ b.text }}</p>
                  <RouterLink
                    v-if="isInternal(b.to)"
                    :to="b.to"
                    class="ql-btn ql-btn--yellow shrink-0"
                    @click="b.to.startsWith('/register') && rememberStartPlan('free')"
                  >
                    {{ b.label }}
                  </RouterLink>
                </div>
              </template>

              <p class="mt-10 border-t border-[#f0f1f2] pt-6 text-[14px] text-[#42526e]">
                Actualizado el <time :datetime="post.updated">{{ fmt(post.updated) }}</time> · Equipo QuinList, MatuByte S.A.S.
              </p>
            </div>

            <!-- Índice lateral -->
            <aside class="hidden lg:block" aria-label="En este artículo">
              <div class="sticky top-24">
                <p class="text-[13px] font-semibold text-[#101214]">En este artículo</p>
                <ol class="mt-3 space-y-2 border-l border-[#f0f1f2] text-[14px]">
                  <li v-for="h in toc" :key="h.type === 'h2' ? h.id : ''">
                    <a v-if="h.type === 'h2'" :href="`#${h.id}`" class="-ml-px block border-l border-transparent pl-4 text-[#42526e] hover:border-[#1868db] hover:text-[#1868db]">
                      {{ h.text }}
                    </a>
                  </li>
                </ol>
                <div v-if="relatedPages.length" class="mt-8">
                  <p class="text-[13px] font-semibold text-[#101214]">En QuinList</p>
                  <ul class="mt-3 space-y-2 text-[14px]">
                    <li v-for="rp in relatedPages" :key="rp.path">
                      <RouterLink :to="rp.path" class="text-[#1868db] hover:underline">{{ rp.navLabel }}</RouterLink>
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </article>

        <MarketingFaq v-if="post.faqs.length" :faqs="post.faqs" id-prefix="blog-faq" />

        <section v-if="related.length" class="bg-[#f0f1f2] py-16 lg:py-20" aria-labelledby="related-posts">
          <div class="mx-auto max-w-[1200px] px-6 lg:px-8">
            <h2 id="related-posts" class="text-[1.75rem] text-[#101214] lg:text-[2.2rem]">Sigue leyendo</h2>
            <ul class="mkt-rail mkt-rail--3 mt-8 lg:gap-x-8">
              <li v-for="p in related" :key="p.slug"><BlogCard :post="p" /></li>
            </ul>
          </div>
        </section>
      </template>

      <MarketingCta />
    </main>

    <MarketingFooter />
  </div>
</template>
