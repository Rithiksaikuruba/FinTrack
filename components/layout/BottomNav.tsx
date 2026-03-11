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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 bottom-safe">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[60px] py-3 px-2 transition-all duration-150',
                isActive
                  ? 'text-blue-900'
                  : 'text-slate-400 active:text-slate-600'
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(
                  'transition-transform duration-150',
                  isActive && 'scale-110'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-wide uppercase',
                  isActive ? 'text-blue-900' : 'text-slate-400'
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-blue-900 rounded-b-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
