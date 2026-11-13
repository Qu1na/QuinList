# Auditoría SEO de QuinList — antes y después

Fecha: 13 de noviembre de 2026 · Sitio: https://quinlist.matubyte.com

> La puntuación usa una rúbrica propia de 100 puntos basada en lo que piden Google Search Central,
> Bing Webmaster y los rastreadores de IA. No es una métrica oficial de Google: el posicionamiento real
> depende además del tiempo, la autoridad del dominio y los enlaces externos.

## Resultado

### Google Lighthouse (medición oficial de Google, móvil)

Medido en local con el mismo servidor de producción, el 13 de noviembre de 2026.

| Página | SEO | Accesibilidad | Buenas prácticas | Rendimiento |
| --- | ---: | ---: | ---: | ---: |
| `/` (inicio) | **100** | **100** | **100** | 76–91 * |
| `/precios` | **100** | **100** | 96 ** | **100** |
| `/guias` | **100** | **100** | **100** | 99 |
| `/guias/que-es-la-metodologia-kanban` | **100** | **100** | **100** | **100** |
| `/software-gestion-de-proyectos/mexico` | **100** | **100** | **100** | 96 |
| `/alternativa-a-excel-para-proyectos` | **100** | **100** | **100** | **100** |
| `/gestion-de-proyectos-de-construccion` | **100** | **100** | **100** | 93 |
| `/tablero-kanban-online` | **100** | **100** | **100** | 86 |

Antes: SEO 100 pero con contenido vacío para los rastreadores, accesibilidad 93–96 y rendimiento 59–68.

\* La página de inicio es la más larga. En las pruebas varió entre 76 y 91 según la carga del equipo.
Las métricas reales de Google (Core Web Vitals) están en verde: **LCP 1,1 s** (antes 5,0 s) y
**CLS 0,001**. Confírmalo después del despliegue en https://pagespeed.web.dev.
\** El único aviso es `/api/billing/offer`, que en local no existe. En producción depende de que nginx
envíe `/api/` al servidor de cobros (ver `deploy/nginx-quinlist.matubyte.com.conf`).

### Rúbrica completa (técnico + contenido + autoridad)

> Rúbrica propia de 100 puntos basada en Google Search Central, Bing Webmaster y los rastreadores de
> IA. No es una métrica oficial: el posicionamiento real depende además del tiempo y de la autoridad.

| Área | Peso | Inicio | V1 | Ahora |
| --- | ---: | ---: | ---: | ---: |
| Contenido visible sin JavaScript (prerender + hidratación) | 15 | 1 | 14 | 15 |
| Títulos, descripciones, Open Graph | 10 | 7 | 10 | 10 |
| Datos estructurados (schema.org) | 10 | 4 | 9 | 10 |
| Sitemap, robots.txt, 404 reales | 10 | 5 | 10 | 10 |
| Contenido por intención de búsqueda | 15 | 1 | 12 | 14 |
| SEO internacional Latinoamérica | 10 | 1 | 8 | 9 |
| Enlazado interno | 5 | 2 | 5 | 5 |
| Visibilidad en IA (ChatGPT, Claude, Gemini, Perplexity) | 10 | 0 | 9 | 10 |
| Embudo de conversión y medición | 10 | 4 | 8 | 9 |
| Autoridad externa (enlaces, perfiles, reseñas reales) | 5 | 1 | 1 | 1 |
| **Total** | **100** | **26** | **86** | **93** |

**Lo que el código podía dar está al máximo.** Los 7 puntos que faltan no se resuelven programando:

- **Autoridad (4 puntos):** enlaces de otros sitios, perfiles en Capterra/G2/Product Hunt y reseñas
  reales verificables. Solo llegan con tiempo y gestión (ver `GUIA-INDEXACION.md`).
- **Contenido (1 punto):** publicar 1 o 2 guías nuevas al mes con `PROMPT-MAESTRO-SEO.md`.
- **Latinoamérica (1 punto):** enlaces y menciones desde sitios de cada país.
- **Conversión (1 punto):** poner tu ID de Google Analytics 4 en `.env` (`VITE_GA_MEASUREMENT_ID`) y
  reemplazar los testimonios de ejemplo por clientes reales.

