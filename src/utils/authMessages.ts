/**
 * Traduce errores crudos de MatuDB/auth a mensajes en español (nunca inglés al usuario).
 */

const EXACT: Record<string, string> = {
  'invalid credentials':
    'No pudimos iniciar sesión. Revisa tu correo y tu contraseña e inténtalo de nuevo.',
  'user not found':
    'No encontramos una cuenta con ese correo. Verifica que esté bien escrito o crea una cuenta nueva.',
  'email already registered':
    'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.',
  'email already exists':
    'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.',
  'user already exists':
    'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.',
  'weak password': 'La contraseña es demasiado débil. Usa al menos 6 caracteres.',
  'password too short': 'La contraseña debe tener al menos 6 caracteres.',
  'authentication required': 'Necesitas iniciar sesión para continuar.',
  'sign up failed': 'No pudimos crear tu cuenta. Inténtalo de nuevo en unos momentos.',
  'sign in failed':
    'No pudimos iniciar sesión. Revisa tu correo y tu contraseña e inténtalo de nuevo.',
  'update failed': 'No pudimos actualizar tus datos. Inténtalo de nuevo.',
  'error requesting recovery':
    'No pudimos enviar el enlace de recuperación. Inténtalo de nuevo en unos momentos.',
  'failed to get user': 'No pudimos verificar tu sesión. Vuelve a iniciar sesión.',
}

const PATTERNS: Array<{ test: RegExp; message: string }> = [
  {
    test: /invalid\s*credentials|wrong\s*password|incorrect\s*password|unauthorized/i,
    message:
      'No pudimos iniciar sesión. Revisa tu correo y tu contraseña e inténtalo de nuevo.',
  },
  {
    test: /user\s*not\s*found|email\s*not\s*found|no\s*user|account\s*not\s*found/i,
    message:
      'No encontramos una cuenta con ese correo. Verifica que esté bien escrito o crea una cuenta nueva.',
  },
  {
    test: /already\s*(exists|registered|in\s*use)/i,
    message: 'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.',
  },
  {
    test: /token.*(invalid|expired|missing)|expired\s*link|invalid\s*token/i,
    message:
      'El enlace de recuperación no es válido o ya caducó. Solicita uno nuevo desde el inicio de sesión.',
  },
  {
    test: /network|failed to fetch|cors/i,
    message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  },
]

export function localizeAuthError(
  raw: string | null | undefined,
  fallback =
    'Ocurrió un problema. Inténtalo de nuevo en unos momentos.',
): string {
  const text = (raw ?? '').trim()
  if (!text) return fallback

  // Already Spanish (heuristic: no common English auth tokens)
  if (
    /[áéíóúñ¿¡]/i.test(text) ||
    /^(No |Tu |El |La |Este |Revisa |Falta |Debes |Ocurrió)/i.test(text)
  ) {
    return text
  }

  const key = text.toLowerCase().replace(/[.!]+$/g, '').trim()
  if (EXACT[key]) return EXACT[key]!

  for (const { test, message } of PATTERNS) {
    if (test.test(text)) return message
  }

  // Generic English → Spanish fallback (never surface raw English)
  if (/^[A-Za-z0-9 ,.'"\-_:;!?()/]+$/.test(text) && /\b(error|failed|invalid|not found|unauthorized)\b/i.test(text)) {
    return fallback
  }

  return text
}

export const AUTH_LOGIN_FAIL_TITLE = 'No pudimos entrar'
export const AUTH_LOGIN_FAIL_MESSAGE =
  'Revisa tu correo y tu contraseña. Si olvidaste la clave, usa “¿Olvidaste tu contraseña?” para recuperarla.'

export const AUTH_RESET_NOT_FOUND_TITLE = 'Correo no registrado'
export const AUTH_RESET_NOT_FOUND_MESSAGE =
  'No encontramos una cuenta con ese correo. Verifica que esté bien escrito o crea una cuenta nueva.'

export const AUTH_RESET_SENT_TITLE = 'Revisa tu correo'
export const AUTH_RESET_SENT_MESSAGE =
  'Si ese correo está registrado, te enviamos un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.'
