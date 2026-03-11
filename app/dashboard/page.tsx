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
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* ── HEADER ──────────────────────────────────────── */}
        <header className="bg-white px-6 pt-10 pb-8 rounded-b-3xl shadow-sm border-b border-slate-100">
          <div className="flex flex-col gap-6">
            {/* Top Row: Title & Actions */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <TrendingUp size={16} className="text-indigo-600" strokeWidth={3} />
                  </div>
                  <span className="text-indigo-600 font-extrabold text-xs tracking-wider uppercase">
                    FinTrack
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {isToday ? "Today's Summary" : formatDate(selectedDate)}
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-1">
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
                    className="opacity-0 absolute inset-0 w-full cursor-pointer z-10"
                  />
                  <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                    <span>{dayjs(selectedDate).format('DD/MM')}</span>
                    <ChevronDown size={16} className="text-slate-500" />
                  </div>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center w-10 h-10 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors"
                  aria-label="Download PDF"
                >
                  <Download size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Expected vs Collected Card */}
            {!statsLoading && stats && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Expected</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(stats.expected_today)}
                  </p>
                </div>
                <div className="h-12 w-px bg-slate-200 mx-4" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Collected</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(stats.total_collected_today)}
                  </p>
                </div>
                <div className="h-12 w-px bg-slate-200 mx-4" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Progress</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {stats.expected_today > 0
                      ? Math.round((stats.total_collected_today / stats.expected_today) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="px-6 mt-6 max-w-lg mx-auto w-full">
          {/* ── STAT CARDS ──────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
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
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Link
              href="/payments?action=add"
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all shadow-sm shadow-indigo-200"
            >
              <Wallet size={18} />
              Add Payment
            </Link>
            <Link
              href="/add-customer"
              className="bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold transition-all shadow-sm"
            >
              <Users size={18} className="text-slate-400" />
              Add Customer
            </Link>
          </div>

          {/* ── TABS ─────────────────────────────────────────── */}
          <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl mb-6">
            {(['payments', 'status'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'payments' ? 'Payments' : 'Status'}
              </button>
            ))}
          </div>

          {/* ── CONTENT ─────────────────────────────────────── */}
          <div>
            {activeTab === 'payments' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    Recent Payments
                    <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                      {todayPayments.length}
                    </span>
                  </h2>
                  <span className="text-xs font-medium text-slate-500">
                    Total:{' '}
                    <span className="font-bold text-indigo-600 text-sm ml-1">
                      {formatCurrency(todayPayments.reduce((s, p) => s + p.amount, 0))}
                    </span>
                  </span>
                </div>

                {paymentsLoading && (
                  <div className="p-5 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
                    ))}
                  </div>
                )}

                {!paymentsLoading && todayPayments.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mb-3">
                      <Wallet className="text-slate-300" size={28} />
                    </div>
                    <p className="text-slate-500 font-medium text-sm">No payments recorded yet</p>
                    <Link
                      href="/payments?action=add"
                      className="text-indigo-600 text-sm font-bold mt-2 hover:text-indigo-700 transition-colors"
                    >
                      Record your first payment →
                    </Link>
                  </div>
                )}

                <div className="px-3 py-2 divide-y divide-slate-50">
                  {todayPayments.map((p) => (
                    <div key={p.id} className="py-1">
                      <PaymentRow payment={p} showDelete />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'status' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-bold text-slate-900 text-base mb-5 border-b border-slate-100 pb-3">
                  Payment Status
                </h2>
                <MissedPayments date={selectedDate} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}