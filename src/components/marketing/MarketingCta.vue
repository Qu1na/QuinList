<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Mail } from '@lucide/vue'
import { rememberStartPlan } from '@/lib/startPlan'
import { PRODUCT } from '@/seo/marketing'
import { track } from '@/lib/analytics'

withDefaults(defineProps<{ text?: string }>(), {
  text: 'Crea tu cuenta gratis, arma tu primer proyecto e invita a tu equipo. Si te convence, pasas a VIP por 7 USD al mes.',
})

const demoHref = `mailto:${PRODUCT.email}?subject=${encodeURIComponent('Quiero una demostración de QuinList')}`
</script>

<template>
  <!-- Banda lavanda (docs/desing.md · Lavender Feature Band): sin tarjetas, el texto flota sobre el tinte -->
  <section id="contacto" class="bg-[#eed7fc] py-20 lg:py-24" aria-labelledby="cta-heading">
    <div class="mx-auto max-w-[760px] px-6 text-center">
      <h2 id="cta-heading" class="text-[2.2rem] leading-[1.12] text-[#101214] sm:text-[3rem]">
        Saca tus proyectos del <span class="ql-mark">Excel</span> hoy
      </h2>
      <p class="mx-auto mt-5 max-w-[600px] text-[17px] leading-relaxed text-[#101214]">{{ text }}</p>
      <div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <RouterLink
          :to="{ path: '/register', query: { plan: 'free' } }"
          class="ql-btn px-7 py-3.5 text-[17px]"
          @click="rememberStartPlan('free')"
        >
          Crear cuenta gratis
        </RouterLink>
        <a :href="demoHref" class="ql-btn--ghost px-7 py-3.5 text-[17px]" @click="track('generate_lead', { method: 'demo_email' })">
          <Mail :size="17" aria-hidden="true" /> Pedir una demo
        </a>
      </div>
      <p class="mt-6 text-[14px] text-[#292a2e]">Sin tarjeta de crédito · Plan gratis para siempre · Cancela cuando quieras</p>
    </div>
  </section>
</template>
