import { getSupabaseClient } from '@/lib/supabase'
import type {
  Payment,
  PaymentWithCustomer,
  AddPaymentForm,
  PaymentFilters,
  DashboardStats,
  MissedPaymentCustomer,
} from '@/types'

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
// FETCH PAYMENTS (with customer data + computed balance)
// ============================================================
export async function fetchPayments(
  filters?: PaymentFilters
): Promise<PaymentWithCustomer[]> {
  const supabase = getSupabaseClient()

  // Step 1: Fetch filtered payments (minimal join — only safe columns)
  let query = supabase
    .from('payments')
    .select(`
      *,
      customers (
        name,
        phone,
        daily_amount
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.date)       query = query.eq('date', filters.date)
  if (filters?.method && filters.method !== 'all') query = query.eq('method', filters.method)
  if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const payments = (data ?? []) as Array<
    Payment & { customers: { name: string; phone: string; daily_amount: number } | null }
  >

  if (payments.length === 0) return []

  const customerIds = [...new Set(payments.map((p) => p.customer_id))]

  // Step 2: Fetch total_amount directly from customers table (bypasses join RLS issues)
  const { data: customerRows, error: custError } = await supabase
    .from('customers')
    .select('id, total_amount')
    .in('id', customerIds)

  if (custError) throw new Error(custError.message)

  const totalAmountMap: Record<string, number> = {}
  for (const c of customerRows ?? []) {
    totalAmountMap[c.id] = Number(c.total_amount ?? 0)
  }

  // Step 3: Sum ALL historical payments per customer to get lifetime paid
  const { data: allPaid, error: paidError } = await supabase
    .from('payments')
    .select('customer_id, amount')
    .in('customer_id', customerIds)

  if (paidError) throw new Error(paidError.message)

  const paidMap: Record<string, number> = {}
  for (const p of allPaid ?? []) {
    paidMap[p.customer_id] = (paidMap[p.customer_id] ?? 0) + Number(p.amount)
  }

  // Step 4: Attach computed fields to each payment row
  return payments.map((p) => {
    const totalAmount = totalAmountMap[p.customer_id] ?? 0
    const paidAmount  = paidMap[p.customer_id] ?? 0
    const pending     = Math.max(0, totalAmount - paidAmount)

    return {
      ...p,
      customers: {
        name:           p.customers?.name         ?? 'Unknown',
        phone:          p.customers?.phone        ?? '-',
        daily_amount:   p.customers?.daily_amount ?? 0,
        total_amount:   totalAmount,
        paid_amount:    paidAmount,
        pending_amount: pending,
      },
    } as PaymentWithCustomer
  })
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

  const { data: todayPayments, error: p1 } = await supabase
    .from('payments')
    .select('amount, method, customer_id')
    .eq('date', date)

  if (p1) throw new Error(p1.message)

  const { data: activeCustomers, error: p2 } = await supabase
    .from('customers')
    .select('id, daily_amount')
    .eq('status', 'active')

  if (p2) throw new Error(p2.message)

  const payments  = todayPayments  || []
  const customers = activeCustomers || []

  const total_collected_today   = payments.reduce((s, p) => s + p.amount, 0)
  const cash_today              = payments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0)
  const upi_today               = payments.filter((p) => p.method === 'upi') .reduce((s, p) => s + p.amount, 0)
  const paid_customer_ids       = new Set(payments.map((p) => p.customer_id))
  const customers_paid_today    = paid_customer_ids.size
  const customers_pending_today = customers.filter((c) => !paid_customer_ids.has(c.id)).length
  const expected_today          = customers.reduce((s, c) => s + c.daily_amount, 0)

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
export async function fetchMissedPayments(date: string): Promise<MissedPaymentCustomer[]> {
  const supabase = getSupabaseClient()

  const { data: customers, error: e1 } = await supabase
    .from('customers')
    .select('id, name, phone, daily_amount')
    .eq('status', 'active')

  if (e1) throw new Error(e1.message)

  const { data: payments, error: e2 } = await supabase
    .from('payments')
    .select('customer_id, amount')
    .eq('date', date)

  if (e2) throw new Error(e2.message)

  const paymentMap = new Map<string, number>()
  for (const p of payments || []) {
    paymentMap.set(p.customer_id, (paymentMap.get(p.customer_id) || 0) + p.amount)
  }

  return (customers || []).map((c) => {
    const paid = paymentMap.get(c.id) || 0
    const status: 'paid' | 'partial' | 'not_paid' =
      paid >= c.daily_amount ? 'paid' : paid > 0 ? 'partial' : 'not_paid'

    return { id: c.id, name: c.name, phone: c.phone, daily_amount: c.daily_amount, paid_today: paid, status }
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