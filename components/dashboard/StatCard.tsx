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

const colorMap = {
  green: {
    card: 'stat-card-green',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
  },
  blue: {
    card: 'stat-card-blue',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
  },
  amber: {
    card: 'stat-card-amber',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
  },
  rose: {
    card: 'stat-card-rose',
    icon: 'bg-rose-100 text-rose-600',
    value: 'text-rose-700',
  },
  primary: {
    card: 'stat-card-primary',
    icon: 'bg-blue-950 text-blue-100',
    value: 'text-slate-900',
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
    <div className={cn('stat-card', colors.card, className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className={cn('text-2xl font-bold tracking-tight', colors.value)}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{subValue}</span>
              {subLabel && <span className="ml-1">{subLabel}</span>}
            </p>
          )}
        </div>
        <div className={cn('flex-shrink-0 rounded-xl p-2.5', colors.icon)}>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}

// Skeleton loader
export function StatCardSkeleton() {
  return (
    <div className="stat-card stat-card-primary">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="h-3 w-24 shimmer rounded mb-2" />
          <div className="h-8 w-32 shimmer rounded" />
        </div>
        <div className="w-10 h-10 shimmer rounded-xl" />
      </div>
    </div>
  )
}
