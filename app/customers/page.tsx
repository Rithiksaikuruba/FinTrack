'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CustomerCard, CustomerCardSkeleton } from '@/components/customers/CustomerCard'
import { useCustomers } from '@/hooks/useCustomers'
import type { CustomerFilters } from '@/types'
import { Search, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
] as const

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CustomerFilters['status']>('all')

  const filters: CustomerFilters = {
    search: search.length >= 2 ? search : undefined,
    status,
  }

  const { data: customers = [], isLoading } = useCustomers(filters)

  return (
    <AppLayout>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} found`}
        action={
          <Link
            href="/add-customer"
            className="flex items-center gap-1.5 bg-amber-400 text-slate-900 text-sm font-bold px-3 py-2 rounded-xl"
          >
            <UserPlus size={15} />
            Add
          </Link>
        }
      />

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 sticky top-[60px] z-30">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-900 outline-none transition-colors bg-slate-50"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mt-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value as CustomerFilters['status'])}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                status === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <div className="p-4 space-y-3">
        {isLoading && (
          <>
            <CustomerCardSkeleton />
            <CustomerCardSkeleton />
            <CustomerCardSkeleton />
          </>
        )}

        {!isLoading && customers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-semibold">No customers found</p>
            <p className="text-slate-400 text-sm mt-1">
              {search ? 'Try a different search' : 'Add your first customer'}
            </p>
            {!search && (
              <Link
                href="/add-customer"
                className="inline-flex items-center gap-2 mt-4 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
              >
                <UserPlus size={16} />
                Add Customer
              </Link>
            )}
          </div>
        )}

        {customers.map((c) => (
          <CustomerCard key={c.id} customer={c} />
        ))}
      </div>
    </AppLayout>
  )
}
