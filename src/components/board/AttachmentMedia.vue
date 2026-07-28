<script setup lang="ts">
import { computed } from 'vue'
import { Paperclip } from '@lucide/vue'
import type { Attachment } from '@/types'
import { getAttachmentPublicUrl, openAttachment, downloadAttachment } from '@/services/storage'

const props = withDefaults(
  defineProps<{
    attachment: Attachment
    imageClass?: string
    linkClass?: string
    asButton?: boolean
    previewOnly?: boolean
  }>(),
  {
    imageClass: 'h-20 w-28 rounded-md object-cover ring-1 ring-[#091e4221]',
    linkClass:
      'flex max-w-[140px] items-center gap-1.5 rounded-md bg-[#091e420f] px-3 py-2 text-xs text-[#172b4d] hover:bg-[#091e4221]',
    asButton: false,
    previewOnly: false,
  },
)

const publicUrl = computed(() => getAttachmentPublicUrl(props.attachment))

async function handleOpen() {
  await openAttachment(props.attachment)
}

async function handleDownload(e: Event) {
  e.preventDefault()
  await downloadAttachment(props.attachment)
}
</script>

<template>
  <div class="relative">
    <img
      v-if="attachment.type.startsWith('image/') && previewOnly"
      :src="publicUrl"
      :alt="attachment.name"
      :class="imageClass"
    />

    <button
      v-else-if="attachment.type.startsWith('image/')"
      type="button"
      class="block overflow-hidden p-0"
      @click="handleOpen"
    >
      <img :src="publicUrl" :alt="attachment.name" :class="imageClass" />
    </button>

    <button
      v-else-if="asButton"
      type="button"
      :class="linkClass"
      @click="handleOpen"
    >
      <Paperclip :size="12" />
      <span class="truncate">{{ attachment.name }}</span>
    </button>

    <a
      v-else
      :href="publicUrl"
      :class="linkClass"
      target="_blank"
      rel="noopener noreferrer"
      @click.prevent="handleDownload"
    >
      <Paperclip :size="12" />
      <span class="truncate">{{ attachment.name }}</span>
    </a>
  </div>
</template>
