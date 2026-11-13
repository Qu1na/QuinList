import { onMounted, onUnmounted } from 'vue'

/**
 * Animación de entrada para `.landing-reveal`. Solo oculta lo que está debajo del
 * primer pantallazo, así el contenido prerenderizado nunca parpadea ni queda invisible.
 */
export function useReveal() {
  let io: IntersectionObserver | null = null

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove('reveal-pending')
            io?.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    // Espera al siguiente frame (tras la hidratación) y separa lecturas de escrituras
    // para no forzar un recálculo de layout por cada elemento.
    requestAnimationFrame(() => {
      const fold = window.innerHeight
      const below = Array.from(document.querySelectorAll('.landing-reveal')).filter(
        (node) => node.getBoundingClientRect().top >= fold,
      )
      below.forEach((node) => {
        node.classList.add('reveal-pending')
        io?.observe(node)
      })
    })
  })

  onUnmounted(() => io?.disconnect())
}
