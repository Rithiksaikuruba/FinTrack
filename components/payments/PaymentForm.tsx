'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAddPayment } from '@/hooks/usePayments'
import { useSearchCustomers } from '@/hooks/useCustomers'
import type { CustomerSummary } from '@/types'
import { formatCurrency, today } from '@/lib/utils'
import { Banknote, Smartphone, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const schema = z.object({
  customer_id: z.string().min(1, 'Select a customer'),
  amount: z.number().min(1, 'Amount must be > 0'),
  method: z.enum(['cash', 'upi']),
  date: z.string().min(1),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface PaymentFormProps {
  preselectedCustomer?: CustomerSummary
  onSuccess?: () => void
}

export function PaymentForm({ preselectedCustomer, onSuccess }: PaymentFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(
    preselectedCustomer || null
  )
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const { data: searchResults = [], isLoading: searching } =
    useSearchCustomers(searchQuery)

  const { mutate: addPayment, isPending } = useAddPayment()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: 'cash',
      date: today(),
      customer_id: preselectedCustomer?.id || '',
    },
  })

  const method = watch('method')

  useEffect(() => {
    if (preselectedCustomer) {
      setSelectedCustomer(preselectedCustomer)
      setValue('customer_id', preselectedCustomer.id)
      // Auto-fill daily amount
      setValue('amount', preselectedCustomer.daily_amount)
    }
  }, [preselectedCustomer, setValue])

  const selectCustomer = (customer: CustomerSummary) => {
    setSelectedCustomer(customer)
    setValue('customer_id', customer.id)
    setValue('amount', customer.daily_amount)
    setShowDropdown(false)
    setSearchQuery('')
    // Focus amount field after selecting customer
    setTimeout(() => amountRef.current?.focus(), 50)
  }

  const onSubmit = (data: FormValues) => {
    addPayment(data, {
      onSuccess: () => {
        reset({ method: 'cash', date: today() })
        setSelectedCustomer(null)
        setSearchQuery('')
        onSuccess?.()
        // Re-focus search for next entry
        setTimeout(() => searchRef.current?.focus(), 100)
      },
    })
  }

  const pendingAmount = selectedCustomer?.pending_amount || 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* ── CUSTOMER SEARCH ───────────────────────────────── */}
      {!preselectedCustomer && (
        <div className="relative">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
            Customer
          </label>

          {selectedCustomer ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-900">
              <div className="w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">
                  {selectedCustomer.name}
                </p>
                <p className="text-xs text-slate-500">
                  Due: {formatCurrency(selectedCustomer.daily_amount)} · Pending:{' '}
                  {formatCurrency(selectedCustomer.pending_amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null)
                  setValue('customer_id', '')
                  setTimeout(() => searchRef.current?.focus(), 50)
                }}
                className="text-xs text-blue-700 font-semibold"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search name or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className="mobile-input pl-10"
                autoComplete="off"
                autoFocus
              />

              {showDropdown && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto">
                  {searching && (
                    <p className="text-sm text-slate-500 p-4 text-center">
                      Searching...
                    </p>
                  )}
                  {!searching && searchResults.length === 0 && (
                    <p className="text-sm text-slate-500 p-4 text-center">
                      No customers found
                    </p>
                  )}
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => selectCustomer(c)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-700">
                          ₹{c.daily_amount}/day
                        </p>
                        <p className="text-xs text-rose-500">
                          Pending: ₹{c.pending_amount}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.customer_id && (
            <p className="text-xs text-rose-500 mt-1">{errors.customer_id.message}</p>
          )}
        </div>
      )}

      {/* ── AMOUNT ────────────────────────────────────────── */}
      <div>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
          Amount
          {selectedCustomer && (
            <span className="ml-2 text-slate-400 normal-case font-normal">
              (Due: {formatCurrency(selectedCustomer.daily_amount)})
            </span>
          )}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-bold">
            ₹
          </span>
          <input
            ref={amountRef}
            type="number"
            inputMode="numeric"
            placeholder="0"
            {...register('amount', { valueAsNumber: true })}
            className="mobile-input pl-9 text-xl font-bold"
          />
        </div>
        {errors.amount && (
          <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>
        )}
        {selectedCustomer && pendingAmount > 0 && (
          <div className="flex gap-2 mt-2">
            {[selectedCustomer.daily_amount, Math.min(pendingAmount, selectedCustomer.daily_amount * 2)].map(
              (amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setValue('amount', amt)}
                  className="text-xs bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg font-semibold border border-blue-200"
                >
                  ₹{amt}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setValue('amount', pendingAmount)}
              className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg font-semibold border border-emerald-200"
            >
              Full ₹{pendingAmount}
            </button>
          </div>
        )}
      </div>

      {/* ── PAYMENT METHOD ────────────────────────────────── */}
      <div>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue('method', 'cash')}
            className={cn(
              'flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold text-base transition-all',
              method === 'cash'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600'
            )}
          >
            <Banknote size={20} />
            Cash
            {method === 'cash' && <Check size={16} className="ml-1" />}
          </button>
          <button
            type="button"
            onClick={() => setValue('method', 'upi')}
            className={cn(
              'flex items-center justify-center gap-2 py-4 rounded-xl border-2 font-semibold text-base transition-all',
              method === 'upi'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600'
            )}
          >
            <Smartphone size={20} />
            UPI
            {method === 'upi' && <Check size={16} className="ml-1" />}
          </button>
        </div>
      </div>

      {/* ── DATE ──────────────────────────────────────────── */}
      <div>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
          Date
        </label>
        <input
          type="date"
          {...register('date')}
          className="mobile-input"
          max={today()}
        />
      </div>

      {/* ── NOTES ─────────────────────────────────────────── */}
      <div>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
          Notes (Optional)
        </label>
        <input
          type="text"
          placeholder="Any remarks..."
          {...register('notes')}
          className="mobile-input"
        />
      </div>

      {/* ── SUBMIT ────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'btn-action w-full mt-2',
          isPending
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-slate-900 text-white active:bg-slate-800 shadow-lg'
        )}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          <>
            <Check size={20} strokeWidth={2.5} />
            Record Payment
          </>
        )}
      </button>
    </form>
  )
}
