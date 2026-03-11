'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAddCustomer } from '@/hooks/useCustomers'
import type { AddCustomerForm } from '@/types'
import { calculateTotalAmount, calculateDailyAmount, today } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { UserPlus } from 'lucide-react'
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
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  )
}

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-4">
      {/* Calculation preview banner */}
      {totalAmount > 0 && (
        <div className="bg-slate-900 rounded-xl p-4 text-white animate-fade-in">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
            Loan Summary Preview
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-base font-bold text-amber-400">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Daily</p>
              <p className="text-base font-bold text-emerald-400">
                {formatCurrency(dailyAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Days</p>
              <p className="text-base font-bold text-blue-300">
                {durationDays || 100}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personal info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Customer Info
        </p>

        <Field label="Full Name" error={errors.name?.message}>
          <input
            type="text"
            placeholder="e.g. Rajesh Kumar"
            {...register('name')}
            className="mobile-input"
            autoCapitalize="words"
          />
        </Field>

        <Field label="Phone Number" error={errors.phone?.message}>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            {...register('phone')}
            className="mobile-input"
          />
        </Field>

        <Field label="Address (Optional)" error={errors.address?.message}>
          <input
            type="text"
            placeholder="Street, Area, City"
            {...register('address')}
            className="mobile-input"
          />
        </Field>
      </div>

      {/* Loan details */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loan Details
        </p>

        <Field
          label="Loan Amount (₹)"
          error={errors.loan_amount?.message}
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="10000"
              {...register('loan_amount', { valueAsNumber: true })}
              className="mobile-input pl-8"
            />
          </div>
        </Field>

        <Field
          label="Interest Amount (₹)"
          error={errors.interest?.message}
          hint="Total interest to be added on top of loan"
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="2000"
              {...register('interest', { valueAsNumber: true })}
              className="mobile-input pl-8"
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
            className="mobile-input"
          />
        </Field>

        <Field label="Start Date" error={errors.start_date?.message}>
          <input
            type="date"
            {...register('start_date')}
            className="mobile-input"
            max={today()}
          />
        </Field>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <Field label="Notes (Optional)" error={errors.notes?.message}>
          <textarea
            placeholder="Any additional notes..."
            {...register('notes')}
            rows={2}
            className="mobile-input resize-none py-3"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'btn-action w-full',
          isPending
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-slate-900 text-white shadow-lg'
        )}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Adding Customer...
          </span>
        ) : (
          <>
            <UserPlus size={20} />
            Add Customer
          </>
        )}
      </button>
    </form>
  )
}
