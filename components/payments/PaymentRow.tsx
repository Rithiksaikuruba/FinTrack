'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import type { PaymentWithCustomer } from '@/types'
import { Trash2, Banknote, Zap } from 'lucide-react'
import { useDeletePayment } from '@/hooks/usePayments'
import { cn } from '@/lib/utils'

interface PaymentRowProps {
  payment: PaymentWithCustomer
  showCustomer?: boolean
  showDelete?: boolean
}

export function PaymentRow({
  payment,
  showCustomer = true,
  showDelete = false,
}: PaymentRowProps) {
  const { mutate: deletePayment, isPending } = useDeletePayment()

  const handleDelete = () => {
    if (window.confirm('Delete this payment?')) {
      deletePayment(payment.id)
    }
  }

  return (
    <div className="group flex items-center gap-3 sm:gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors animate-in fade-in duration-300">
      
      {/* Payment Method Badge */}
      <div
        className={cn(
          'flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 w-24',
          payment.method === 'cash'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-blue-50 text-blue-700'
        )}
      >
        {payment.method === 'cash' ? (
          <><Banknote size={14} className="text-emerald-600" /> Cash</>
        ) : (
          <><Zap size={14} className="fill-blue-600 text-blue-600" /> UPI</>
        )}
      </div>

      {/* Primary Info (With Customer) */}
      {showCustomer && (
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900 truncate">
            {payment.customers?.name || 'Unknown'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs font-medium text-slate-500">
              {formatDate(payment.date)}
            </p>
            {payment.notes && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                <p className="text-xs font-medium text-slate-400 truncate">
                  {payment.notes}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Primary Info (Without Customer - e.g. Customer Detail Page) */}
      {!showCustomer && (
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900">
            {formatDate(payment.date)}
          </p>
          {payment.notes && (
            <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
              {payment.notes}
            </p>
          )}
        </div>
      )}

      {/* Amount & Due */}
      <div className="text-right flex-shrink-0">
        <p className="font-extrabold text-slate-900">
          {formatCurrency(payment.amount)}
        </p>
        {payment.customers?.daily_amount && (
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">
            due {formatCurrency(payment.customers.daily_amount)}
          </p>
        )}
      </div>

      {/* Delete Action */}
      {showDelete && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50 flex-shrink-0 ml-1"
          aria-label="Delete payment"
        >
          {isPending ? (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      )}
    </div>
  )
}