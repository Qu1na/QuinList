import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const NEAR_BOTTOM_PX = 80

export function useChatScroll(messagesEl: () => HTMLElement | null | undefined) {
  const isNearBottom = ref(true)
  const newMessagesBelow = ref(0)

  function checkNearBottom() {
    const el = messagesEl()
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
  }

  function onScroll() {
    isNearBottom.value = checkNearBottom()
    if (isNearBottom.value) newMessagesBelow.value = 0
  }

  async function scrollToBottom(smooth = false) {
    await nextTick()
    const el = messagesEl()
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    isNearBottom.value = true
    newMessagesBelow.value = 0
  }

  function onNewMessage(isOwn: boolean) {
    if (isNearBottom.value || isOwn) {
      void scrollToBottom(!isOwn)
    } else {
      newMessagesBelow.value += 1
    }
  }

  function bindScroll() {
    const el = messagesEl()
    el?.addEventListener('scroll', onScroll, { passive: true })
    return () => el?.removeEventListener('scroll', onScroll)
  }

  let unbind: (() => void) | null = null

  onMounted(() => {
    unbind = bindScroll()
  })

  onUnmounted(() => {
    unbind?.()
  })

  return {
    isNearBottom,
    newMessagesBelow,
    scrollToBottom,
    onNewMessage,
    rebindScroll: () => {
      unbind?.()
      unbind = bindScroll()
    },
  }
}
