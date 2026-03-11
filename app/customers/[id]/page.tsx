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
  Wallet,
  Zap
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
        <div className="p-6 max-w-lg mx-auto w-full space-y-5">
          <div className="h-40 bg-slate-100 animate-pulse rounded-3xl" />
          <div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
          <div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
        </div>
      </AppLayout>
    )
  }

  if (!customer) {
    return (
      <AppLayout>
        <PageHeader title="Not Found" backHref="/customers" />
        <div className="p-10 flex flex-col items-center justify-center text-center mt-10">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <X size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Customer not found</h2>
          <p className="text-slate-500 text-sm mt-1">The customer you are looking for does not exist or was removed.</p>
        </div>
      </AppLayout>
    )
  }

  const progress = calculateProgress(customer.paid_amount, customer.total_amount)
  const isCompleted = customer.status === 'completed'

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 pb-24">
        <PageHeader
          title={customer.name}
          subtitle={customer.phone}
          backHref="/customers"
          action={
            !isCompleted && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold px-4 py-2 rounded-xl transition-colors"
              >
                <PlusCircle size={16} />
                Pay
              </button>
            )
          }
        />

        <div className="p-6 max-w-lg mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* ── PROFILE CARD ─────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Status banner */}
            <div
              className={cn(
                'px-5 py-3 flex items-center gap-2 border-b border-slate-100',
                isCompleted ? 'bg-emerald-50' : 'bg-indigo-50/50'
              )}
            >
              {isCompleted ? (
                <CheckCircle size={16} className="text-emerald-600" />
              ) : (
                <TrendingUp size={16} className="text-indigo-600" />
              )}
              <span
                className={cn(
                  'text-xs font-bold uppercase tracking-wider',
                  isCompleted ? 'text-emerald-700' : 'text-indigo-700'
                )}
              >
                {isCompleted ? 'Loan Completed' : 'Active Loan'}
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4 mb-6">
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold flex-shrink-0 shadow-sm',
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  )}
                >
                  {customer.name.charAt(0)}
                </div>
                <div className="pt-1">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{customer.name}</h2>
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1 font-medium">
                    <Phone size={14} className="text-slate-400" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.address && (
                    <div className="flex items-start gap-1.5 text-slate-500 text-sm mt-1 font-medium">
                      <MapPin size={14} className="text-slate-400 mt-0.5" />
                      <span className="leading-snug">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Loan info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Loan Amount</p>
                  <p className="font-bold text-slate-900">{formatCurrency(customer.loan_amount)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Amount</p>
                  <p className="font-bold text-indigo-600">{formatCurrency(customer.total_amount)}</p>
                </div>
                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Paid</p>
                  <p className="font-bold text-emerald-700">{formatCurrency(customer.paid_amount)}</p>
                </div>
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50">
                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-1">Pending</p>
                  <p className="font-bold text-rose-700">{formatCurrency(customer.pending_amount)}</p>
                </div>
                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Daily Amount</p>
                  <p className="font-bold text-amber-700">{formatCurrency(customer.daily_amount)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1 uppercase tracking-wide">
                    <Calendar size={12} />
                    Started
                  </p>
                  <p className="font-bold text-slate-900 text-sm">
                    {formatDate(customer.start_date)}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    {isCompleted ? 'Completed!' : `${customer.remaining_days} days remaining`}
                  </span>
                  <span className="font-bold text-slate-900">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={cn(
                      'h-2.5 rounded-full transition-all duration-1000 ease-out',
                      isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-200 py-4 px-4 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all"
            >
              <PlusCircle size={20} />
              Record Payment
            </button>
          )}

          {/* ── PAYMENT HISTORY ───────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Payment History
                <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {payments.length}
                </span>
              </h3>
            </div>

            {paymentsLoading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Wallet className="text-slate-300" size={24} />
                </div>
                <p className="text-slate-500 text-sm font-medium">No payments recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 p-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 px-3 py-3 hover:bg-slate-50 rounded-xl transition-colors group"
                  >
                    {/* Payment Method Badge */}
                    <div
                      className={cn(
                        'flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 w-20',
                        p.method === 'cash'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      )}
                    >
                      {p.method === 'cash' ? (
                        <>₹ Cash</>
                      ) : (
                        <><Zap size={12} className="fill-blue-700" /> UPI</>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(p.amount)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 font-medium">{formatDate(p.date)}</p>
                        {p.notes && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <p className="text-xs text-slate-400 truncate">{p.notes}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm('Delete this payment?')) {
                          deletePayment(p.id)
                        }
                      }}
                      className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Delete payment"
                    >
                      <Trash2 size={16} />
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-0"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPaymentModal(false)
            }}
          >
            <div className="w-full max-w-md bg-white rounded-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                <h3 className="font-extrabold text-slate-900 text-lg">Record Payment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <PaymentForm
                  preselectedCustomer={customer}
                  onSuccess={() => setShowPaymentModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}