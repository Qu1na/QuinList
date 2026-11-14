<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Cpu, LayoutGrid, FolderKanban } from '@lucide/vue'
import { useBillingStore } from '@/stores/billing'
import AppWindow from '@/components/ui/AppWindow.vue'

const billing = useBillingStore()
const router = useRouter()

const copy = computed(() => {
  if (billing.upgradeKind === 'project') {
    return {
      title: 'Límite del plan Gratis',
      body: 'El plan Gratis incluye un solo proyecto. VIP permite proyectos ilimitados y el asistente de IA.',
    }
  }
  if (billing.upgradeKind === 'ai') {
    return {
      title: 'IA incluida en VIP',
      body: 'El asistente de QuinList está disponible en el plan VIP, junto con tableros y proyectos ilimitados.',
    }
  }
  return {
    title: 'Límite del plan Gratis',
    body: 'El plan Gratis incluye un solo tablero. VIP permite tableros ilimitados y el asistente de IA.',
  }
})

function goToPlans() {
  billing.closeUpgrade()
  void router.push({ name: 'plans' })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="billing.upgradeOpen"
      class="app-window-overlay fixed inset-0 z-[2100] flex items-center justify-center p-4"
      @click.self="billing.closeUpgrade()"
    >
      <AppWindow :title="copy.title" subtitle="Planes QuinList" class="app-window--md" @close="billing.closeUpgrade()">
        <p class="text-sm leading-relaxed text-[#44546f]">{{ copy.body }}</p>
        <ul class="mt-4 space-y-2 text-sm text-[#172b4d]">
          <li class="flex items-center gap-2">
            <LayoutGrid :size="16" class="text-[#0c66e4]" />
            Tableros ilimitados
          </li>
          <li class="flex items-center gap-2">
            <FolderKanban :size="16" class="text-[#0c66e4]" />
            Proyectos ilimitados
          </li>
          <li class="flex items-center gap-2">
            <Cpu :size="16" class="text-[#6554c0]" />
            Asistente de IA
          </li>
        </ul>
        <template #footer>
          <div class="app-window-footer-actions">
            <button type="button" class="btn-brand-ghost" @click="billing.closeUpgrade()">Ahora no</button>
            <button type="button" class="btn-brand" @click="goToPlans">Ver plan VIP</button>
          </div>
        </template>
      </AppWindow>
    </div>
  </Teleport>
</template>
