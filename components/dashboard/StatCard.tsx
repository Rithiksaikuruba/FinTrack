import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: 'green' | 'blue' | 'amber' | 'rose' | 'primary'
  subValue?: string
  subLabel?: string
  className?: string
}

// Mapped to the new Indigo & Slate color palette
const colorMap = {
  green: {
    card: 'border-t-emerald-500',
    icon: 'bg-emerald-50 text-emerald-600',
    value: 'text-emerald-700',
  },
  blue: {
    card: 'border-t-blue-500',
    icon: 'bg-blue-50 text-blue-600',
    value: 'text-blue-700',
  },
  amber: {
    card: 'border-t-amber-500',
    icon: 'bg-amber-50 text-amber-600',
    value: 'text-amber-700',
  },
  rose: {
    card: 'border-t-rose-500',
    icon: 'bg-rose-50 text-rose-600',
    value: 'text-rose-700',
  },
  primary: {
    card: 'border-t-indigo-600',
    icon: 'bg-indigo-100 text-indigo-700',
    value: 'text-slate-900', // Keep primary text dark for readability
  },
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subValue,
  subLabel,
  className,
}: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div 
      className={cn(
        'bg-white rounded-2xl border border-slate-100 p-5 shadow-sm border-t-[3px] transition-all hover:shadow-md',
        colors.card, 
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            {label}
          </p>
          <p className={cn('text-2xl font-extrabold tracking-tight', colors.value)}>
            {value}
          </p>
          {subValue && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {subValue}
              </span>
              {subLabel && <span className="text-slate-500 font-medium">{subLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn('flex-shrink-0 rounded-xl p-2.5 shadow-sm', colors.icon)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  )
}

// Skeleton loader matched perfectly to the new card dimensions
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm border-t-[3px] border-t-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-3 w-20 bg-slate-100 animate-pulse rounded-md mb-3" />
          <div className="h-7 w-24 bg-slate-100 animate-pulse rounded-lg" />
          {/* Optional sub-value skeleton box so it doesn't jump when loaded */}
          <div className="h-4 w-32 bg-slate-50 animate-pulse rounded-md mt-3" />
        </div>
        <div className="w-10 h-10 bg-slate-100 animate-pulse rounded-xl flex-shrink-0" />
      </div>
    </div>
  )
}