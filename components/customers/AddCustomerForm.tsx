'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAddCustomer } from '@/hooks/useCustomers'
import type { AddCustomerForm } from '@/types'
import { calculateTotalAmount, calculateDailyAmount, today } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { UserPlus, User, FileText, Calculator, AlignLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  address: z.string().optional().default(''),
  loan_amount: z.number().min(100, 'Minimum loan ₹100'),
  interest: z.number().min(0, 'Interest cannot be negative'),
  duration_days: z.number().min(1).max(365).default(100),
  start_date: z.string().min(1),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface FieldProps {
  label: string
  error?: string
  children: React.ReactNode
  hint?: string
}

function Field({ label, error, children, hint }: FieldProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 mb-2 block">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500 mt-2 font-medium">{hint}</p>}
      {error && <p className="text-xs text-rose-500 mt-2 font-medium">{error}</p>}
    </div>
  )
}

// Reusable input class for consistency
const inputBaseClasses = "w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"

export function AddCustomerForm() {
  const { mutate: addCustomer, isPending } = useAddCustomer()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration_days: 100,
      start_date: today(),
      interest: 0,
    },
  })

  // Live calculation preview
  const [loanAmount, interest, durationDays] = useWatch({
    control,
    name: ['loan_amount', 'interest', 'duration_days'],
  })

  const totalAmount =
    loanAmount && interest !== undefined
      ? calculateTotalAmount(Number(loanAmount) || 0, Number(interest) || 0)
      : 0
  const dailyAmount =
    totalAmount && durationDays
      ? calculateDailyAmount(totalAmount, Number(durationDays) || 100)
      : 0

  const onSubmit = (data: FormValues) => {
    addCustomer(data as AddCustomerForm)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* Calculation preview banner */}
      {totalAmount > 0 && (
        <div className="bg-indigo-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-xs text-indigo-200 mb-4 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Calculator size={14} /> Loan Summary
          </p>
          <div className="grid grid-cols-3 gap-4 divide-x divide-indigo-500/50">
            <div>
              <p className="text-xs text-indigo-200 font-medium mb-1">Total</p>
              <p className="text-lg font-extrabold text-white">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-indigo-200 font-medium mb-1">Daily</p>
              <p className="text-lg font-extrabold text-emerald-300">
                {formatCurrency(dailyAmount)}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-indigo-200 font-medium mb-1">Days</p>
              <p className="text-lg font-extrabold text-amber-300">
                {durationDays || 100}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personal info */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-5">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2">
          <User size={16} className="text-indigo-500" /> Customer Info
        </h3>

        <Field label="Full Name" error={errors.name?.message}>
          <input
            type="text"
            placeholder="e.g. Rajesh Kumar"
            {...register('name')}
            className={inputBaseClasses}
            autoCapitalize="words"
          />
        </Field>

        <Field label="Phone Number" error={errors.phone?.message}>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            {...register('phone')}
            className={inputBaseClasses}
          />
        </Field>

        <Field label="Address (Optional)" error={errors.address?.message}>
          <input
            type="text"
            placeholder="Street, Area, City"
            {...register('address')}
            className={inputBaseClasses}
          />
        </Field>
      </div>

      {/* Loan details */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-5">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2">
          <FileText size={16} className="text-indigo-500" /> Loan Details
        </h3>

        <Field label="Loan Amount (₹)" error={errors.loan_amount?.message}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="10000"
              {...register('loan_amount', { valueAsNumber: true })}
              className={cn(inputBaseClasses, "pl-9")}
            />
          </div>
        </Field>

        <Field
          label="Interest Amount (₹)"
          error={errors.interest?.message}
          hint="Total interest to be added on top of loan"
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="2000"
              {...register('interest', { valueAsNumber: true })}
              className={cn(inputBaseClasses, "pl-9")}
            />
          </div>
        </Field>

        <Field
          label="Duration (Days)"
          error={errors.duration_days?.message}
          hint="Default is 100 days"
        >
          <input
            type="number"
            inputMode="numeric"
            placeholder="100"
            {...register('duration_days', { valueAsNumber: true })}
            className={inputBaseClasses}
          />
        </Field>

        <Field label="Start Date" error={errors.start_date?.message}>
          <input
            type="date"
            {...register('start_date')}
            className={inputBaseClasses}
            max={today()}
          />
        </Field>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-5">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2">
          <AlignLeft size={16} className="text-indigo-500" /> Additional Notes
        </h3>
        <Field label="Notes (Optional)" error={errors.notes?.message}>
          <textarea
            placeholder="Any specific agreements, references, or context..."
            {...register('notes')}
            rows={3}
            className={cn(inputBaseClasses, "resize-none py-4")}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'w-full py-4 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-sm',
          isPending
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-200'
        )}
      >
        {isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
            Adding Customer...
          </>
        ) : (
          <>
            <UserPlus size={20} />
            Create Customer Profile
          </>
        )}
      </button>
    </form>
  )
}