interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  life: number
}

const COLORS = ['#4bce97', '#61bd4f', '#f5cd47', '#ff9f1a', '#5dade2', '#bb8fce']

/** Pequeña ráfaga de confeti desde un punto (p. ej. al completar una tarjeta). */
export function burstConfetti(x: number, y: number): void {
  const canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  })
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const particles: Particle[] = Array.from({ length: 12 }, () => ({
    x,
    y,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * -5 - 1.5,
    size: Math.random() * 3 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 12,
    life: 1,
  }))

  let frame = 0

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false

    for (const p of particles) {
      if (p.life <= 0) continue
      alive = true
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.18
      p.life -= 0.035
      p.rotation += p.rotationSpeed

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = Math.max(p.life, 0)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      ctx.restore()
    }

    frame++
    if (alive && frame < 35) {
      requestAnimationFrame(animate)
    } else {
      canvas.remove()
    }
  }

  requestAnimationFrame(animate)
}

export function burstConfettiFromElement(el: HTMLElement): void {
  const rect = el.getBoundingClientRect()
  burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2)
}
