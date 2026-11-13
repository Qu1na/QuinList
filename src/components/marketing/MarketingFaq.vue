<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, Mail, MessageCircleQuestion } from '@lucide/vue'
import type { MarketingFaq } from '@/seo/marketing'

const props = withDefaults(defineProps<{ faqs: MarketingFaq[]; title?: string; idPrefix?: string }>(), {
  title: 'Resolvemos tus dudas',
  idPrefix: 'faq',
})

const open = ref<number | null>(0)
void props
</script>

<template>
  <section id="faq" class="bg-white py-20 lg:py-28" aria-labelledby="faq-heading">
    <div class="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
      <!-- Columna de contexto -->
      <div class="lg:sticky lg:top-28 lg:self-start">
        <p class="ql-eyebrow">Preguntas frecuentes</p>
        <h2 id="faq-heading" class="mt-3 text-3xl font-bold text-[#172b4d] lg:text-[2.6rem] lg:leading-[1.1]">{{ title }}</h2>
        <p class="mt-4 max-w-md text-[15px] leading-relaxed text-[#44546f]">
          Respuestas cortas y claras. Si te queda alguna duda, te respondemos personalmente.
        </p>

        <div class="mt-8 flex items-start gap-4 rounded-2xl bg-[#2a72a8] p-5 text-white">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <MessageCircleQuestion :size="22" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="font-semibold">¿Hablamos?</p>
            <p class="mt-1 text-sm text-white">Escríbenos y te mostramos QuinList con tus propios proyectos.</p>
            <a
              href="mailto:contacto@matubyte.com"
              class="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#215d8a] hover:bg-[#eef5fb]"
            >
              <Mail :size="15" aria-hidden="true" /> contacto@matubyte.com
            </a>
          </div>
        </div>
      </div>

      <!-- Lista agrupada estilo iOS -->
      <div class="ql-grouped self-start shadow-[0_12px_32px_-24px_rgba(23,43,77,0.4)]">
        <div v-for="(f, i) in faqs" :key="f.q">
          <h3>
            <button
              type="button"
              class="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f6f8fb] lg:px-6 lg:py-5"
              :aria-expanded="open === i"
              :aria-controls="`${idPrefix}-panel-${i}`"
              @click="open = open === i ? null : i"
            >
              <span class="flex-1 text-[15px] font-semibold leading-snug text-[#172b4d] lg:text-base">{{ f.q }}</span>
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                :class="open === i ? 'rotate-180 bg-[#2a72a8] text-white' : 'bg-[#eef5fb] text-[#2a72a8]'"
                aria-hidden="true"
              >
                <ChevronDown :size="16" />
              </span>
            </button>
          </h3>
          <!-- La respuesta siempre está en el HTML (Google y las IA la leen); solo se oculta visualmente. -->
          <div
            :id="`${idPrefix}-panel-${i}`"
            class="grid transition-[grid-template-rows] duration-300 ease-out"
            :class="open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
          >
            <div class="overflow-hidden">
              <p class="px-5 pb-5 text-[15px] leading-relaxed text-[#44546f] lg:px-6">{{ f.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
