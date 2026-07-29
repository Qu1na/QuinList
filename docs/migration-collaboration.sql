-- =============================================================================
-- QuinList — Colaboración en tiempo real (presencia + actividad extendida)
-- Ejecutar en consola SQL de MatuDB. Seguro re-ejecutar (IF NOT EXISTS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_presence (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'online',
  activity TEXT DEFAULT '',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_presence_project ON project_presence(project_id);
CREATE INDEX IF NOT EXISTS idx_project_presence_last_seen ON project_presence(last_seen);

ALTER TABLE project_activities ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE project_activities ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE project_activities ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE project_activities ADD COLUMN IF NOT EXISTS entity_title TEXT;

ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES profiles(id);
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS updated_by TEXT REFERENCES profiles(id);
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES profiles(id);
ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS updated_by TEXT REFERENCES profiles(id);
ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS project_task_comments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_task_comments_project ON project_task_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_task_comments_task ON project_task_comments(task_id);
