import { getSupabaseClient } from '@/lib/supabase'
import type { Customer, CustomerSummary, AddCustomerForm, CustomerFilters } from '@/types'
import { calculateTotalAmount, calculateDailyAmount } from '@/lib/utils'

// ============================================================
// FETCH ALL CUSTOMERS
// ============================================================
export async function fetchCustomers(filters?: CustomerFilters): Promise<CustomerSummary[]> {
  const supabase = getSupabaseClient()

  let query = supabase
    .from('customer_summary')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data as CustomerSummary[]) || []
}

// ============================================================
// FETCH SINGLE CUSTOMER
// ============================================================
export async function fetchCustomer(id: string): Promise<CustomerSummary> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('customer_summary')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as CustomerSummary
}

// ============================================================
// ADD CUSTOMER
// ============================================================
export async function addCustomer(form: AddCustomerForm): Promise<Customer> {
  const supabase = getSupabaseClient()

  const total_amount = calculateTotalAmount(form.loan_amount, form.interest)
  const daily_amount = calculateDailyAmount(total_amount, form.duration_days)

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address?.trim(),
      loan_amount: form.loan_amount,
      interest: form.interest,
      total_amount,
      daily_amount,
      duration_days: form.duration_days,
      start_date: form.start_date,
      notes: form.notes?.trim(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Customer
}

// ============================================================
// UPDATE CUSTOMER
// ============================================================
export async function updateCustomer(
  id: string,
  updates: Partial<AddCustomerForm>
): Promise<Customer> {
  const supabase = getSupabaseClient()

  const updateData: Partial<Customer> = { ...updates } as Partial<Customer>

  if (updates.loan_amount !== undefined || updates.interest !== undefined) {
    const customer = await fetchCustomer(id)
    const loanAmount = updates.loan_amount ?? customer.loan_amount
    const interest = updates.interest ?? customer.interest
    const durationDays = updates.duration_days ?? customer.duration_days
    updateData.total_amount = calculateTotalAmount(loanAmount, interest)
    updateData.daily_amount = calculateDailyAmount(updateData.total_amount, durationDays)
  }

  const { data, error } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Customer
}

// ============================================================
// DELETE CUSTOMER
// ============================================================
export async function deleteCustomer(id: string): Promise<void> {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ============================================================
// SEARCH CUSTOMERS (for payment form autocomplete)
// ============================================================
export async function searchActiveCustomers(query: string): Promise<CustomerSummary[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('customer_summary')
    .select('*')
    .eq('status', 'active')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10)

  if (error) throw new Error(error.message)
  return (data as CustomerSummary[]) || []
}
