-- Planes QuinList: Gratis (1 tablero y 1 proyecto) y VIP (ilimitado + IA).
-- Ejecutar en la consola SQL del proyecto MatuDB.

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'inactive',
  landapay_customer_id TEXT,
  landapay_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION quinlist_owner_is_vip(owner TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  sub_plan TEXT;
  sub_status TEXT;
BEGIN
  IF owner IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT plan, status INTO sub_plan, sub_status
  FROM billing_subscriptions
  WHERE user_id = owner;

  RETURN sub_plan = 'vip' AND sub_status IN ('active', 'trialing', 'past_due');
END;
$$;

CREATE OR REPLACE FUNCTION quinlist_enforce_board_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  owner TEXT;
  total INT;
BEGIN
  SELECT owner_id INTO owner FROM workspaces WHERE id = NEW.workspace_id;
  IF quinlist_owner_is_vip(owner) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO total
  FROM boards b
  JOIN workspaces w ON w.id = b.workspace_id
  WHERE w.owner_id = owner;

  IF total >= 1 THEN
    RAISE EXCEPTION 'PLAN_LIMIT_BOARD';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quinlist_board_plan_limit ON boards;
CREATE TRIGGER quinlist_board_plan_limit
  BEFORE INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION quinlist_enforce_board_plan();

CREATE OR REPLACE FUNCTION quinlist_enforce_project_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  owner TEXT;
  total INT;
BEGIN
  SELECT owner_id INTO owner FROM workspaces WHERE id = NEW.workspace_id;
  IF quinlist_owner_is_vip(owner) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO total
  FROM projects p
  JOIN workspaces w ON w.id = p.workspace_id
  WHERE w.owner_id = owner;

  IF total >= 1 THEN
    RAISE EXCEPTION 'PLAN_LIMIT_PROJECT';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quinlist_project_plan_limit ON projects;
CREATE TRIGGER quinlist_project_plan_limit
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION quinlist_enforce_project_plan();

-- MatuDB /data inserta con search_path=public; sin esto el trigger lee public.workspaces
-- (sin owner_id) y falla. Ejecutar en el schema del proyecto (consola SQL de MatuDB):
--   ALTER FUNCTION quinlist_enforce_board_plan() SET search_path TO current_schema, public;
--   ALTER FUNCTION quinlist_enforce_project_plan() SET search_path TO current_schema, public;
--   ALTER FUNCTION quinlist_owner_is_vip(text) SET search_path TO current_schema, public;
DO $$
BEGIN
  EXECUTE format(
    'ALTER FUNCTION quinlist_enforce_board_plan() SET search_path TO %I, public',
    current_schema()
  );
  EXECUTE format(
    'ALTER FUNCTION quinlist_enforce_project_plan() SET search_path TO %I, public',
    current_schema()
  );
  EXECUTE format(
    'ALTER FUNCTION quinlist_owner_is_vip(text) SET search_path TO %I, public',
    current_schema()
  );
END $$;
