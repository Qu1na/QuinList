import type { Project, ProjectCost, TransactionType } from '@/types/projects'
import { compareCalendarDates, compareInstants } from '@/utils/datetime'

export interface FinanceSummary {
  budget: number
  income: number
  expenses: number
  spent: number
  netFlow: number
  balance: number
  usagePercent: number
  profitability: number | null
  transactionCount: number
}

export interface LedgerEntry extends ProjectCost {
  runningBalance: number
  signedAmount: number
}

export interface CashFlowMonth {
  label: string
  income: number
  expenses: number
  net: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percent: number
  type: TransactionType
}

export const TRANSACTION_CATEGORIES = {
  income: ['Anticipo cliente', 'Facturación', 'Hito completado', 'Reembolso', 'Otros ingresos'],
  expense: ['Personal', 'Herramientas', 'Servicios', 'Infraestructura', 'Marketing', 'Viajes', 'Otros gastos'],
} as const

export const PAYMENT_METHOD_LABELS: Record<ProjectCost['paymentMethod'], string> = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
  card: 'Tarjeta',
  invoice: 'Factura',
  check: 'Cheque',
  other: 'Otro',
}

export function calcFinanceSummary(project: Project, transactions: ProjectCost[]): FinanceSummary {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const budget = project.budget || 0
  const balance = budget + income - expenses
  const usagePercent = budget > 0 ? Math.min(100, Math.round((expenses / budget) * 100)) : 0
  const profitability =
    project.profitabilityTarget != null && budget > 0
      ? Math.round(((budget + income - expenses) / budget) * 100)
      : null

  return {
    budget,
    income,
    expenses,
    spent: expenses,
    netFlow: income - expenses,
    balance,
    usagePercent,
    profitability,
    transactionCount: transactions.length,
  }
}

export function buildLedger(project: Project, transactions: ProjectCost[]): LedgerEntry[] {
  const sorted = [...transactions].sort(
    (a, b) => compareCalendarDates(a.date, b.date) || compareInstants(a.createdAt, b.createdAt),
  )
  let running = project.budget
  return sorted.map((t) => {
    const signed = t.type === 'income' ? t.amount : -t.amount
    running += signed
    return { ...t, signedAmount: signed, runningBalance: running }
  })
}

export function cashFlowByMonth(transactions: ProjectCost[], months = 6): CashFlowMonth[] {
  const now = new Date()
  const result: CashFlowMonth[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es', { month: 'short', year: '2-digit' })
    const monthTx = transactions.filter((t) => t.date.startsWith(key))
    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    result.push({ label, income, expenses, net: income - expenses })
  }
  return result
}

export function categoryBreakdown(transactions: ProjectCost[], type: TransactionType): CategoryBreakdown[] {
  const filtered = transactions.filter((t) => t.type === type)
  const total = filtered.reduce((s, t) => s + t.amount, 0) || 1
  const map = new Map<string, number>()
  for (const t of filtered) {
    const cat = t.category || 'Sin categoría'
    map.set(cat, (map.get(cat) ?? 0) + t.amount)
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percent: Math.round((amount / total) * 100),
      type,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export { formatMoney } from '@/utils/currency'
