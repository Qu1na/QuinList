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
    <div class="mx-auto grid max-w-[1200px] gap-10 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
      <!-- Columna de contexto -->
      <div class="lg:sticky lg:top-28 lg:self-start">
        <p class="ql-eyebrow">Preguntas frecuentes</p>
        <h2 id="faq-heading" class="mt-3 text-[2rem] leading-[1.15] text-[#101214] lg:text-[2.75rem] lg:leading-[1.14]">{{ title }}</h2>
        <p class="mt-4 max-w-md text-[15px] leading-relaxed text-[#42526e]">
          Respuestas cortas y claras. Si te queda alguna duda, te respondemos personalmente.
        </p>

        <div class="mt-8 flex items-start gap-4 rounded-[20px] border border-[#dfe1e6] bg-[#f7f8fa] p-6 text-[#101214]">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#dfe1e6] bg-white text-[#101214]">
            <MessageCircleQuestion :size="20" :stroke-width="1.5" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="font-semibold">¿Hablamos?</p>
            <p class="mt-1 text-[14px] text-[#292a2e]">Escríbenos y te mostramos QuinList con tus propios proyectos.</p>
            <a
              href="mailto:contacto@matubyte.com"
              class="ql-btn mt-4 px-4 py-2 text-[14px]"
            >
              <Mail :size="15" aria-hidden="true" /> contacto@matubyte.com
            </a>
          </div>
        </div>
      </div>

      <!-- Lista agrupada estilo iOS -->
      <div class="ql-grouped self-start">
        <div v-for="(f, i) in faqs" :key="f.q">
          <h3>
            <button
              type="button"
              class="group flex w-full items-center gap-4 py-5 text-left"
              :aria-expanded="open === i"
              :aria-controls="`${idPrefix}-panel-${i}`"
              @click="open = open === i ? null : i"
            >
              <span class="ql-display flex-1 text-[18px] font-medium leading-snug text-[#101214] group-hover:text-[#1868db] lg:text-[20px]">{{ f.q }}</span>
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                :class="open === i ? 'rotate-180 bg-[#101214] text-white' : 'bg-[#f0f1f2] text-[#101214]'"
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
              <p class="max-w-2xl pb-6 pr-12 text-[16px] leading-relaxed text-[#292a2e]">{{ f.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
