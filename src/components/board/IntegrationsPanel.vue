<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ExternalLink, Download, Copy, Check } from '@lucide/vue'
import AppWindowPanel from '@/components/ui/AppWindowPanel.vue'
import { useQuinListStore } from '@/stores/quinlist'
import { useIntegrationsStore } from '@/stores/integrations'
import { INTEGRATION_META } from '@/utils/integrations'
import type { IntegrationType } from '@/utils/integrations'
import { exportBoardToIcs } from '@/utils/calendar'

const store = useQuinListStore()
const integrations = useIntegrationsStore()

const copied = ref(false)
const slackUrl = ref('')
const webhookUrl = ref('')
const githubRepo = ref('')

const board = computed(() =>
  store.boards.find((b) => b.id === integrations.panelBoardId),
)

watch(
  () => integrations.panelBoardId,
  (id) => {
    if (!id) return
    slackUrl.value = integrations.getConfig(id, 'slack').url ?? ''
    webhookUrl.value = integrations.getConfig(id, 'webhook').url ?? ''
    githubRepo.value = integrations.getConfig(id, 'github').repo ?? ''
  },
  { immediate: true },
)

function toggle(type: IntegrationType) {
  if (!board.value) return
  const current = integrations.isEnabled(board.value.id, type)
  integrations.toggleIntegration(board.value.id, type, !current)
}

function saveSlack() {
  if (!board.value) return
  integrations.setConfig(board.value.id, 'slack', { url: slackUrl.value })
  integrations.toggleIntegration(board.value.id, 'slack', !!slackUrl.value)
}

function saveWebhook() {
  if (!board.value) return
  integrations.setConfig(board.value.id, 'webhook', { url: webhookUrl.value })
  integrations.toggleIntegration(board.value.id, 'webhook', !!webhookUrl.value)
}

function saveGithub() {
  if (!board.value) return
  integrations.setConfig(board.value.id, 'github', { repo: githubRepo.value })
  integrations.toggleIntegration(board.value.id, 'github', !!githubRepo.value)
}

function exportIcs() {
  if (!board.value) return
  const cards = store.getBoardCards(board.value.id)
  exportBoardToIcs(cards, board.value.title)
}

function copyBoardLink() {
  const url = `${window.location.origin}/app/board/${board.value?.id}`
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

const integrationTypes: IntegrationType[] = ['google_calendar', 'github', 'ics_export']
</script>

<template>
  <Teleport to="body">
    <div
      v-if="integrations.showPanel && board"
      class="app-window-overlay fixed inset-0 z-[2000] flex justify-end"
      @click.self="integrations.closePanel()"
    >
      <AppWindowPanel
        title="Power-Ups"
        :subtitle="board.title"
        max-width="md"
        @close="integrations.closePanel()"
      >
        <div class="space-y-4">
          <div
            v-for="type in integrationTypes"
            :key="type"
            class="rounded-xl border border-[#091e4221] p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex gap-3">
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                  :style="{ background: INTEGRATION_META[type].color + '20' }"
                >
                  {{ INTEGRATION_META[type].icon }}
                </span>
                <div>
                  <h3 class="font-semibold text-slate-800">{{ INTEGRATION_META[type].name }}</h3>
                  <p class="mt-0.5 text-xs text-slate-500">
                    {{ INTEGRATION_META[type].description }}
                  </p>
                </div>
              </div>
              <button
                class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                :class="integrations.isEnabled(board.id, type) ? 'bg-blue-600' : 'bg-slate-200'"
                @click="toggle(type)"
              >
                <span
                  class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                  :class="integrations.isEnabled(board.id, type) ? 'left-5' : 'left-0.5'"
                />
              </button>
            </div>

            <div v-if="type === 'slack' && integrations.isEnabled(board.id, 'slack')" class="mt-3">
              <input
                v-model="slackUrl"
                placeholder="https://hooks.slack.com/services/..."
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
              <button
                class="mt-2 text-sm font-medium text-blue-600 hover:underline"
                @click="saveSlack"
              >
                Guardar webhook
              </button>
            </div>

            <div
              v-if="type === 'webhook' && integrations.isEnabled(board.id, 'webhook')"
              class="mt-3"
            >
              <input
                v-model="webhookUrl"
                placeholder="https://hooks.zapier.com/..."
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
              <button
                class="mt-2 text-sm font-medium text-blue-600 hover:underline"
                @click="saveWebhook"
              >
                Guardar URL
              </button>
            </div>

            <div
              v-if="type === 'github' && integrations.isEnabled(board.id, 'github')"
              class="mt-3"
            >
              <input
                v-model="githubRepo"
                placeholder="usuario/repositorio"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
              <a
                v-if="githubRepo"
                :href="`https://github.com/${githubRepo}`"
                target="_blank"
                rel="noopener"
                class="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink :size="14" />
                Abrir repositorio
              </a>
              <button
                class="mt-2 block text-sm font-medium text-blue-600 hover:underline"
                @click="saveGithub"
              >
                Guardar
              </button>
            </div>

            <div
              v-if="type === 'ics_export' && integrations.isEnabled(board.id, 'ics_export')"
              class="mt-3"
            >
              <button
                class="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                @click="exportIcs"
              >
                <Download :size="14" />
                Exportar calendario .ics
              </button>
            </div>

            <div
              v-if="type === 'google_calendar' && integrations.isEnabled(board.id, 'google_calendar')"
              class="mt-3 text-xs text-slate-500"
            >
              Las tarjetas con fecha límite mostrarán enlace a Google Calendar en el detalle de la
              tarjeta y en la vista Calendario.
            </div>
          </div>

          <div class="rounded-xl border border-[#091e4221] p-4">
            <h3 class="font-semibold text-[#172b4d]">Compartir tablero</h3>
            <button
              type="button"
              class="mt-2 flex items-center gap-2 text-sm text-[#2d7eb8] hover:underline"
              @click="copyBoardLink"
            >
              <Check v-if="copied" :size="14" />
              <Copy v-else :size="14" />
              {{ copied ? '¡Copiado!' : 'Copiar enlace del tablero' }}
            </button>
          </div>
        </div>
      </AppWindowPanel>
    </div>
  </Teleport>
</template>
