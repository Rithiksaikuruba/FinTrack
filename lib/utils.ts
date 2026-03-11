import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// CURRENCY FORMATTING
// ============================================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${amount}`
}

// ============================================================
// DATE FORMATTING
// ============================================================
export function formatDate(date: string | Date): string {
  return dayjs(date).format('DD MMM YYYY')
}

export function formatDateShort(date: string | Date): string {
  return dayjs(date).format('DD/MM/YY')
}

export function formatDateForInput(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD')
}

export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}

export function isToday(date: string): boolean {
  return dayjs(date).isSame(dayjs(), 'day')
}

// ============================================================
// LOAN CALCULATIONS
// ============================================================
export function calculateTotalAmount(loanAmount: number, interest: number): number {
  return loanAmount + interest
}

export function calculateDailyAmount(totalAmount: number, durationDays: number): number {
  return Math.ceil(totalAmount / durationDays)
}

export function calculatePendingAmount(totalAmount: number, paidAmount: number): number {
  return Math.max(0, totalAmount - paidAmount)
}

export function calculateProgress(paidAmount: number, totalAmount: number): number {
  if (totalAmount === 0) return 0
  return Math.min(100, (paidAmount / totalAmount) * 100)
}

// ============================================================
// PAYMENT STATUS
// ============================================================
export function getPaymentStatusColor(status: 'paid' | 'partial' | 'not_paid'): string {
  switch (status) {
    case 'paid': return 'text-emerald-600 bg-emerald-50'
    case 'partial': return 'text-amber-600 bg-amber-50'
    case 'not_paid': return 'text-red-600 bg-red-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

export function getPaymentStatusLabel(status: 'paid' | 'partial' | 'not_paid'): string {
  switch (status) {
    case 'paid': return 'Paid'
    case 'partial': return 'Partial'
    case 'not_paid': return 'Not Paid'
    default: return 'Unknown'
  }
}

// ============================================================
// MISC
// ============================================================
export function maskPhone(phone: string): string {
  if (phone.length < 10) return phone
  return phone.slice(0, 2) + '****' + phone.slice(-4)
}

export function getDaysElapsed(startDate: string): number {
  return dayjs().diff(dayjs(startDate), 'day')
}

export function getRemainingDays(startDate: string, durationDays: number): number {
  const elapsed = getDaysElapsed(startDate)
  return Math.max(0, durationDays - elapsed)
}
