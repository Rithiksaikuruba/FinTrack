// ============================================================
// CORE TYPES
// ============================================================

export type PaymentMethod = 'cash' | 'upi'
export type CustomerStatus = 'active' | 'completed'
export type PaymentStatus = 'paid' | 'partial' | 'not_paid'

export interface Customer {
  id: string
  name: string
  phone: string
  address?: string
  loan_amount: number
  interest: number
  total_amount: number
  daily_amount: number
  duration_days: number
  start_date: string
  status: CustomerStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface CustomerSummary extends Customer {
  paid_amount: number
  pending_amount: number
  days_elapsed: number
  remaining_days: number
}

export interface Payment {
  id: string
  customer_id: string
  amount: number
  method: PaymentMethod
  date: string
  notes?: string
  created_at: string
}

export interface PaymentWithCustomer extends Payment {
  customers: {
    name: string
    phone: string
    daily_amount: number
  }
}

// ============================================================
// FORM TYPES
// ============================================================

export interface AddCustomerForm {
  name: string
  phone: string
  address: string
  loan_amount: number
  interest: number
  duration_days: number
  start_date: string
  notes?: string
}

export interface AddPaymentForm {
  customer_id: string
  amount: number
  method: PaymentMethod
  date: string
  notes?: string
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface DashboardStats {
  total_collected_today: number
  cash_today: number
  upi_today: number
  customers_paid_today: number
  customers_pending_today: number
  expected_today: number
  total_active_customers: number
}

export interface DailyCollectionSummary {
  date: string
  cash_total: number
  upi_total: number
  grand_total: number
  customers_paid: number
}

export interface MissedPaymentCustomer {
  id: string
  name: string
  phone: string
  daily_amount: number
  paid_today: number
  status: PaymentStatus
}

// ============================================================
// PDF TYPES
// ============================================================

export interface PDFReportData {
  date: string
  payments: PaymentWithCustomer[]
  cash_total: number
  upi_total: number
  grand_total: number
}

// ============================================================
// FILTER TYPES
// ============================================================

export interface CustomerFilters {
  search?: string
  status?: CustomerStatus | 'all'
}

export interface PaymentFilters {
  date?: string
  method?: PaymentMethod | 'all'
  customer_id?: string
}
