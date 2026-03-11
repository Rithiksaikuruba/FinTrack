'use client'

import { useMissedPayments } from '@/hooks/usePayments'
import { formatCurrency } from '@/lib/utils'
import { Phone, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { today } from '@/lib/utils'

interface MissedPaymentsProps {
  date?: string
}

const statusConfig = {
  paid: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  partial: { label: 'Partial', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  not_paid: { label: 'Not Paid', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
}

export function MissedPayments({ date = today() }: MissedPaymentsProps) {
  const { data: customers = [], isLoading } = useMissedPayments(date)

  const unpaid = customers.filter((c) => c.status === 'not_paid')
  const partial = customers.filter((c) => c.status === 'partial')
  const paid = customers.filter((c) => c.status === 'paid')

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 shimmer rounded-xl" />
        ))}
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p className="text-sm">No active customers</p>
      </div>
    )
  }

  const sorted = [...unpaid, ...partial, ...paid]

  return (
    <div className="space-y-2">
      {/* Summary pills */}
      <div className="flex gap-2 mb-4">
        {unpaid.length > 0 && (
          <span className="text-xs bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full font-semibold">
            {unpaid.length} not paid
          </span>
        )}
        {partial.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
            {partial.length} partial
          </span>
        )}
        {paid.length > 0 && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
            {paid.length} paid
          </span>
        )}
      </div>

      {sorted.map((c) => {
        const config = statusConfig[c.status]
        return (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 active:bg-slate-50 transition-colors"
          >
            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dot)} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 truncate">{c.name}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Phone size={10} />
                <span>{c.phone}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">
                Due: <span className="font-semibold text-slate-700">{formatCurrency(c.daily_amount)}</span>
              </p>
              {c.paid_today > 0 && (
                <p className="text-xs text-emerald-600 font-semibold">
                  Paid: {formatCurrency(c.paid_today)}
                </p>
              )}
            </div>
            <span className={cn('text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0', config.bg, config.text)}>
              {config.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
