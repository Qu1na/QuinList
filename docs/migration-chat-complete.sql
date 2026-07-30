-- =============================================================================
-- QuinList — Chat completo (MatuDB / PostgreSQL)
-- Ejecuta TODO este script en la consola SQL de tu proyecto MatuDB.
-- Seguro re-ejecutar: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
--
-- SIN FOREIGN KEYS (evita errores si profiles/projects aún no existen).
-- La aplicación valida las relaciones.
--
-- Después de ejecutar, habilita realtime (ver final del archivo).
-- =============================================================================

-- ── Documentación / Drive (archivos del chat) ───────────────────────────────

CREATE TABLE IF NOT EXISTS project_folders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_folders_project ON project_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_folders_parent ON project_folders(parent_id);

CREATE TABLE IF NOT EXISTS project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  folder_id TEXT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  attachments JSONB DEFAULT '[]',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_folder ON project_documents(folder_id);

-- ── Mensajes del proyecto ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_chat_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  attachment JSONB,
  mention_ids JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'sent',
  read_by JSONB NOT NULL DEFAULT '[]',
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_chat_messages ADD COLUMN IF NOT EXISTS attachment JSONB;
ALTER TABLE project_chat_messages ADD COLUMN IF NOT EXISTS mention_ids JSONB DEFAULT '[]';
ALTER TABLE project_chat_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE project_chat_messages ADD COLUMN IF NOT EXISTS read_by JSONB NOT NULL DEFAULT '[]';
ALTER TABLE project_chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE project_chat_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_project_chat_messages_project ON project_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_created ON project_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_project_chat_messages_user ON project_chat_messages(user_id);

-- ── Lectura / recibos de lectura por usuario ────────────────────────────────

CREATE TABLE IF NOT EXISTS project_chat_read_state (
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_message_id TEXT,
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_chat_read_state_user ON project_chat_read_state(user_id);

-- ── Indicador "está escribiendo" ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_chat_typing (
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_chat_typing_updated ON project_chat_typing(updated_at);

-- ── Presencia en línea (proyecto) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_presence (
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  activity TEXT DEFAULT '',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_presence_project ON project_presence(project_id);
CREATE INDEX IF NOT EXISTS idx_project_presence_last_seen ON project_presence(last_seen);

-- ── Mensajes del tablero ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS board_messages (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  attachment JSONB,
  mention_ids JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'sent',
  read_by JSONB NOT NULL DEFAULT '[]',
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS attachment JSONB;
ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS mention_ids JSONB DEFAULT '[]';
ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS read_by JSONB NOT NULL DEFAULT '[]';
ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_board_messages_board ON board_messages(board_id);
CREATE INDEX IF NOT EXISTS idx_board_messages_created ON board_messages(created_at);

CREATE TABLE IF NOT EXISTS board_chat_read_state (
  board_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_message_id TEXT,
  PRIMARY KEY (board_id, user_id)
);

CREATE TABLE IF NOT EXISTS board_chat_typing (
  board_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

CREATE TABLE IF NOT EXISTS board_presence (
  board_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  activity TEXT DEFAULT '',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_presence_board ON board_presence(board_id);

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
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ── Notas del proyecto (si faltan) ──────────────────────────────────────────

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

-- =============================================================================
-- REALTIME — sustituye SCHEMA y PROJECT_ID y ejecuta cada línea:
--
-- SCHEMA: ej. proj_cbe0ab2a_dd02_43eb_a394_5224ba49460c
-- PROJECT_ID: ej. cbe0ab2a-dd02-43eb-a394-5224ba49460c
-- =============================================================================
--
-- SELECT matudb_enable_realtime('SCHEMA', 'project_chat_messages', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'project_chat_read_state', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'project_chat_typing', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'project_presence', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'project_documents', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'project_folders', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'board_messages', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'board_chat_typing', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'board_chat_read_state', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'board_presence', 'PROJECT_ID'::uuid);
-- SELECT matudb_enable_realtime('SCHEMA', 'notifications', 'PROJECT_ID'::uuid);
