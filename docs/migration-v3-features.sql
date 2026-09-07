-- QuinList v3 — Nuevos módulos de productividad
-- Migración idempotente: usa CREATE TABLE / ADD COLUMN con IF NOT EXISTS.
-- Ejecutar con: node scripts/migrate.mjs (lee .env y aplica contra MatuDB).

-- =========================================================================
-- 1) EVENTOS DE EQUIPO (calendario de reuniones/eventos)
-- =========================================================================
CREATE TABLE IF NOT EXISTS workspace_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  board_id TEXT REFERENCES boards(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  meeting_url TEXT DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  category TEXT NOT NULL DEFAULT 'meeting',
  recurrence TEXT DEFAULT 'none',
  recurrence_end DATE,
  created_by TEXT NOT NULL REFERENCES profiles(id),
  updated_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_events_workspace ON workspace_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_events_project ON workspace_events(project_id);
CREATE INDEX IF NOT EXISTS idx_workspace_events_starts ON workspace_events(starts_at);

CREATE TABLE IF NOT EXISTS event_attendees (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES workspace_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL DEFAULT 'pending',
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);

-- =========================================================================
-- 2) TAREAS RECURRENTES
-- =========================================================================
CREATE TABLE IF NOT EXISTS recurring_rules (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'project_task',
  parent_id TEXT NOT NULL,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL,
  interval_value INT NOT NULL DEFAULT 1,
  weekdays JSONB DEFAULT '[]',
  month_day INT,
  starts_on DATE NOT NULL,
  ends_on DATE,
  next_run DATE,
  last_run DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_rules_parent ON recurring_rules(parent_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_active ON recurring_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_next_run ON recurring_rules(next_run);

-- Vincular project_tasks y cards a su regla de recurrencia
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS recurring_rule_id TEXT REFERENCES recurring_rules(id) ON DELETE SET NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS recurring_rule_id TEXT REFERENCES recurring_rules(id) ON DELETE SET NULL;

-- =========================================================================
-- 3) DEPENDENCIAS ENTRE TAREAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS task_dependencies (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'blocks',
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_source ON task_dependencies(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_target ON task_dependencies(target_type, target_id);

-- =========================================================================
-- 4) CAMPOS PERSONALIZADOS
-- =========================================================================
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  required BOOLEAN NOT NULL DEFAULT FALSE,
  position INT NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_scope ON custom_field_definitions(scope, scope_id);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id TEXT PRIMARY KEY,
  definition_id TEXT NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  value_text TEXT DEFAULT '',
  value_number NUMERIC,
  value_date DATE,
  value_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(definition_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_definition ON custom_field_values(definition_id);

-- =========================================================================
-- 5) REACCIONES (emoji en mensajes y comentarios)
-- =========================================================================
CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_entity ON reactions(entity_type, entity_id);

-- =========================================================================
-- 6) AUTOMATIZACIONES ("when X then Y")
-- =========================================================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id TEXT REFERENCES boards(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_workspace ON automation_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_board ON automation_rules(board_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_project ON automation_rules(project_id);

CREATE TABLE IF NOT EXISTS automation_logs (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  message TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_rule ON automation_logs(rule_id);

-- =========================================================================
-- 7) VISTAS GUARDADAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS saved_views (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  sort JSONB DEFAULT '{}',
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_workspace ON saved_views(workspace_id);

-- =========================================================================
-- 8) OKRs / OBJETIVOS DEL EQUIPO
-- =========================================================================
CREATE TABLE IF NOT EXISTS okrs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  parent_id TEXT REFERENCES okrs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id TEXT REFERENCES profiles(id),
  period TEXT NOT NULL DEFAULT 'quarter',
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'on_track',
  progress INT NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_okrs_workspace ON okrs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_okrs_project ON okrs(project_id);
CREATE INDEX IF NOT EXISTS idx_okrs_parent ON okrs(parent_id);

CREATE TABLE IF NOT EXISTS key_results (
  id TEXT PRIMARY KEY,
  okr_id TEXT NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'percentage',
  target_value NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '%',
  owner_id TEXT REFERENCES profiles(id),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_key_results_okr ON key_results(okr_id);

CREATE TABLE IF NOT EXISTS key_result_updates (
  id TEXT PRIMARY KEY,
  key_result_id TEXT NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  note TEXT DEFAULT '',
  updated_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_key_result_updates_kr ON key_result_updates(key_result_id);

-- =========================================================================
-- 9) MEJORAS A TABLAS EXISTENTES
-- =========================================================================
-- Hilos / replies en mensajes de chat de proyecto
ALTER TABLE project_chat_messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT;
ALTER TABLE project_chat_messages ADD COLUMN IF NOT EXISTS thread_count INT NOT NULL DEFAULT 0;

ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT;
ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS thread_count INT NOT NULL DEFAULT 0;

-- Snooze y prioridad en notificaciones
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';

-- Horas estimadas vs logged en cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS logged_minutes INT NOT NULL DEFAULT 0;

-- Enable features a nivel workspace
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';

-- Enable features a nivel board
ALTER TABLE boards ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';

-- Aprobación en deliverables
ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS approved_by TEXT REFERENCES profiles(id);