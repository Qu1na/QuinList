export const DEFAULT_CURRENCY = 'COP'

export interface CurrencyOption {
  code: string
  label: string
  locale: string
}

/** Monedas soportadas — COP por defecto */
export const CURRENCIES: CurrencyOption[] = [
  { code: 'COP', label: 'Peso colombiano (COP)', locale: 'es-CO' },
  { code: 'USD', label: 'Dólar estadounidense (USD)', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (EUR)', locale: 'es-ES' },
  { code: 'MXN', label: 'Peso mexicano (MXN)', locale: 'es-MX' },
  { code: 'ARS', label: 'Peso argentino (ARS)', locale: 'es-AR' },
  { code: 'CLP', label: 'Peso chileno (CLP)', locale: 'es-CL' },
  { code: 'PEN', label: 'Sol peruano (PEN)', locale: 'es-PE' },
  { code: 'BRL', label: 'Real brasileño (BRL)', locale: 'pt-BR' },
  { code: 'GBP', label: 'Libra esterlina (GBP)', locale: 'en-GB' },
]

export function getCurrencyOption(code: string): CurrencyOption {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]!
}

export function formatMoney(amount: number, currency = DEFAULT_CURRENCY): string {
  const opt = getCurrencyOption(currency)
  const fractionDigits = ['COP', 'CLP'].includes(currency) ? 0 : 2
  return new Intl.NumberFormat(opt.locale, {
    style: 'currency',
    currency: opt.code,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(amount)
}

export function currencyLabel(code: string): string {
  return getCurrencyOption(code).label
}

/** Separador de miles según locale de la moneda */
function thousandSeparator(currency: string): string {
  const opt = getCurrencyOption(currency)
  const parts = new Intl.NumberFormat(opt.locale).formatToParts(1000)
  return parts.find((p) => p.type === 'group')?.value ?? ','
}

/** Formatea un número para mostrar en input de moneda (sin símbolo) */
export function formatCurrencyInput(amount: number, currency = DEFAULT_CURRENCY): string {
  if (!Number.isFinite(amount) || amount === 0) return ''
  const opt = getCurrencyOption(currency)
  const fractionDigits = ['COP', 'CLP'].includes(currency) ? 0 : 2
  return new Intl.NumberFormat(opt.locale, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  }).format(amount)
}

/** Parsea texto de input de moneda a número */
export function parseCurrencyInput(text: string, currency = DEFAULT_CURRENCY): number {
  const sep = thousandSeparator(currency)
  const cleaned = text
    .replace(/[^\d.,\-]/g, '')
    .replace(new RegExp(`\\${sep}`, 'g'), '')
    .replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}
