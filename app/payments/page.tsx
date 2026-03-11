'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaymentForm } from '@/components/payments/PaymentForm'
import { PaymentRow } from '@/components/payments/PaymentRow'
import { usePayments, useDailyTotals, useRecentCollectionDates } from '@/hooks/usePayments'
import { formatCurrency, today, formatDate } from '@/lib/utils'
import { generateDailyPDFReport } from '@/services/pdfReport'
import {
  PlusCircle,
  Download,
  X,
  Calendar,
  Banknote,
  Smartphone,
  Wallet,
  Zap,
} from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function PaymentsContent() {
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(today())
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'add')
  // Keeping activeTab as requested to not change underlying state logic
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today')

  const { data: payments = [], isLoading } = usePayments({ date: selectedDate })
  const { data: totals } = useDailyTotals(selectedDate)
  const { data: recentDates = [] } = useRecentCollectionDates()

  const handleDownloadPDF = async () => {
    if (payments.length === 0) {
      toast.error('No payments for this date')
      return
    }
    try {
      toast.loading('Generating PDF...')
      await generateDailyPDFReport(selectedDate, payments)
      toast.dismiss()
      toast.success('PDF downloaded!')
    } catch {
      toast.dismiss()
      toast.error('PDF generation failed')
    }
  }

  const isToday = selectedDate === today()

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 pb-24">
        <PageHeader
          title="Payments"
          subtitle={dayjs(selectedDate).format('DD MMM YYYY')}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="w-10 h-10 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors shadow-sm"
                aria-label="Download PDF"
              >
                <Download size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-all"
              >
                <PlusCircle size={18} />
                Add
              </button>
            </div>
          }
        />

        {/* ── DATE SELECTOR (Sticky) ────────────────────── */}
        <div className="px-6 py-4 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-30">
          <div className="max-w-lg mx-auto w-full flex items-center gap-3">
            <div className="relative flex-1">
              <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={today()}
                className="w-full h-12 pl-12 pr-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setSelectedDate(today())}
              className={cn(
                'px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm',
                isToday
                  ? 'bg-indigo-600 text-white shadow-indigo-200'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              )}
            >
              Today
            </button>
          </div>
        </div>

        <div className="p-6 max-w-lg mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* ── SUMMARY BAR ───────────────────────────────── */}
          {totals && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5 mb-1">
                  <Banknote size={14} className="text-emerald-500" /> Cash
                </p>
                <p className="font-extrabold text-emerald-600 text-lg">
                  {formatCurrency(totals.cash_total)}
                </p>
              </div>
              <div className="w-px h-12 bg-slate-100" />
              <div className="flex-1 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5 mb-1">
                  <Zap size={14} className="text-blue-500" /> UPI
                </p>
                <p className="font-extrabold text-blue-600 text-lg">
                  {formatCurrency(totals.upi_total)}
                </p>
              </div>
              <div className="w-px h-12 bg-slate-100" />
              <div className="flex-1 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5 mb-1">
                  <Wallet size={14} className="text-indigo-500" /> Total
                </p>
                <p className="font-extrabold text-indigo-700 text-lg">
                  {formatCurrency(totals.grand_total)}
                </p>
              </div>
            </div>
          )}

          {/* ── PAYMENTS LIST ─────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Recorded Payments
                <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {payments.length}
                </span>
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {formatDate(selectedDate)}
              </span>
            </div>

            {isLoading && (
              <div className="p-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
                ))}
              </div>
            )}

            {!isLoading && payments.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Wallet size={28} className="text-slate-300" />
                </div>
                <p className="text-slate-900 font-bold text-base mb-1">
                  No payments on this date
                </p>
                <p className="text-slate-500 font-medium text-sm">
                  Check another date or record a new one.
                </p>
                {isToday && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-bold mt-4 flex items-center gap-1 transition-colors"
                  >
                    Record first payment <PlusCircle size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="px-3 py-2 divide-y divide-slate-50">
              {payments.map((p) => (
                <div key={p.id} className="py-1">
                  <PaymentRow payment={p} showDelete />
                </div>
              ))}
            </div>
          </div>

          {/* ── RECENT DATES ──────────────────────────────── */}
          {recentDates.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-1">
                Recent Collections
              </h3>
              <div className="space-y-3">
                {recentDates.slice(0, 7).map((d: any) => {
                  const isSelected = selectedDate === d.date;
                  return (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDate(d.date)}
                      className={cn(
                        'w-full flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left gap-2 sm:gap-0 group',
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30'
                      )}
                    >
                      <span className={cn('font-bold text-sm', isSelected ? 'text-white' : 'text-slate-900')}>
                        {formatDate(d.date)}
                      </span>
                      <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium">
                        <span className={isSelected ? 'text-indigo-200' : 'text-slate-500'}>
                          <span className={isSelected ? 'text-emerald-300' : 'text-emerald-600'}>Cash</span> {formatCurrency(d.cash_total)}
                        </span>
                        <span className={isSelected ? 'text-indigo-200' : 'text-slate-500'}>
                          <span className={isSelected ? 'text-blue-300' : 'text-blue-600'}>UPI</span> {formatCurrency(d.upi_total)}
                        </span>
                        <span className={cn('font-bold ml-1', isSelected ? 'text-white' : 'text-indigo-700')}>
                          {formatCurrency(d.grand_total)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── ADD PAYMENT MODAL ─────────────────────────── */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-0"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false)
            }}
          >
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                <h3 className="font-extrabold text-slate-900 text-lg">Record Payment</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <PaymentForm onSuccess={() => setShowForm(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  )
}