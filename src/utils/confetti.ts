interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  color: string
  rotation: number
  rotationSpeed: number
  life: number
  shape: 'rect' | 'circle'
}

const COLORS = ['#4bce97', '#61bd4f', '#f5cd47', '#ff9f1a', '#5dade2', '#bb8fce', '#ff6b9d', '#00c2e0']

function createParticles(x: number, y: number, count: number, spread: number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * spread + spread * 0.4
    const size = Math.random() * 5 + 4

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (Math.random() * 4 + 2),
      w: size,
      h: Math.random() > 0.5 ? size * 0.45 : size * 0.7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 16,
      life: 1,
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
    }
  })
}

/** Ráfaga de confeti desde un punto (p. ej. al completar una tarjeta). */
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

  const particles = [
    ...createParticles(x, y, 36, 7),
    ...createParticles(x, y - 8, 18, 5),
  ]

  let frame = 0

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false

    for (const p of particles) {
      if (p.life <= 0) continue
      alive = true
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.985
      p.vy += 0.22
      p.life -= 0.018
      p.rotation += p.rotationSpeed

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = Math.max(p.life, 0)
      ctx.fillStyle = p.color

      if (p.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      }

      ctx.restore()
    }

    frame++
    if (alive && frame < 70) {
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
