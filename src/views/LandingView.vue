<script setup lang="ts">
import { defineAsyncComponent, hydrateOnIdle, hydrateOnVisible } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, CheckCircle2, Globe, ShieldCheck, Wallet, Zap } from '@lucide/vue'
import MarketingHeader from '@/components/marketing/MarketingHeader.vue'
import HeroAppWindow from '@/components/landing/HeroAppWindow.vue'
import { landingFaqs } from '@/seo/marketing'
import { reviewsDataset } from '@/utils/reviews'
import { rememberStartPlan } from '@/lib/startPlan'
import { useReveal } from '@/composables/useReveal'

useReveal()

const reviews = reviewsDataset.reviews.slice(0, 10)

const proof = [
  { icon: Zap, title: 'Listo en 2 minutos', text: 'Sin instalar nada' },
  { icon: Wallet, title: 'Tareas y dinero', text: 'En cada proyecto' },
  { icon: Globe, title: '9 monedas', text: 'COP, MXN, PEN, USD…' },
  { icon: ShieldCheck, title: '4 roles', text: 'Permisos por módulo' },
]

// Secciones interactivas: se hidratan cuando se acercan a la pantalla (carga más rápida).
const visible = { hydrate: hydrateOnVisible({ rootMargin: '300px' }) }
const BeforeAfter = defineAsyncComponent({ loader: () => import('@/components/landing/BeforeAfter.vue'), ...visible })
const ScrollStory = defineAsyncComponent({ loader: () => import('@/components/landing/ScrollStory.vue'), ...visible })
const FeatureDock = defineAsyncComponent({ loader: () => import('@/components/landing/FeatureDock.vue'), ...visible })
const AudienceTabs = defineAsyncComponent({ loader: () => import('@/components/landing/AudienceTabs.vue'), ...visible })
const LandingReviewsCarousel = defineAsyncComponent({ loader: () => import('@/components/landing/LandingReviewsCarousel.vue'), ...visible })
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
      <!-- 1. HERO -->
      <section class="relative overflow-hidden pb-16 pt-28 lg:pb-24 lg:pt-36" aria-labelledby="hero-heading">
        <div class="landing-hero-bg pointer-events-none absolute inset-0" aria-hidden="true" />
        <div class="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 lg:px-8">
          <div class="min-w-0">
            <p class="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-xs font-semibold text-[#172b4d] shadow-[0_1px_2px_rgba(23,43,77,0.08)] ring-1 ring-[#e4e9f0]">
              <span class="rounded-full bg-[#2a72a8] px-2 py-0.5 text-[11px] font-bold text-white">Nuevo</span>
              Proyectos + finanzas + IA en una sola app
            </p>
            <h1 id="hero-heading" class="mt-6 text-[2.5rem] font-extrabold leading-[1.04] text-[#172b4d] sm:text-[3.25rem] lg:text-[3.6rem]">
              Saca tus proyectos del <span class="ql-mark">Excel</span> y del
              <span class="text-[#2d7eb8]">WhatsApp</span>
            </h1>
            <p class="mt-6 max-w-xl text-lg leading-relaxed text-[#44546f]">
              <strong class="font-semibold text-[#172b4d]">QuinList</strong> es el software de gestión de proyectos que une
              tareas, tableros Kanban, cronograma, presupuesto y a tu equipo en un solo lugar. Sabes qué falta, quién lo tiene
              y cuánto has gastado, sin preguntar.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <RouterLink
                :to="{ path: '/register', query: { plan: 'free' } }"
                class="ql-btn px-6 py-3.5 text-base"
                @click="rememberStartPlan('free')"
              >
                Empieza gratis <ArrowRight :size="17" aria-hidden="true" />
              </RouterLink>
              <a href="#como-funciona" class="ql-btn--ghost px-6 py-3.5 text-base">Mira cómo funciona</a>
            </div>
            <ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#44546f]">
              <li class="inline-flex items-center gap-1.5"><CheckCircle2 :size="16" class="text-emerald-600" aria-hidden="true" /> Sin tarjeta de crédito</li>
              <li class="inline-flex items-center gap-1.5"><CheckCircle2 :size="16" class="text-emerald-600" aria-hidden="true" /> Plan gratis para siempre</li>
            </ul>
          </div>
          <div class="min-w-0 lg:pl-4">
            <HeroAppWindow />
          </div>
        </div>

        <!-- Franja de valor -->
        <div class="relative mx-auto mt-16 max-w-6xl px-5 lg:mt-24 lg:px-8">
          <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <li v-for="p in proof" :key="p.title" class="ql-glass flex items-center gap-3 rounded-2xl p-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5fb] text-[#2a72a8]">
                <component :is="p.icon" :size="19" aria-hidden="true" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-bold text-[#172b4d]">{{ p.title }}</span>
                <span class="block text-xs text-[#5e6c84]">{{ p.text }}</span>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <!-- 2. PROBLEMA: antes / después -->
      <BeforeAfter />

      <!-- 3. HISTORIA CON SCROLL -->
      <ScrollStory />

      <!-- 4. DOCK DE FUNCIONES -->
      <FeatureDock />

      <!-- 5. PARA QUIÉN -->
      <AudienceTabs />

      <!-- 6. TESTIMONIOS -->
      <section id="opiniones" class="overflow-hidden bg-white py-20 lg:py-28" aria-labelledby="testimonials-heading">
        <div class="mx-auto max-w-2xl px-5 text-center lg:px-8">
          <p class="ql-eyebrow">Testimonios</p>
          <h2 id="testimonials-heading" class="mt-3 text-3xl font-bold text-[#172b4d] lg:text-[2.75rem] lg:leading-[1.1]">
            Equipos que ya se ordenaron
          </h2>
        </div>
        <div class="mt-12">
          <LandingReviewsCarousel :reviews="reviews" />
        </div>
      </section>

      <!-- 7. PRECIOS -->
      <section id="planes" class="bg-[#f6f8fb] py-20 lg:py-28" aria-labelledby="planes-heading">
        <div class="mx-auto max-w-6xl px-5 lg:px-8">
          <div class="mx-auto max-w-2xl text-center">
            <p class="ql-eyebrow">Precios</p>
            <h2 id="planes-heading" class="mt-3 text-3xl font-bold text-[#172b4d] lg:text-[2.75rem] lg:leading-[1.1]">
              Empieza gratis. Crece por 15 USD al mes.
            </h2>
            <p class="mt-4 text-[15px] leading-relaxed text-[#44546f] lg:text-lg">
              Sin cotizaciones, sin contratos y sin letra pequeña.
            </p>
          </div>
          <div class="mt-12">
            <PricingCards />
          </div>
        </div>
      </section>

      <!-- 8. FAQ -->
      <MarketingFaq :faqs="landingFaqs" />

      <!-- 9. CTA FINAL -->
      <MarketingCta />
    </main>

    <MarketingFooter />
  </div>
</template>
