-- =============================================================================
-- QuinList — Bitácora / notas del proyecto (MatuDB)
-- Ejecuta en la consola SQL. Seguro re-ejecutar (IF NOT EXISTS).
--
-- Si falla por FK, usa docs/migration-v2-features.sql (sin foreign keys).
-- Si es tu primera migración de proyectos, ejecuta antes:
--   docs/migration-project-modules.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  color TEXT NOT NULL DEFAULT '#fef08a',
  style TEXT NOT NULL DEFAULT 'pin-single',
  rotation NUMERIC NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_notes_project ON project_notes(project_id);

-- Realtime (opcional): SELECT matudb_enable_realtime('SCHEMA', 'project_notes', 'PROJECT_ID'::uuid);
