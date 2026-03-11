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
      <div className="min-h-screen bg-slate-50 pb-24">
        <PageHeader
          title="Customers"
          subtitle={`${customers.length} found`}
          action={
            <Link
              href="/add-customer"
              className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <UserPlus size={16} />
              Add
            </Link>
          }
        />

        {/* ── SEARCH & FILTERS (Sticky) ─────────────────── */}
        <div className="px-6 py-4 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-30">
          <div className="max-w-lg mx-auto w-full">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white placeholder:text-slate-400 text-slate-900 font-medium shadow-sm"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatus(tab.value as CustomerFilters['status'])}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-bold transition-all',
                    status === tab.value
                      ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CUSTOMER LIST ─────────────────────────────── */}
        <div className="p-6 max-w-lg mx-auto w-full space-y-4">
          {isLoading && (
            <>
              <CustomerCardSkeleton />
              <CustomerCardSkeleton />
              <CustomerCardSkeleton />
            </>
          )}

          {!isLoading && customers.length === 0 && (
            <div className="text-center py-16 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-100">
                <Users size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-900 font-bold text-lg">No customers found</p>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                {search ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
              </p>
              {!search && (
                <Link
                  href="/add-customer"
                  className="inline-flex items-center justify-center gap-2 mt-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-sm shadow-indigo-200 transition-all"
                >
                  <UserPlus size={18} />
                  Add Customer
                </Link>
              )}
            </div>
          )}

          {/* Render List */}
          <div className="space-y-3">
            {customers.map((c) => (
              <CustomerCard key={c.id} customer={c} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}