import Link from 'next/link'
import { formatCurrency, calculateProgress } from '@/lib/utils'
import type { CustomerSummary } from '@/types'
import { Phone, ChevronRight, TrendingUp, CheckCircle } from 'lucide-react'
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
      className="block bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-100 hover:shadow-md transition-all duration-200 group relative overflow-hidden shadow-sm"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg flex-shrink-0 shadow-sm',
            isCompleted 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-indigo-100 text-indigo-700'
          )}
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>

        {/* Info Container */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-extrabold text-slate-900 truncate text-base group-hover:text-indigo-700 transition-colors">
              {customer.name}
            </h3>
            
            {/* Status Badge */}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 flex-shrink-0',
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-indigo-50 text-indigo-700'
                )}
              >
                {isCompleted ? (
                  <><CheckCircle size={10} strokeWidth={3} /> Done</>
                ) : (
                  <><TrendingUp size={10} strokeWidth={3} /> Active</>
                )}
              </span>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors transform group-hover:translate-x-0.5" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-4">
            <Phone size={12} className="text-slate-400" />
            <span>{customer.phone}</span>
          </div>

          {/* Progress Section */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500 font-medium">
                Paid: <span className="font-bold text-slate-900">{formatCurrency(customer.paid_amount)}</span>
              </span>
              <span className="text-slate-500 font-medium">
                Pending:{' '}
                <span
                  className={cn(
                    'font-bold',
                    customer.pending_amount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  )}
                >
                  {formatCurrency(customer.pending_amount)}
                </span>
              </span>
            </div>
            
            {/* Tailwind Progress Bar */}
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden relative">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-1000 ease-out',
                  isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-[11px] font-medium mt-1.5 text-slate-400">
              <span className={cn(isCompleted && "text-emerald-600 font-bold")}>
                {Math.round(progress)}% paid
              </span>
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

// Skeleton matched to the new rounded-2xl padding and sizing
export function CustomerCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Avatar Skeleton */}
        <div className="w-12 h-12 bg-slate-100 animate-pulse rounded-xl flex-shrink-0" />
        
        {/* Content Skeleton */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <div className="h-5 w-32 bg-slate-100 animate-pulse rounded-md" />
            <div className="h-5 w-16 bg-slate-100 animate-pulse rounded-md" />
          </div>
          <div className="h-3 w-24 bg-slate-100 animate-pulse rounded-md mb-5" />
          
          {/* Progress Skeleton */}
          <div className="flex justify-between mb-2">
            <div className="h-3 w-20 bg-slate-100 animate-pulse rounded-md" />
            <div className="h-3 w-20 bg-slate-100 animate-pulse rounded-md" />
          </div>
          <div className="h-2 w-full bg-slate-100 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  )
}