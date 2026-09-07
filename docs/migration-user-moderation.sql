-- QuinList — Moderación de usuarios (suspensión + último acceso)
-- Extiende profiles para suspender cuentas a nivel plataforma.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_suspended_at ON profiles(suspended_at)
  WHERE suspended_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login_at);
