# Guía para indexar QuinList en Google, Bing y las IA

Hazlo **después de desplegar** esta versión (`./deploy.sh`). Toma unos 45 minutos la primera vez.

## 0. Verifica el despliegue (2 minutos)

```bash
curl -sI https://quinlist.matubyte.com/precios | head -1          # HTTP/1.1 200
curl -sI https://quinlist.matubyte.com/no-existe | head -1        # HTTP/1.1 404
curl -s  https://quinlist.matubyte.com/robots.txt | tail -2       # Sitemap: …
curl -s -A GPTBot https://quinlist.matubyte.com/ | grep -c "Excel" # mayor que 0 = la IA ve el texto
```

El servidor (`npm run start`) ya **no usa `serve -s`**: ahora lee `dist/serve.json`. PM2 toma el
cambio al reiniciar (`deploy.sh` ya lo hace).

## 1. Google Search Console (lo más importante)

1. Entra a https://search.google.com/search-console y agrega la propiedad **de dominio**
   `matubyte.com` (verificación por registro DNS TXT). Así cubres `quinlist.matubyte.com` y futuros
   subdominios. Si no tienes acceso al DNS, usa “Prefijo de URL” con
   `https://quinlist.matubyte.com/` y la etiqueta HTML: pégala en `index.html` donde dice
   `google-site-verification`, despliega y verifica.
2. **Sitemaps** → agrega `https://quinlist.matubyte.com/sitemap.xml`.
3. **Inspección de URL** → pide indexación, en este orden (hay un límite diario de unas 10):
   `/`, `/software-gestion-de-proyectos`, `/precios`, `/alternativa-a-excel-para-proyectos`,
   `/tablero-kanban-online`, `/control-de-presupuesto-de-proyectos`,
   `/software-gestion-de-proyectos/colombia`, `/software-gestion-de-proyectos/mexico`.
   Al día siguiente sigue con las demás.
4. En la inspección, haz clic en **“Probar URL publicada” → “Ver página probada”** y confirma que
   el HTML trae el texto de la página.
5. Revisa **Resultados enriquecidos** (Rich Results Test: https://search.google.com/test/rich-results)
   con la home y una guía.

## 2. Bing Webmaster Tools (alimenta a ChatGPT Search y Copilot)

1. https://www.bing.com/webmasters → **Importar desde Google Search Console** (un clic).
2. Envía el sitemap si no se importó.
3. Activa **IndexNow** en la sección correspondiente. ChatGPT Search usa en gran parte el índice de
   Bing, así que este paso es clave para que te recomiende.

## 3. IA: ChatGPT, Claude, Perplexity, Gemini

- Ya están permitidos en `robots.txt` y existen `/llms.txt` y `/llms-full.txt`.
- Las IA recomiendan lo que **aparece citado en varias fuentes**. Por eso el paso 4 importa tanto.
- Prueba cada mes preguntando: “¿Qué software de gestión de proyectos en español me recomiendas para
  una pyme en Colombia?”, “alternativa a Trello en español”, “software para controlar presupuesto de
  obras”. Anota si aparece QuinList.

## 4. Autoridad: perfiles y directorios (los 14 puntos que faltan)

Crea perfiles con el **mismo nombre, descripción y URL** (usa el texto de `llms.txt`):

| Sitio | Para qué |
| --- | --- |
| Google Business Profile (MatuByte S.A.S.) | Marca y búsquedas locales en Colombia |
| LinkedIn (página de QuinList y publicaciones) | Marca, B2B |
| Capterra / GetApp / Software Advice (Gartner) | Reseñas B2B, muy citadas por las IA |
| G2 | Reseñas B2B |
| Product Hunt | Lanzamiento y enlace |
| AlternativeTo (como alternativa a Trello, Asana, Monday) | Tráfico de “alternativa a…” |
| SaaSworthy, SaaSHub, Crozdesk | Enlaces y menciones |
| Directorios de startups de Colombia y LATAM | Autoridad regional |

**Pide reseñas reales** a tus primeros clientes en Capterra o G2. Cuando tengas al menos 5
verificables, se puede volver a mostrar la calificación en la web enlazando a la fuente.

Otras fuentes de enlaces: artículos de invitado en blogs de emprendimiento de la región, cámaras de
comercio, universidades (convenios para estudiantes), y respuestas útiles en comunidades (Reddit,
grupos de LinkedIn) enlazando a las guías.

## 5. Medición

- **Google Analytics 4 ya está integrado** (`src/lib/analytics.ts`). Para activarlo:
  1. Crea una propiedad en https://analytics.google.com y copia el ID (`G-XXXXXXX`).
  2. En el `.env` del servidor: `VITE_GA_MEASUREMENT_ID=G-XXXXXXX` y vuelve a desplegar.
  3. En GA4 → Administrar → Eventos, marca `begin_sign_up` y `generate_lead` como **eventos clave**.
  4. Actualiza la política de privacidad (`/privacidad`) para mencionar Google Analytics.
- Siguiente paso recomendado: enviar `sign_up` al completar el registro y `purchase` al activar VIP.
- Métricas a revisar cada mes en Search Console: impresiones, clics, posición media por página,
  páginas indexadas.
- Expectativa realista: las primeras impresiones llegan en 1 a 3 semanas; posiciones estables en
  3 a 6 meses, siempre que publiques contenido nuevo (1 o 2 guías al mes con el prompt maestro) y
  consigas enlaces.

## 6. Mantenimiento

- Cada vez que cambies un precio o una función: actualiza `src/seo/marketing.ts` y `updated`.
- Cada página nueva: agrégala con el prompt maestro (`PROMPT-MAESTRO-SEO.md`) y pide su indexación.
- No edites `public/robots.txt`, `public/sitemap.xml` ni `public/llms*.txt` a mano: se regeneran
  en cada `npm run build`.
