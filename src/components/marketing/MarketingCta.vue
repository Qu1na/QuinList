<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, Check, Mail } from '@lucide/vue'
import { rememberStartPlan } from '@/lib/startPlan'
import { PRODUCT } from '@/seo/marketing'
import { track } from '@/lib/analytics'

withDefaults(defineProps<{ title?: string; text?: string }>(), {
  title: 'Saca tus proyectos del Excel hoy',
  text: 'Crea tu cuenta gratis, arma tu primer proyecto e invita a tu equipo. Si te convence, pasas a VIP por 15 USD al mes.',
})

const demoHref = `mailto:${PRODUCT.email}?subject=${encodeURIComponent('Quiero una demostración de QuinList')}`
const perks = ['Sin tarjeta de crédito', 'Plan gratis para siempre', 'Cancela cuando quieras']
</script>

<template>
  <section id="contacto" class="py-16 lg:py-24" aria-labelledby="cta-heading">
    <div class="mx-auto max-w-6xl px-5 lg:px-8">
      <div class="relative overflow-hidden rounded-[1.75rem] bg-[#2a72a8] px-6 py-12 text-white sm:px-10 lg:grid lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10 lg:px-14 lg:py-16">
        <!-- Textura de puntos (color sólido, sin degradado) -->
        <div
          class="pointer-events-none absolute inset-0 opacity-25"
          aria-hidden="true"
          style="background-image: radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px); background-size: 20px 20px"
        />
        <div class="relative">
          <p class="ql-eyebrow ql-eyebrow--light">Empieza hoy</p>
          <h2 id="cta-heading" class="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">{{ title }}</h2>
          <p class="mt-4 max-w-xl text-[15px] leading-relaxed text-white lg:text-base">{{ text }}</p>
          <ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-white/95">
            <li v-for="p in perks" :key="p" class="inline-flex items-center gap-1.5">
              <span class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20"><Check :size="12" aria-hidden="true" /></span>
              {{ p }}
            </li>
          </ul>
        </div>

        <div class="relative mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col lg:items-stretch">
          <RouterLink
            :to="{ path: '/register', query: { plan: 'free' } }"
            class="ql-btn ql-btn--light py-3.5 text-base"
            @click="rememberStartPlan('free')"
          >
            Crear cuenta gratis <ArrowRight :size="17" aria-hidden="true" />
          </RouterLink>
          <a
            :href="demoHref"
            class="ql-btn ql-btn--outline-light py-3.5 text-base"
            @click="track('generate_lead', { method: 'demo_email' })"
          >
            <Mail :size="17" aria-hidden="true" /> Pedir una demo
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
