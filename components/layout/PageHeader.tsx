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
        'sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/80 shadow-sm pt-safe transition-all',
        className
      )}
    >
      <div className="max-w-lg mx-auto w-full px-6 py-4 flex items-center gap-4">
        {/* Back Button */}
        {backHref && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 transition-all border border-slate-200/60 flex-shrink-0 shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        )}
        
        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-medium text-slate-500 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Action Area */}
        {action && (
          <div className="flex-shrink-0 ml-2">
            {action}
          </div>
        )}
      </div>
    </header>
  )
}