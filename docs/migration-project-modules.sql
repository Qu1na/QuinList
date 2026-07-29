-- =============================================================================
-- QuinList — Migración de tablas de proyectos (MatuDB / PostgreSQL)
-- Ejecuta TODO este script en la consola SQL de tu proyecto MatuDB.
-- Es seguro re-ejecutarlo: usa CREATE TABLE IF NOT EXISTS y ADD COLUMN IF NOT EXISTS.
-- =============================================================================

-- ── Tablas base de proyectos (por si faltan) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  client TEXT DEFAULT '',
  responsible_id TEXT REFERENCES profiles(id),
  priority TEXT DEFAULT 'media',
  status TEXT DEFAULT 'planning',
  category TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  start_date DATE,
  due_date DATE,
  budget NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'COP',
  profitability_target NUMERIC,
  board_id TEXT REFERENCES boards(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'media',
  assignee_ids JSONB DEFAULT '[]',
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  position INT DEFAULT 0,
  kanban_column TEXT DEFAULT 'todo',
  board_card_id TEXT,
  board_id TEXT REFERENCES boards(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  estimate_hours NUMERIC,
  logged_minutes INT DEFAULT 0,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date DATE,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_costs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'expense',
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'transfer',
  reference TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_risks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT DEFAULT 'risk',
  severity TEXT DEFAULT 'medium',
  probability TEXT DEFAULT 'medium',
  mitigation_plan TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  owner_id TEXT REFERENCES profiles(id),
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_deliverables (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  status TEXT DEFAULT 'pending',
  completed BOOLEAN DEFAULT FALSE,
  assignee_id TEXT REFERENCES profiles(id),
  milestone_id TEXT REFERENCES project_milestones(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  folder_id TEXT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  attachments JSONB DEFAULT '[]',
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_folders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id TEXT,
  name TEXT NOT NULL,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  can_view_finance BOOLEAN DEFAULT FALSE,
  can_manage_tasks BOOLEAN DEFAULT TRUE,
  can_manage_team BOOLEAN DEFAULT FALSE,
  joined_at DATE DEFAULT CURRENT_DATE,
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_activities (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_invites (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  can_view_finance BOOLEAN DEFAULT FALSE,
  can_manage_tasks BOOLEAN DEFAULT TRUE,
  can_manage_team BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_time_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id TEXT REFERENCES project_tasks(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  description TEXT DEFAULT '',
  minutes INT NOT NULL DEFAULT 0,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_share_links (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer',
  expires_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NUEVAS: invitaciones por enlace al equipo del proyecto ────────────────────

CREATE TABLE IF NOT EXISTS project_team_invites (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  can_view_finance BOOLEAN DEFAULT FALSE,
  can_manage_tasks BOOLEAN DEFAULT TRUE,
  can_manage_team BOOLEAN DEFAULT FALSE,
  max_uses INT,
  use_count INT NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_team_invite_uses (
  id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL REFERENCES project_team_invites(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(invite_id, user_id)
);

-- ── Columnas adicionales (tablas ya existentes) ───────────────────────────────

ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'COP';
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS estimate_hours NUMERIC;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS logged_minutes INT DEFAULT 0;
ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense';
ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer';
ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS reference TEXT DEFAULT '';
ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE project_risks ADD COLUMN IF NOT EXISTS probability TEXT DEFAULT 'medium';
ALTER TABLE project_risks ADD COLUMN IF NOT EXISTS mitigation_plan TEXT DEFAULT '';
ALTER TABLE project_risks ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES profiles(id);
ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS assignee_id TEXT REFERENCES profiles(id);
ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS milestone_id TEXT REFERENCES project_milestones(id) ON DELETE SET NULL;
ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS log JSONB DEFAULT '[]';
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- ── Índices ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_project ON project_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_risks_project ON project_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_deliverables_project ON project_deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_folders_project ON project_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_project ON project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_project ON project_invites(project_id);
CREATE INDEX IF NOT EXISTS idx_project_time_entries_project ON project_time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_project_share_links_project ON project_share_links(project_id);
CREATE INDEX IF NOT EXISTS idx_project_share_links_token ON project_share_links(token);
CREATE INDEX IF NOT EXISTS idx_project_team_invites_project ON project_team_invites(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_invites_token ON project_team_invites(token);
