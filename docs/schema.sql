  -- QuinList schema for MatuDB (PostgreSQL)
  -- Run this in your MatuDB project SQL console

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT DEFAULT '',
    initials TEXT NOT NULL,
    suspended_at TIMESTAMPTZ,
    suspended_until TIMESTAMPTZ,
    suspended_reason TEXT,
    suspended_by TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'W',
    color TEXT NOT NULL DEFAULT '#1e3a5f',
    owner_id TEXT NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE
  );

  CREATE TABLE IF NOT EXISTS workspace_members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(workspace_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS workspace_invites (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    invited_by TEXT NOT NULL REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, email)
  );

  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    background TEXT DEFAULT 'ocean',
    starred BOOLEAN DEFAULT FALSE,
    integrations JSONB DEFAULT '[]',
    labels JSONB DEFAULT '[]',
    created_at DATE NOT NULL DEFAULT CURRENT_DATE
  );

  CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    completed BOOLEAN DEFAULT FALSE,
    label_ids JSONB DEFAULT '[]',
    priority TEXT DEFAULT 'media',
    due_date DATE,
    assignee_ids JSONB DEFAULT '[]',
    checklist JSONB DEFAULT '[]',
    comments JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_boards_workspace ON boards(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_lists_board ON lists(board_id);
  CREATE INDEX IF NOT EXISTS idx_cards_board ON cards(board_id);
  CREATE INDEX IF NOT EXISTS idx_cards_list ON cards(list_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

  CREATE TABLE IF NOT EXISTS board_shares (
    board_id TEXT PRIMARY KEY REFERENCES boards(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    link_role TEXT NOT NULL DEFAULT 'viewer',
    enabled BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS board_invites (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    board_slug TEXT NOT NULL,
    invite_type TEXT NOT NULL DEFAULT 'link',
    email TEXT,
    role TEXT NOT NULL DEFAULT 'viewer',
    max_uses INT,
    use_count INT NOT NULL DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS board_invite_uses (
    id TEXT PRIMARY KEY,
    invite_id TEXT NOT NULL REFERENCES board_invites(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(invite_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS board_members (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'viewer',
    invited_by TEXT NOT NULL REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(board_id, user_id),
    UNIQUE(board_id, email)
  );

  CREATE INDEX IF NOT EXISTS idx_board_members_board ON board_members(board_id);
  CREATE INDEX IF NOT EXISTS idx_board_members_user ON board_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_board_invites_board ON board_invites(board_id);
  CREATE INDEX IF NOT EXISTS idx_board_invites_token ON board_invites(token);

  ALTER TABLE boards ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT '';

  ALTER TABLE cards ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES profiles(id);
  ALTER TABLE cards ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
  ALTER TABLE cards ADD COLUMN IF NOT EXISTS duration_seconds INT;
  ALTER TABLE cards ADD COLUMN IF NOT EXISTS estimate_hours NUMERIC;

  CREATE INDEX IF NOT EXISTS idx_boards_slug ON boards(slug);

  ALTER TABLE cards ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE;
  ALTER TABLE cards ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

  CREATE TABLE IF NOT EXISTS board_messages (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL DEFAULT '',
    attachment JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE board_messages ADD COLUMN IF NOT EXISTS attachment JSONB;

  CREATE INDEX IF NOT EXISTS idx_board_messages_board ON board_messages(board_id);

  CREATE TABLE IF NOT EXISTS board_presence (
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'online',
    activity TEXT DEFAULT '',
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (board_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_board_presence_board ON board_presence(board_id);
  CREATE INDEX IF NOT EXISTS idx_board_presence_last_seen ON board_presence(last_seen);

  -- Gestión de Proyectos (módulo independiente de Tableros Kanban)
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
    created_by TEXT REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS project_milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
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

  ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense';
  ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer';
  ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS reference TEXT DEFAULT '';
  ALTER TABLE project_costs ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

  ALTER TABLE project_risks ADD COLUMN IF NOT EXISTS probability TEXT DEFAULT 'medium';
  ALTER TABLE project_risks ADD COLUMN IF NOT EXISTS mitigation_plan TEXT DEFAULT '';
  ALTER TABLE project_risks ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES profiles(id);

  ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS assignee_id TEXT REFERENCES profiles(id);
  ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS milestone_id TEXT REFERENCES project_milestones(id) ON DELETE SET NULL;

  ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

  CREATE TABLE IF NOT EXISTS project_risks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT DEFAULT 'risk',
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    created_by TEXT REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS project_notes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    content TEXT DEFAULT '',
    color TEXT NOT NULL DEFAULT '#fef08a',
    style TEXT NOT NULL DEFAULT 'pin-single',
    rotation NUMERIC NOT NULL DEFAULT 0,
    position INT NOT NULL DEFAULT 0,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS project_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    attachments JSONB DEFAULT '[]',
    created_by TEXT REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

  CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_costs_project ON project_costs(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_risks_project ON project_risks(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_notes_project ON project_notes(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_deliverables_project ON project_deliverables(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_activities_project ON project_activities(project_id);

  ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'COP';

  ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS start_date DATE;

  ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS estimate_hours NUMERIC;
  ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS logged_minutes INT DEFAULT 0;

  ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
  ALTER TABLE project_deliverables ADD COLUMN IF NOT EXISTS log JSONB DEFAULT '[]';

  ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS folder_id TEXT;

  CREATE TABLE IF NOT EXISTS project_folders (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id TEXT,
    name TEXT NOT NULL,
    created_by TEXT REFERENCES profiles(id),
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

  CREATE INDEX IF NOT EXISTS idx_project_folders_project ON project_folders(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_invites_project ON project_invites(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_team_invites_project ON project_team_invites(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_team_invites_token ON project_team_invites(token);
  CREATE INDEX IF NOT EXISTS idx_project_share_links_project ON project_share_links(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_share_links_token ON project_share_links(token);
  CREATE INDEX IF NOT EXISTS idx_project_time_entries_project ON project_time_entries(project_id);
