'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatCard, StatCardSkeleton } from '@/components/dashboard/StatCard'
import { MissedPayments } from '@/components/dashboard/MissedPayments'
import { PaymentRow } from '@/components/payments/PaymentRow'
import { useDashboardStats } from '@/hooks/usePayments'
import { usePayments } from '@/hooks/usePayments'
import { formatCurrency, today, formatDate } from '@/lib/utils'
import { generateDailyPDFReport } from '@/services/pdfReport'
import {
  Wallet,
  Banknote,
  Smartphone,
  Users,
  Clock,
  Target,
  Download,
  ChevronDown,
  TrendingUp,
} from 'lucide-react'
import dayjs from 'dayjs'
import Link from 'next/link'
import { toast } from 'sonner'

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(today())
  const [activeTab, setActiveTab] = useState<'payments' | 'status'>('payments')

  const { data: stats, isLoading: statsLoading } = useDashboardStats(selectedDate)
  const { data: todayPayments = [], isLoading: paymentsLoading } = usePayments({
    date: selectedDate,
  })

  const isToday = selectedDate === today()

  const handleDownloadPDF = async () => {
    if (todayPayments.length === 0) {
      toast.error('No payments found for this date')
      return
    }
    try {
      toast.loading('Generating PDF...')
      await generateDailyPDFReport(selectedDate, todayPayments)
      toast.dismiss()
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.dismiss()
      toast.error('PDF generation failed')
    }
  }

  return (
    <AppLayout>
      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="bg-slate-900 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-amber-400" />
              <span className="text-amber-400 font-bold text-sm tracking-wide">
                FinTrack
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isToday ? "Today's Summary" : formatDate(selectedDate)}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {dayjs(selectedDate).format('dddd, DD MMMM YYYY')}
            </p>
          </div>

          {/* Date picker + PDF */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={today()}
                className="opacity-0 absolute inset-0 w-full cursor-pointer"
              />
              <div className="flex items-center gap-1 bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl">
                <span>{dayjs(selectedDate).format('DD/MM')}</span>
                <ChevronDown size={14} />
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center w-9 h-9 bg-amber-400 text-slate-900 rounded-xl"
            >
              <Download size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Expected vs collected */}
        {!statsLoading && stats && (
          <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Expected Today</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(stats.expected_today)}
              </p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-xs text-slate-400">Collected</p>
              <p className="text-lg font-bold text-emerald-400">
                {formatCurrency(stats.total_collected_today)}
              </p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-xs text-slate-400">Collection %</p>
              <p className="text-lg font-bold text-amber-400">
                {stats.expected_today > 0
                  ? Math.round(
                      (stats.total_collected_today / stats.expected_today) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        )}
      </header>

      {/* ── STAT CARDS ──────────────────────────────────── */}
      <div className="px-4 -mt-0 pt-4 grid grid-cols-2 gap-3">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard
              label="Cash Today"
              value={formatCurrency(stats.cash_today)}
              icon={Banknote}
              color="green"
            />
            <StatCard
              label="UPI Today"
              value={formatCurrency(stats.upi_today)}
              icon={Smartphone}
              color="blue"
            />
            <StatCard
              label="Customers Paid"
              value={String(stats.customers_paid_today)}
              icon={Users}
              color="primary"
              subValue={`${stats.total_active_customers} total`}
              subLabel="active"
            />
            <StatCard
              label="Pending"
              value={String(stats.customers_pending_today)}
              icon={Clock}
              color="rose"
              subValue={`${stats.total_active_customers} active`}
              subLabel="customers"
            />
          </>
        ) : null}
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────── */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/payments?action=add"
          className="btn-action bg-slate-900 text-white shadow-md"
        >
          <Wallet size={18} />
          Add Payment
        </Link>
        <Link
          href="/add-customer"
          className="btn-action bg-white text-slate-900 border border-slate-200 shadow-sm"
        >
          <Users size={18} />
          Add Customer
        </Link>
      </div>

      {/* ── TABS ─────────────────────────────────────────── */}
      <div className="px-4 mt-6">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['payments', 'status'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {tab === 'payments' ? 'Payments' : 'Status'}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <div className="px-4 mt-4 mb-4">
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm">
                Payments ({todayPayments.length})
              </h2>
              <span className="text-xs text-slate-500">
                Total:{' '}
                <span className="font-bold text-slate-900">
                  {formatCurrency(
                    todayPayments.reduce((s, p) => s + p.amount, 0)
                  )}
                </span>
              </span>
            </div>

            {paymentsLoading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 shimmer rounded" />
                ))}
              </div>
            )}

            {!paymentsLoading && todayPayments.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-slate-400 text-sm">No payments yet</p>
                <Link
                  href="/payments?action=add"
                  className="text-blue-900 text-sm font-semibold mt-2 block"
                >
                  Record a payment →
                </Link>
              </div>
            )}

            <div className="px-4">
              {todayPayments.map((p) => (
                <PaymentRow key={p.id} payment={p} showDelete />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="font-bold text-slate-900 text-sm mb-4">
              Payment Status
            </h2>
            <MissedPayments date={selectedDate} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
