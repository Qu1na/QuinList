-- Migración Sizor → QuinList (MatuDB / workspaces)
-- Ejecutar en el proyecto MatuDB de QuinList

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS sizor_company_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_sizor_company
  ON workspaces(sizor_company_id)
  WHERE sizor_company_id IS NOT NULL;
