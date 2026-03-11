import Link from 'next/link'
import { formatCurrency, calculateProgress } from '@/lib/utils'
import type { CustomerSummary } from '@/types'
import { Phone, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomerCardProps {
  customer: CustomerSummary
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const progress = calculateProgress(customer.paid_amount, customer.total_amount)
  const isCompleted = customer.status === 'completed'

  return (
    <Link
      href={`/customers/${customer.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-4 active:bg-slate-50 transition-colors shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0',
            isCompleted ? 'bg-emerald-500' : 'bg-slate-900'
          )}
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 truncate">{customer.name}</h3>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                )}
              >
                {isCompleted ? '✓ Done' : 'Active'}
              </span>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <Phone size={11} />
            <span>{customer.phone}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">
                Paid: <span className="font-semibold text-slate-700">{formatCurrency(customer.paid_amount)}</span>
              </span>
              <span className="text-slate-500">
                Pending:{' '}
                <span
                  className={cn(
                    'font-semibold',
                    customer.pending_amount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  )}
                >
                  {formatCurrency(customer.pending_amount)}
                </span>
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={cn(
                  'progress-bar-fill',
                  isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1 text-slate-400">
              <span>{Math.round(progress)}% paid</span>
              {!isCompleted && (
                <span>{customer.remaining_days} days left</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Skeleton
export function CustomerCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex gap-3">
        <div className="w-11 h-11 shimmer rounded-full" />
        <div className="flex-1">
          <div className="h-4 w-32 shimmer rounded mb-2" />
          <div className="h-3 w-24 shimmer rounded mb-3" />
          <div className="h-2 shimmer rounded" />
        </div>
      </div>
    </div>
  )
}
