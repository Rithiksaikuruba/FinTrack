'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAddPayment } from '@/hooks/usePayments'
import { useSearchCustomers } from '@/hooks/useCustomers'
import type { CustomerSummary } from '@/types'
import { formatCurrency, today } from '@/lib/utils'
import { Banknote, Smartphone, Search, Check, Zap, Wallet } from 'lucide-react'
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

// Unified input styling matching the AddCustomerForm
const inputBaseClasses = "w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"

export function PaymentForm({ preselectedCustomer, onSuccess }: PaymentFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(
    preselectedCustomer || null
  )
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const { data: searchResults = [], isLoading: searching } = useSearchCustomers(searchQuery)
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
      setValue('amount', preselectedCustomer.daily_amount)
    }
  }, [preselectedCustomer, setValue])

  const selectCustomer = (customer: CustomerSummary) => {
    setSelectedCustomer(customer)
    setValue('customer_id', customer.id)
    setValue('amount', customer.daily_amount)
    setShowDropdown(false)
    setSearchQuery('')
    setTimeout(() => amountRef.current?.focus(), 50)
  }

  const onSubmit = (data: FormValues) => {
    addPayment(data, {
      onSuccess: () => {
        reset({ method: 'cash', date: today() })
        setSelectedCustomer(null)
        setSearchQuery('')
        onSuccess?.()
        setTimeout(() => searchRef.current?.focus(), 100)
      },
    })
  }

  const pendingAmount = selectedCustomer?.pending_amount || 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* ── CUSTOMER SEARCH ───────────────────────────────── */}
      {!preselectedCustomer && (
        <div className="relative">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Customer
          </label>

          {selectedCustomer ? (
            <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-base flex-shrink-0 shadow-sm">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-900 text-sm truncate">
                  {selectedCustomer.name}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-0.5">
                  <span className="text-slate-600">Due: <span className="font-bold">{formatCurrency(selectedCustomer.daily_amount)}</span></span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className={cn(pendingAmount > 0 ? "text-rose-600" : "text-emerald-600")}>
                    Pending: <span className="font-bold">{formatCurrency(pendingAmount)}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null)
                  setValue('customer_id', '')
                  setTimeout(() => searchRef.current?.focus(), 50)
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                className={cn(inputBaseClasses, "pl-11")}
                autoComplete="off"
                autoFocus
              />

              {showDropdown && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 z-50 overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {searching && (
                    <div className="p-5 flex justify-center">
                      <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                  )}
                  {!searching && searchResults.length === 0 && (
                    <p className="text-sm font-medium text-slate-500 p-5 text-center">
                      No customers found matching "{searchQuery}"
                    </p>
                  )}
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => selectCustomer(c)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{c.name}</p>
                        <p className="text-xs font-medium text-slate-500">{c.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">
                          {formatCurrency(c.daily_amount)}<span className="text-slate-400 font-medium">/day</span>
                        </p>
                        <p className={cn("text-xs font-semibold mt-0.5", c.pending_amount > 0 ? "text-rose-600" : "text-emerald-600")}>
                          Pending: {formatCurrency(c.pending_amount)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.customer_id && (
            <p className="text-xs font-medium text-rose-500 mt-2">{errors.customer_id.message}</p>
          )}
        </div>
      )}

      {/* ── AMOUNT ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">Amount</label>
          {selectedCustomer && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Due: <span className="font-bold text-slate-700">{formatCurrency(selectedCustomer.daily_amount)}</span>
            </span>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">
            ₹
          </span>
          <input
            ref={amountRef}
            type="number"
            inputMode="numeric"
            placeholder="0"
            {...register('amount', { valueAsNumber: true })}
            className={cn(inputBaseClasses, "pl-9 text-lg font-extrabold text-slate-900")}
          />
        </div>
        {errors.amount && (
          <p className="text-xs font-medium text-rose-500 mt-2">{errors.amount.message}</p>
        )}
        
        {/* Quick Amount Pills */}
        {selectedCustomer && pendingAmount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in duration-300">
            {[selectedCustomer.daily_amount, Math.min(pendingAmount, selectedCustomer.daily_amount * 2)].map(
              (amt, index) => {
                // Remove duplicate pills if daily amount equals pending or double pending
                if (index === 1 && amt === selectedCustomer.daily_amount) return null;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setValue('amount', amt)}
                    className="text-xs bg-white text-slate-700 px-3 py-2 rounded-xl font-bold border border-slate-200 shadow-sm hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                  >
                    ₹{amt}
                  </button>
                )
              }
            )}
            <button
              type="button"
              onClick={() => setValue('amount', pendingAmount)}
              className="text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl font-bold border border-emerald-200 shadow-sm hover:bg-emerald-100 transition-colors"
            >
              Full ₹{pendingAmount}
            </button>
          </div>
        )}
      </div>

      {/* ── PAYMENT METHOD ────────────────────────────────── */}
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue('method', 'cash')}
            className={cn(
              'flex items-center justify-center gap-2 py-4 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm',
              method === 'cash'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-emerald-100/50'
                : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50'
            )}
          >
            <Banknote size={18} className={method === 'cash' ? 'text-emerald-500' : 'text-slate-400'} />
            Cash
            {method === 'cash' && <Check size={16} strokeWidth={3} className="ml-1 text-emerald-600" />}
          </button>
          <button
            type="button"
            onClick={() => setValue('method', 'upi')}
            className={cn(
              'flex items-center justify-center gap-2 py-4 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm',
              method === 'upi'
                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-blue-100/50'
                : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50'
            )}
          >
            <Zap size={18} className={method === 'upi' ? 'fill-blue-500 text-blue-500' : 'text-slate-400'} />
            UPI
            {method === 'upi' && <Check size={16} strokeWidth={3} className="ml-1 text-blue-600" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* ── DATE ──────────────────────────────────────────── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Date
          </label>
          <input
            type="date"
            {...register('date')}
            className={inputBaseClasses}
            max={today()}
          />
        </div>

        {/* ── NOTES ─────────────────────────────────────────── */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="Remarks..."
            {...register('notes')}
            className={inputBaseClasses}
          />
        </div>
      </div>

      {/* ── SUBMIT ────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'w-full py-4 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm mt-2',
          isPending
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-200'
        )}
      >
        {isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Wallet size={20} />
            Record Payment
          </>
        )}
      </button>
    </form>
  )
}