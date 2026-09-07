import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@devjuanes/matuclient'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const envPath = resolve(root, '.env')
  if (!existsSync(envPath)) {
    console.error('No se encontró .env')
    process.exit(1)
  }
  const vars = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    vars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
  return vars
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter(Boolean)
}

const env = loadEnv()
const url = env.VITE_MATUDB_URL
const projectId = env.VITE_MATUDB_PROJECT_ID
const apiKey = env.VITE_MATUDB_API_KEY

if (!url || !projectId || !apiKey) {
  console.error('Faltan VITE_MATUDB_URL, VITE_MATUDB_PROJECT_ID o VITE_MATUDB_API_KEY en .env')
  process.exit(1)
}

const db = createClient({ url, projectId, apiKey })

const migrations = [
  resolve(root, 'docs', 'schema.sql'),
  resolve(root, 'docs', 'migration-v2-features.sql'),
  resolve(root, 'docs', 'migration-chat-complete.sql'),
  resolve(root, 'docs', 'migration-collaboration.sql'),
  resolve(root, 'docs', 'migration-project-modules.sql'),
  resolve(root, 'docs', 'migration-project-notes.sql'),
  resolve(root, 'docs', 'migration-realtime.sql'),
  resolve(root, 'docs', 'migration-v3-features.sql'),
  resolve(root, 'docs', 'migration-user-moderation.sql'),
].filter((p) => existsSync(p))

const allStatements = []
for (const file of migrations) {
  const sql = readFileSync(file, 'utf8')
  for (const stmt of splitSqlStatements(sql)) allStatements.push({ file, stmt })
}

console.log(`Migrando QuinList en ${url} (proyecto ${projectId})...\n`)

let ok = 0
let failed = 0
let currentFile = ''

for (const { file, stmt } of allStatements) {
  if (file !== currentFile) {
    console.log(`\n📄 ${file.replace(root + '\\', '')}`)
    currentFile = file
  }
  const preview = stmt.replace(/\s+/g, ' ').slice(0, 72)
  process.stdout.write(`  → ${preview}... `)

  const { error } = await db.rpc(`${stmt};`)

  if (error) {
    const msg = error.message ?? String(error)
    if (msg.includes('already exists') || msg.includes('duplicate')) {
      console.log('ya existe ✓')
      ok++
    } else {
      console.log(`ERROR: ${msg}`)
      failed++
    }
  } else {
    console.log('ok ✓')
    ok++
  }
}

console.log(`\nMigración terminada: ${ok} ok, ${failed} errores`)
process.exit(failed > 0 ? 1 : 0)
