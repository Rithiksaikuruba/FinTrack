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
  ChevronDown,
  X,
  Calendar,
  Banknote,
  Smartphone,
  Wallet,
} from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function PaymentsContent() {
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(today())
  const [showForm, setShowForm] = useState(searchParams.get('action') === 'add')
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
      <PageHeader
        title="Payments"
        subtitle={dayjs(selectedDate).format('DD MMM YYYY')}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="w-9 h-9 flex items-center justify-center bg-white/10 text-white rounded-xl"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-amber-400 text-slate-900 text-sm font-bold px-3 py-2 rounded-xl"
            >
              <PlusCircle size={15} />
              Add
            </button>
          </div>
        }
      />

      {/* Date selector */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-[60px] z-30">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today()}
              className="w-full h-11 pl-9 pr-4 rounded-xl border-2 border-slate-200 text-sm font-semibold focus:border-blue-900 outline-none"
            />
          </div>
          <button
            onClick={() => setSelectedDate(today())}
            className={cn(
              'px-3 py-2 rounded-xl text-xs font-bold transition-all',
              isToday ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            Today
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {totals && (
        <div className="px-4 py-3 grid grid-cols-3 gap-3 bg-slate-50 border-b border-slate-200">
          <div className="text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Banknote size={11} /> Cash
            </p>
            <p className="font-bold text-emerald-700 text-sm">
              {formatCurrency(totals.cash_total)}
            </p>
          </div>
          <div className="text-center border-x border-slate-200">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Smartphone size={11} /> UPI
            </p>
            <p className="font-bold text-blue-700 text-sm">
              {formatCurrency(totals.upi_total)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Wallet size={11} /> Total
            </p>
            <p className="font-bold text-slate-900 text-sm">
              {formatCurrency(totals.grand_total)}
            </p>
          </div>
        </div>
      )}

      {/* Payments list */}
      <div className="p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">
              {payments.length} Payment{payments.length !== 1 ? 's' : ''}
            </h2>
            <span className="text-xs text-slate-500">
              {formatDate(selectedDate)}
            </span>
          </div>

          {isLoading && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 shimmer rounded" />
              ))}
            </div>
          )}

          {!isLoading && payments.length === 0 && (
            <div className="py-12 text-center">
              <Wallet size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold text-sm">
                No payments on this date
              </p>
              {isToday && (
                <button
                  onClick={() => setShowForm(true)}
                  className="text-blue-900 text-sm font-bold mt-2"
                >
                  Record first payment →
                </button>
              )}
            </div>
          )}

          <div className="px-4">
            {payments.map((p) => (
              <PaymentRow key={p.id} payment={p} showDelete />
            ))}
          </div>
        </div>

        {/* Recent dates */}
        {recentDates.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              Recent Days
            </h3>
            <div className="space-y-2">
              {recentDates.slice(0, 7).map((d: any) => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left',
                    selectedDate === d.date
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  )}
                >
                  <span className="font-semibold text-sm">{formatDate(d.date)}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={selectedDate === d.date ? 'text-emerald-400' : 'text-emerald-600'}>
                      Cash {formatCurrency(d.cash_total)}
                    </span>
                    <span className={selectedDate === d.date ? 'text-blue-300' : 'text-blue-600'}>
                      UPI {formatCurrency(d.upi_total)}
                    </span>
                    <span className={cn('font-bold', selectedDate === d.date ? 'text-amber-400' : 'text-slate-900')}>
                      {formatCurrency(d.grand_total)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Payment Drawer */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false)
          }}
        >
          <div className="w-full bg-white rounded-t-3xl overflow-hidden animate-slide-up max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-bold text-slate-900 text-lg">Record Payment</h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <PaymentForm onSuccess={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <PaymentsContent />
    </Suspense>
  )
}
