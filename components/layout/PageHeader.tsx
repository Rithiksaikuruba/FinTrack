'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
  className,
}: PageHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-slate-900 text-white px-4 pt-safe',
        className
      )}
    >
      <div className="flex items-center gap-3 py-4">
        {backHref && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 active:bg-white/20 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  )
}
