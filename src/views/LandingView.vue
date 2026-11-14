<script setup lang="ts">
import { defineAsyncComponent, hydrateOnIdle, hydrateOnVisible } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, CircleDollarSign, Globe, ShieldCheck, Zap } from '@lucide/vue'
import MarketingHeader from '@/components/marketing/MarketingHeader.vue'
import HeroAppWindow from '@/components/landing/HeroAppWindow.vue'
import MktConfetti from '@/components/marketing/MktConfetti.vue'
import { landingFaqs } from '@/seo/marketing'
import { reviewsDataset } from '@/utils/reviews'
import { rememberStartPlan } from '@/lib/startPlan'
import { useReveal } from '@/composables/useReveal'

useReveal()

const reviews = reviewsDataset.reviews.slice(0, 10)

const proof = [
  { icon: Zap, title: 'Listo en 2 minutos', text: 'Sin instalar nada' },
  { icon: CircleDollarSign, title: 'Tareas y dinero', text: 'En cada proyecto' },
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
      <!-- 1. HERO: panel oscuro con confeti (docs/desing.md · Dark Hero Banner) -->
      <section class="relative overflow-hidden bg-[#101214] pb-14 pt-20 text-white lg:pb-20 lg:pt-24" aria-labelledby="hero-heading">
        <MktConfetti side="left" variant="a" />
        <MktConfetti side="right" variant="b" />
        <div class="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-8 sm:px-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-12 lg:px-[104px] 2xl:px-8">
          <div class="min-w-0">
            <h1 id="hero-heading" class="text-[2.6rem] leading-[1.06] text-white sm:text-[3.4rem] lg:text-[4.1rem] xl:text-[4.6rem]">
              Saca tus proyectos del <span class="ql-mark">Excel</span> y del WhatsApp
            </h1>
            <p class="mt-6 max-w-xl text-[17px] leading-relaxed text-white/85">
              QuinList es el software de gestión de proyectos que une tareas, tableros Kanban, cronograma, presupuesto y a tu
              equipo en un solo lugar. Sabes qué falta, quién lo tiene y cuánto has gastado, sin preguntar.
            </p>
            <div class="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <RouterLink
                :to="{ path: '/register', query: { plan: 'free' } }"
                class="ql-btn ql-btn--yellow px-7 py-3.5 text-[17px]"
                @click="rememberStartPlan('free')"
              >
                Empieza gratis
              </RouterLink>
              <a href="#como-funciona" class="inline-flex items-center gap-1.5 text-[16px] font-medium text-white underline-offset-4 hover:underline">
                Mira cómo funciona <ArrowRight :size="17" aria-hidden="true" />
              </a>
            </div>
            <p class="mt-6 text-[14px] text-white/75">Sin tarjeta de crédito · Plan gratis para siempre · Listo en 2 minutos</p>
          </div>
          <div class="min-w-0">
            <div class="ql-shot">
              <div class="ql-shot__tilt"><HeroAppWindow /></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Franja de valor -->
      <section class="border-b border-[#f0f1f2] bg-white" aria-label="Por qué QuinList">
        <ul class="mx-auto grid max-w-[1200px] grid-cols-2 gap-y-8 px-6 py-10 sm:px-10 lg:grid-cols-4 lg:px-8">
          <li v-for="p in proof" :key="p.title" class="flex items-start gap-3 px-2">
            <component :is="p.icon" :size="22" :stroke-width="1.5" class="mt-0.5 shrink-0 text-[#101214]" aria-hidden="true" />
            <span class="min-w-0">
              <span class="ql-display block text-[18px] font-semibold text-[#101214]">{{ p.title }}</span>
              <span class="block text-[14px] text-[#42526e]">{{ p.text }}</span>
            </span>
          </li>
        </ul>
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
      <section id="opiniones" class="overflow-hidden bg-white py-20 lg:py-24" aria-labelledby="testimonials-heading">
        <div class="mx-auto max-w-2xl px-5 text-center lg:px-8">
          <p class="ql-eyebrow">Testimonios</p>
          <h2 id="testimonials-heading" class="mt-3 text-[2rem] leading-[1.15] text-[#101214] lg:text-[3rem] lg:leading-[1.14]">
            Equipos que ya se ordenaron
          </h2>
        </div>
        <div class="mt-12">
          <LandingReviewsCarousel :reviews="reviews" />
        </div>
      </section>

      <!-- 7. PRECIOS -->
      <section id="planes" class="bg-[#f0f1f2] py-20 lg:py-24" aria-labelledby="planes-heading">
        <div class="mx-auto max-w-[1200px] px-5 lg:px-8">
          <div class="mx-auto max-w-2xl text-center">
            <p class="ql-eyebrow">Precios</p>
            <h2 id="planes-heading" class="mt-3 text-[2rem] leading-[1.15] text-[#101214] lg:text-[3rem] lg:leading-[1.14]">
              Empieza gratis. Crece por 7 USD al mes.
            </h2>
            <p class="mt-4 text-[15px] leading-relaxed text-[#42526e] lg:text-lg">
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
