import { getSupabaseClient } from '@/lib/supabase'
import type {
  Payment,
  PaymentWithCustomer,
  AddPaymentForm,
  PaymentFilters,
  DashboardStats,
  MissedPaymentCustomer,
} from '@/types'
import dayjs from 'dayjs'

// ============================================================
// ADD PAYMENT
// ============================================================
export async function addPayment(form: AddPaymentForm): Promise<Payment> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('payments')
    .insert({
      customer_id: form.customer_id,
      amount: form.amount,
      method: form.method,
      date: form.date,
      notes: form.notes?.trim(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Payment
}

// ============================================================
// FETCH PAYMENTS (with customer data)
// ============================================================
export async function fetchPayments(
  filters?: PaymentFilters
): Promise<PaymentWithCustomer[]> {
  const supabase = getSupabaseClient()

  let query = supabase
    .from('payments')
    .select(`
      *,
      customers (
        name,
        phone,
        daily_amount,
        pending_amount,
        total_amount,
        paid_amount
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.date) {
    query = query.eq('date', filters.date)
  }

  if (filters?.method && filters.method !== 'all') {
    query = query.eq('method', filters.method)
  }

  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as PaymentWithCustomer[]) || []
}

// ============================================================
// FETCH PAYMENTS FOR A CUSTOMER
// ============================================================
export async function fetchCustomerPayments(customerId: string): Promise<Payment[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('customer_id', customerId)
    .order('date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as Payment[]) || []
}

// ============================================================
// DELETE PAYMENT
// ============================================================
export async function deletePayment(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export async function fetchDashboardStats(date: string): Promise<DashboardStats> {
  const supabase = getSupabaseClient()

  // Today's payments
  const { data: todayPayments, error: p1 } = await supabase
    .from('payments')
    .select('amount, method, customer_id')
    .eq('date', date)

  if (p1) throw new Error(p1.message)

  // Active customers
  const { data: activeCustomers, error: p2 } = await supabase
    .from('customers')
    .select('id, daily_amount')
    .eq('status', 'active')

  if (p2) throw new Error(p2.message)

  const payments = todayPayments || []
  const customers = activeCustomers || []

  const total_collected_today = payments.reduce((s, p) => s + p.amount, 0)
  const cash_today = payments
    .filter((p) => p.method === 'cash')
    .reduce((s, p) => s + p.amount, 0)
  const upi_today = payments
    .filter((p) => p.method === 'upi')
    .reduce((s, p) => s + p.amount, 0)

  const paid_customer_ids = new Set(payments.map((p) => p.customer_id))
  const customers_paid_today = paid_customer_ids.size
  const customers_pending_today = customers.filter(
    (c) => !paid_customer_ids.has(c.id)
  ).length

  const expected_today = customers.reduce((s, c) => s + c.daily_amount, 0)

  return {
    total_collected_today,
    cash_today,
    upi_today,
    customers_paid_today,
    customers_pending_today,
    expected_today,
    total_active_customers: customers.length,
  }
}

// ============================================================
// MISSED PAYMENTS
// ============================================================
export async function fetchMissedPayments(
  date: string
): Promise<MissedPaymentCustomer[]> {
  const supabase = getSupabaseClient()

  // All active customers
  const { data: customers, error: e1 } = await supabase
    .from('customers')
    .select('id, name, phone, daily_amount')
    .eq('status', 'active')

  if (e1) throw new Error(e1.message)

  // Today's payments
  const { data: payments, error: e2 } = await supabase
    .from('payments')
    .select('customer_id, amount')
    .eq('date', date)

  if (e2) throw new Error(e2.message)

  const paymentMap = new Map<string, number>()
  for (const p of payments || []) {
    const existing = paymentMap.get(p.customer_id) || 0
    paymentMap.set(p.customer_id, existing + p.amount)
  }

  return (customers || []).map((c) => {
    const paid = paymentMap.get(c.id) || 0
    let status: 'paid' | 'partial' | 'not_paid'

    if (paid >= c.daily_amount) {
      status = 'paid'
    } else if (paid > 0) {
      status = 'partial'
    } else {
      status = 'not_paid'
    }

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      daily_amount: c.daily_amount,
      paid_today: paid,
      status,
    }
  })
}

// ============================================================
// DAILY COLLECTION TOTALS
// ============================================================
export async function fetchDailyTotals(date: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('daily_collection_summary')
    .select('*')
    .eq('date', date)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data || { date, cash_total: 0, upi_total: 0, grand_total: 0, customers_paid: 0 }
}

// ============================================================
// RECENT DATES WITH PAYMENTS
// ============================================================
export async function fetchRecentCollectionDates(limit = 30) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('daily_collection_summary')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data || []
}