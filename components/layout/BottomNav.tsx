'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  PlusCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/payments', icon: CreditCard, label: 'Payments' },
  { href: '/add-customer', icon: PlusCircle, label: 'Add' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 bottom-safe">
      <div className="max-w-lg mx-auto w-full flex items-center justify-around px-2 pt-2 pb-1.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          // Exact match or active sub-route logic
          const isActive = pathname === href || (pathname.startsWith(href + '/') && href !== '/')
          
          return (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-center justify-center gap-1 min-w-[64px] px-1 py-1 relative"
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active Indicator Pill */}
              <div
                className={cn(
                  'flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 ease-out',
                  isActive
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-slate-400 group-hover:text-slate-600 group-active:scale-95'
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    'transition-transform duration-300 ease-out',
                    isActive && 'scale-110'
                  )}
                />
              </div>
              
              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-bold tracking-wide transition-colors duration-200',
                  isActive ? 'text-indigo-700' : 'text-slate-500 group-hover:text-slate-700'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}