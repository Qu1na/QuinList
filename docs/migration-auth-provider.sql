-- QuinList: proveedor de autenticación en profiles
-- Ejecutar en la consola SQL del proyecto MatuDB (quinlist).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS provider TEXT;

-- Todos los perfiles actuales (y vacíos) = correo/contraseña.
UPDATE profiles
SET provider = 'email'
WHERE provider IS NULL OR btrim(provider) = '';

ALTER TABLE profiles
  ALTER COLUMN provider SET DEFAULT 'email';

ALTER TABLE profiles
  ALTER COLUMN provider SET NOT NULL;

-- Valores esperados: 'email' | 'google' (facebook más adelante)
COMMENT ON COLUMN profiles.provider IS 'Método de registro/auth primario: email | google';
