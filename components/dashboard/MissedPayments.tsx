'use client'

import { useMissedPayments } from '@/hooks/usePayments'
import { formatCurrency } from '@/lib/utils'
import { Phone, CheckCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { today } from '@/lib/utils'

interface MissedPaymentsProps {
  date?: string
}

const statusConfig = {
  paid: { 
    label: 'Paid', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-100',
    text: 'text-emerald-700', 
    dot: 'bg-emerald-500 shadow-emerald-200' 
  },
  partial: { 
    label: 'Partial', 
    bg: 'bg-amber-50', 
    border: 'border-amber-100',
    text: 'text-amber-700', 
    dot: 'bg-amber-500 shadow-amber-200' 
  },
  not_paid: { 
    label: 'Not Paid', 
    bg: 'bg-rose-50', 
    border: 'border-rose-100',
    text: 'text-rose-700', 
    dot: 'bg-rose-500 shadow-rose-200' 
  },
}

export function MissedPayments({ date = today() }: MissedPaymentsProps) {
  const { data: customers = [], isLoading } = useMissedPayments(date)

  const unpaid = customers.filter((c) => c.status === 'not_paid')
  const partial = customers.filter((c) => c.status === 'partial')
  const paid = customers.filter((c) => c.status === 'paid')

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-32 bg-slate-200 rounded-md" />
              <div className="h-3 w-20 bg-slate-200 rounded-md" />
            </div>
            <div className="h-6 w-16 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
          <Users className="text-slate-300" size={24} />
        </div>
        <p className="text-slate-900 font-bold text-sm">No active customers</p>
        <p className="text-slate-500 text-xs font-medium mt-1">There are no loans active on this date.</p>
      </div>
    )
  }

  const sorted = [...unpaid, ...partial, ...paid]

  return (
    <div className="space-y-4">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {unpaid.length > 0 && (
          <span className="text-xs bg-rose-50 border border-rose-100 text-rose-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {unpaid.length} Not Paid
          </span>
        )}
        {partial.length > 0 && (
          <span className="text-xs bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {partial.length} Partial
          </span>
        )}
        {paid.length > 0 && (
          <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
            <CheckCircle size={12} strokeWidth={3} />
            {paid.length} Paid
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {sorted.map((c) => {
          const config = statusConfig[c.status]
          return (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all group shadow-sm"
            >
              {/* Status Indicator Dot */}
              <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm', config.dot)} />
              
              {/* Customer Info */}
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                  {c.name}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-0.5">
                  <Phone size={12} className="text-slate-400" />
                  <span>{c.phone}</span>
                </div>
              </div>

              {/* Amounts & Badge */}
              <div className="flex items-center gap-4 text-right">
                <div className="hidden sm:block">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Due <span className="text-slate-700">{formatCurrency(c.daily_amount)}</span>
                  </p>
                  {c.paid_today > 0 && (
                    <p className="text-xs text-emerald-600 font-bold">
                      Paid: {formatCurrency(c.paid_today)}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <span 
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md flex-shrink-0 border', 
                    config.bg, 
                    config.text,
                    config.border
                  )}
                >
                  {config.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}