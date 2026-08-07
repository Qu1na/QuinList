/**
 * Genera robots.txt, sitemap.xml y sitemap-index.xml desde site.config.json.
 * Ejecutar en prebuild / post-change de rutas públicas.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')
const configPath = join(root, 'src', 'seo', 'site.config.json')

const config = JSON.parse(readFileSync(configPath, 'utf8'))
const siteUrl = String(config.siteUrl).replace(/\/$/, '')
const today = new Date().toISOString().slice(0, 10)

const indexableRoutes = (config.routes || []).filter((r) => r.index !== false)

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function buildSitemap() {
  const urls = indexableRoutes
    .map((route) => {
      const loc = `${siteUrl}${route.path === '/' ? '/' : route.path}`
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${escapeXml(route.changefreq || 'monthly')}</changefreq>
    <priority>${Number(route.priority ?? 0.5).toFixed(1)}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}

function buildSitemapIndex() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(`${siteUrl}/sitemap.xml`)}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`
}

function buildRobots() {
  return `# QuinList — ${siteUrl}
# Generado automáticamente por scripts/generate-seo.mjs

User-agent: *
Allow: /
Allow: /register
Allow: /ayuda
Allow: /privacidad
Allow: /terminos
Allow: /sitemap.xml
Allow: /sitemap-index.xml
Allow: /robots.txt
Allow: /manifest.webmanifest
Allow: /image/
Disallow: /app
Disallow: /app/
Disallow: /login
Disallow: /join
Disallow: /join/
Disallow: /share/
Disallow: /*?*utm_*

# Motores y crawlers principales
User-agent: Googlebot
Allow: /
Disallow: /app
Disallow: /app/
Disallow: /login
Disallow: /join
Disallow: /share/

User-agent: Bingbot
Allow: /
Disallow: /app
Disallow: /app/
Disallow: /login
Disallow: /join
Disallow: /share/

User-agent: DuckDuckBot
Allow: /
Disallow: /app/
Disallow: /login
Disallow: /join/
Disallow: /share/

User-agent: Slurp
Allow: /
Disallow: /app/
Disallow: /login

User-agent: Yandex
Allow: /
Disallow: /app/
Disallow: /login

User-agent: Baiduspider
Allow: /
Disallow: /app/
Disallow: /login

User-agent: Applebot
Allow: /
Disallow: /app/
Disallow: /login

# Social / previews
User-agent: facebookexternalhit
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: Discordbot
Allow: /

User-agent: Slackbot
Allow: /

User-agent: TelegramBot
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/sitemap-index.xml
`
}

mkdirSync(publicDir, { recursive: true })
writeFileSync(join(publicDir, 'sitemap.xml'), buildSitemap(), 'utf8')
writeFileSync(join(publicDir, 'sitemap-index.xml'), buildSitemapIndex(), 'utf8')
writeFileSync(join(publicDir, 'robots.txt'), buildRobots(), 'utf8')

console.log(`[seo] Generados robots.txt, sitemap.xml y sitemap-index.xml (${indexableRoutes.length} URLs, ${today})`)
