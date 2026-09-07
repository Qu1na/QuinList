-- =============================================================================
-- QuinList — Habilitar realtime en tablas (MatuDB)
-- Ejecutar en consola SQL. Reemplaza SCHEMA y PROJECT_ID con los de tu proyecto.
--
-- SCHEMA: nombre del schema del proyecto (ej. proj_cbe0ab2a_dd02_43eb_a394_5224ba49460c)
-- PROJECT_ID: UUID del proyecto MatuDB (ej. cbe0ab2a-dd02-43eb-a394-5224ba49460c)
-- =============================================================================

-- Tableros / workspace
SELECT matudb_enable_realtime('SCHEMA', 'cards', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'lists', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'boards', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'workspaces', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'workspace_members', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'board_members', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'board_invites', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'board_invite_uses', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'board_messages', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'board_presence', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'notifications', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'profiles', 'PROJECT_ID'::uuid);

-- Proyectos
SELECT matudb_enable_realtime('SCHEMA', 'projects', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_tasks', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_milestones', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_costs', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_risks', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_deliverables', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_documents', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_folders', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_invites', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_members', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_activities', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_time_entries', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_notes', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_chat_messages', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'board_messages', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_task_comments', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_presence', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_team_invites', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_team_invite_uses', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'project_share_links', 'PROJECT_ID'::uuid);

-- v3 — eventos, recurrencia, dependencias, custom fields, reacciones, OKRs
SELECT matudb_enable_realtime('SCHEMA', 'workspace_events', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'event_attendees', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'recurring_rules', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'task_dependencies', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'custom_field_definitions', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'custom_field_values', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'reactions', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'automation_rules', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'automation_logs', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'saved_views', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'okrs', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'key_results', 'PROJECT_ID'::uuid);
SELECT matudb_enable_realtime('SCHEMA', 'key_result_updates', 'PROJECT_ID'::uuid);