Nadie puede garantizar el primer lugar en Google: eso depende de la competencia y de la autoridad
que el dominio gane con el tiempo.

## Cambios de la segunda ronda

- **Posicionamiento:** se quitó “en español” de títulos, H1, Open Graph y textos principales. Sonaba a
  producto traducido y limitaba. Ahora la promesa es **“software de gestión de proyectos (y finanzas)
  para empresas”**, y el idioma queda solo como dato en las preguntas frecuentes.
- **Hidratación SSR:** Vue reutiliza el HTML prerenderizado en vez de borrarlo y repintarlo
  (LCP de 5,0 s a 1,1 s).
- **MatuDB no se carga en las páginas públicas** si el visitante no tiene sesión guardada
  (`src/lib/sessionHint.ts`). Login, registro y la app funcionan igual que antes.
- **Bloques de JavaScript separados correctamente:** la landing ya no descarga `vuedraggable`
  (la regla de `vite.config.ts` agrupaba todo lo que contenía la palabra “vue”).
- Hidratación diferida de testimonios, precios, CTA y pie de página; `content-visibility` en las
  secciones de abajo; estrellas como texto (100 SVG menos); logo de 216 KB → 9 KB (WebP).
- **Contraste WCAG AA:** textos coral `#c2410c`, grises `#666`.
- Se quitó la etiqueta **“Reseña verificada”** del carrusel (no lo eran) y se dejaron 10 testimonios.
- **7 páginas nuevas:** `/gestion-de-proyectos-de-software`, `/gestion-de-proyectos-para-equipos-remotos`,
  `/guias` (índice), `/guias/que-es-la-metodologia-kanban`,
  `/guias/como-calcular-la-rentabilidad-de-un-proyecto`, `/guias/matriz-de-riesgos-de-un-proyecto`,
  `/guias/que-son-los-okr`. Total: **33 páginas prerenderizadas, 34 URLs en el sitemap.**
- **Google Analytics 4 opcional** (`src/lib/analytics.ts`): `page_view`, `begin_sign_up` (clic en
  cualquier botón de registro, con el plan) y `generate_lead` (clic en “Pedir una demo”). Se carga cuando
  el navegador está libre para no afectar la velocidad.

## Qué estaba mal (antes)

1. **SPA vacía.** El servidor entregaba `<div id="app"></div>`. Google renderiza JavaScript en una segunda
   cola (días o semanas de retraso) y **GPTBot, ClaudeBot y PerplexityBot no ejecutan JavaScript**: para
   ellos QuinList no tenía contenido.
2. **Solo 5 URLs** indexables, y ninguna apuntaba a una búsqueda real (“software de gestión de proyectos
   México”, “alternativa a Excel”, “diagrama de Gantt online”…).
3. **Soft 404.** Cualquier URL inventada (`/precios`, `/loquesea`) respondía 200 con la landing. Google lo
   marca como contenido duplicado.
4. **Reseñas autogeneradas en schema.org** (`AggregateRating` 4.9 con reseñas escritas por el propio sitio).
   Google lo considera *self-serving reviews* y puede aplicar una **acción manual**.
5. **Orientado a España:** `og:locale=es_ES`, sin `hreflang=es-419`, sin páginas por país.
6. **Imagen social cuadrada (512×512)**: WhatsApp, LinkedIn y Facebook la recortaban.
7. **Sin `llms.txt`** ni reglas explícitas para los bots de IA.
8. Landing centrada en funciones, sin dolor del cliente, sin antes/después y con CTA “Comenzar con VIP”
   antes de explicar el valor.

## Qué se implementó (después)

### Técnico
- **Prerender con Vue SSR en el build** (`src/prerender/entry-server.ts` + `scripts/prerender.mjs`):
  cada página pública se publica como HTML estático con su contenido, `<head>` y JSON-LD. El navegador
  monta la app encima sin parpadeo.
- **`serve.json`**: archivos estáticos primero, la app privada (`/app`, `/login`, `/join`…) va a un
  `app-shell.html` con `noindex`, y las URLs inexistentes devuelven **404 real** (`404.html`).
- `trailingSlash: false` (301 de `/precios/` a `/precios`) y `directoryListing: false`.
- `canonical`, `hreflang="es-419"` y `x-default` en cada página indexable; sin canonical en páginas noindex.
- Animaciones de entrada que **nunca ocultan contenido** sobre el primer pantallazo (antes todo arrancaba
  con `opacity: 0`).
