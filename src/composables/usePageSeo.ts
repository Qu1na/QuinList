import { onMounted, onUnmounted, watch, type WatchStopHandle } from 'vue'
import { applySeo, type ApplySeoInput } from '@/seo/applySeo'
import { DEFAULT_TITLE } from '@/seo/config'

export type SeoOptions = ApplySeoInput

/**
 * SEO reactivo por vista. Si la ruta ya aplica SEO global vía router,
 * úsalo para enriquecer (p. ej. FAQ + reviews en landing).
 */
export function usePageSeo(options: SeoOptions | (() => SeoOptions), restoreOnUnmount = false) {
  let stop: WatchStopHandle | undefined

  const resolve = () => (typeof options === 'function' ? options() : options)

  onMounted(() => {
    applySeo(resolve())
    if (typeof options === 'function') {
      stop = watch(options, (next) => applySeo(next), { deep: true })
    }
  })

  onUnmounted(() => {
    stop?.()
    if (restoreOnUnmount) {
      document.title = DEFAULT_TITLE
    }
  })
}

export { SITE_URL } from '@/seo/config'
