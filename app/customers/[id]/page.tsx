'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { PaymentForm } from '@/components/payments/PaymentForm'
import { useCustomer } from '@/hooks/useCustomers'
import { useCustomerPayments, useDeletePayment } from '@/hooks/usePayments'
import {
  formatCurrency,
  formatDate,
  calculateProgress,
  formatDateShort,
} from '@/lib/utils'
import {
  Phone,
  MapPin,
  Calendar,
  PlusCircle,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const { data: customer, isLoading } = useCustomer(id)
  const { data: payments = [], isLoading: paymentsLoading } = useCustomerPayments(id)
  const { mutate: deletePayment } = useDeletePayment()

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Customer" backHref="/customers" />
        <div className="p-4 space-y-4">
          <div className="h-32 shimmer rounded-2xl" />
          <div className="h-48 shimmer rounded-2xl" />
          <div className="h-64 shimmer rounded-2xl" />
        </div>
      </AppLayout>
    )
  }

  if (!customer) {
    return (
      <AppLayout>
        <PageHeader title="Not Found" backHref="/customers" />
        <div className="p-8 text-center text-slate-500">Customer not found</div>
      </AppLayout>
    )
  }

  const progress = calculateProgress(customer.paid_amount, customer.total_amount)
  const isCompleted = customer.status === 'completed'

  return (
    <AppLayout>
      <PageHeader
        title={customer.name}
        subtitle={customer.phone}
        backHref="/customers"
        action={
          !isCompleted && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 bg-amber-400 text-slate-900 text-sm font-bold px-3 py-2 rounded-xl"
            >
              <PlusCircle size={15} />
              Pay
            </button>
          )
        }
      />

      <div className="p-4 space-y-4 page-enter">
        {/* ── PROFILE CARD ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Status banner */}
          <div
            className={cn(
              'px-4 py-2.5 flex items-center gap-2',
              isCompleted ? 'bg-emerald-500' : 'bg-slate-900'
            )}
          >
            {isCompleted ? (
              <CheckCircle size={16} className="text-white" />
            ) : (
              <TrendingUp size={16} className="text-amber-400" />
            )}
            <span className="text-white text-xs font-bold uppercase tracking-wide">
              {isCompleted ? 'Loan Completed' : 'Active Loan'}
            </span>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div
                className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0',
                  isCompleted ? 'bg-emerald-500' : 'bg-slate-900'
                )}
              >
                {customer.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-0.5">
                  <Phone size={13} />
                  <span>{customer.phone}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                    <MapPin size={12} />
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Loan info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Loan Amount</p>
                <p className="font-bold text-slate-900">{formatCurrency(customer.loan_amount)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Total Amount</p>
                <p className="font-bold text-amber-600">{formatCurrency(customer.total_amount)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-600">Paid</p>
                <p className="font-bold text-emerald-700">{formatCurrency(customer.paid_amount)}</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3">
                <p className="text-xs text-rose-600">Pending</p>
                <p className="font-bold text-rose-700">{formatCurrency(customer.pending_amount)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-600">Daily Amount</p>
                <p className="font-bold text-blue-700">{formatCurrency(customer.daily_amount)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar size={11} />
                  Started
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {formatDate(customer.start_date)}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock size={11} />
                  {isCompleted ? 'Completed!' : `${customer.remaining_days} days remaining`}
                </span>
                <span className="font-bold text-slate-700">{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={cn(
                    'progress-bar-fill',
                    isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── ADD PAYMENT BUTTON (if not completed) ─────── */}
        {!isCompleted && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn-action w-full bg-slate-900 text-white shadow-lg"
          >
            <PlusCircle size={20} />
            Record Payment
          </button>
        )}

        {/* ── PAYMENT HISTORY ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">
              Payment History ({payments.length})
            </h3>
          </div>

          {paymentsLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 shimmer rounded" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No payments yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {p.method === 'cash' ? (
                    <span className="method-cash flex-shrink-0">₹ Cash</span>
                  ) : (
                    <span className="method-upi flex-shrink-0">⚡ UPI</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(p.amount)}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(p.date)}</p>
                    {p.notes && (
                      <p className="text-xs text-slate-400 truncate">{p.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this payment?')) {
                        deletePayment(p.id)
                      }
                    }}
                    className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── PAYMENT MODAL ─────────────────────────────── */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPaymentModal(false)
          }}
        >
          <div className="w-full bg-white rounded-t-3xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-bold text-slate-900">Record Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <PaymentForm
                preselectedCustomer={customer}
                onSuccess={() => setShowPaymentModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