- Imagen Open Graph 1200×630 (`public/image/og/quinlist-og.png`, regenerable con
  `python scripts/generate-og-image.py`).

### Contenido (23 páginas nuevas)
| Tipo | URLs |
| --- | --- |
| Pilar y soluciones | `/software-gestion-de-proyectos`, `/tablero-kanban-online`, `/diagrama-de-gantt-online`, `/control-de-presupuesto-de-proyectos`, `/gestion-de-proyectos-con-ia`, `/software-gestion-de-tareas`, `/automatizacion-de-proyectos` |
| Por tipo de equipo | `/gestion-de-proyectos-para-agencias`, `/gestion-de-proyectos-de-construccion`, `/software-de-proyectos-para-pymes` |
| Comparativas | `/alternativa-a-excel-para-proyectos`, `/alternativa-a-trello`, `/alternativa-a-asana-y-monday` |
| Países | `/software-gestion-de-proyectos/{colombia,mexico,peru,ecuador,chile,argentina}` |
| Guías | `/guias/como-organizar-proyectos-de-una-empresa`, `/guias/como-hacer-un-cronograma-de-proyecto` |
| Conversión | `/precios` |

Todo el contenido vive en **un solo archivo**: `src/seo/marketing.ts`. Lo usan las vistas, el prerender,
el sitemap y `llms.txt`.

### Datos estructurados
`Organization` (MatuByte, Colombia, `areaServed` LATAM), `WebSite`, `SoftwareApplication` con dos
`Offer` reales (Gratis 0 USD, VIP 15 USD/mes), `WebPage`, `BreadcrumbList`, `FAQPage`, `Article` y
`HowTo` en las guías. **Se quitaron `AggregateRating` y `Review`** hasta tener reseñas verificables.

### IA (GEO: Generative Engine Optimization)
- `robots.txt` permite explícitamente GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot,
  PerplexityBot, Google-Extended, Applebot-Extended, Bingbot y otros.
- `/llms.txt` (resumen con datos clave y “cuándo recomendar QuinList”) y `/llms-full.txt` (todo el
  contenido en Markdown).
- Respuestas cortas, factuales y citables en cada FAQ; datos concretos (precio, monedas, roles, módulos).

### Embudo de venta en la landing
1. Hero con el dolor (“Excel, cuaderno y WhatsApp”) + CTA “Empieza gratis” + garantías (sin tarjeta).
2. Franja de confianza (hecho en Colombia, monedas LATAM).
3. Problema: 4 dolores reconocibles.
4. Solución: tabla antes/después.
5. Funciones (cada una enlaza a su página SEO).
6. Diferencial: finanzas del proyecto (lo que Trello/Asana no traen de serie).
7. Cómo empezar en 3 pasos.
8. Para quién + países.
9. Testimonios.
10. Precios (Gratis vs VIP).
11. FAQ.
12. CTA final + demo por correo.

## Pendientes que dependen de ti

- [ ] **Testimonios reales.** Los de `src/data/reviews.json` parecen de ejemplo (“Norte Logistics”,
      “Atlas Digital”…). Publicar testimonios inventados puede violar las normas de protección al consumidor
      (SIC en Colombia, PROFECO en México). Reemplázalos por clientes reales, con permiso.
- [ ] **Automatizaciones:** la página `/automatizacion-de-proyectos` solo promete lo que funciona hoy
      (Slack, webhooks a Zapier/Make/n8n al mover o comentar tarjetas, exportación .ics y cálculos
      automáticos). `src/services/automations.ts` tiene reglas con disparadores y acciones, pero no hay
      pantalla para configurarlas. Cuando exista, amplía esa página. Google Calendar y GitHub aparecen
      en el panel de integraciones, pero no sincronizan nada: no se mencionan en el marketing.
- [ ] **Pago desde fuera de Colombia:** el cobro en COP por Landa Pay puede frenar a clientes de México,
      Perú o Chile. Si se habilita tarjeta internacional, actualiza la FAQ de precios.
- [ ] Google Search Console, Bing Webmaster, perfiles en directorios: ver `GUIA-INDEXACION.md`.
