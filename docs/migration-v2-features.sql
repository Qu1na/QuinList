-- =============================================================================
-- QuinList — Migración v2: chat, menciones, notas, notificaciones
-- Ejecuta en la consola SQL de MatuDB. Seguro re-ejecutar (IF NOT EXISTS).
--
-- IMPORTANTE:
-- 1. Si es la PRIMERA vez con proyectos, ejecuta ANTES:
--    docs/migration-project-modules.sql
-- 2. Este script NO usa FOREIGN KEY en tablas nuevas: evita el error
--    "foreign key constraint cannot be implemented" cuando projects/profiles
--    aún no existen o tienen otro tipo de id. La app valida las relaciones.
-- =============================================================================

-- ── Bitácora / notas ────────────────────────────────────────────────────────

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

-- ── Chat del tablero (columnas de menciones) ────────────────────────────────

CREATE TABLE IF NOT EXISTS board_messages (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  attachment JSONB,
  mention_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS attachment JSONB;
ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS mention_ids JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_board_messages_board ON board_messages(board_id);

-- ── Chat del proyecto (equipo) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_chat_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  attachment JSONB,
  mention_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_chat_messages_project ON project_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_created ON project_chat_messages(created_at);

-- ── Notificaciones ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ── Realtime (opcional — sustituye SCHEMA y PROJECT_ID) ─────────────────────
-- SELECT matudb_enable_realtime('SCHEMA', 'project_notes', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'board_messages', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'project_chat_messages', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'notifications', 'PROJECT_ID'::uuid);
