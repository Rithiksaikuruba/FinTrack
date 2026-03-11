'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import type { PaymentWithCustomer } from '@/types'
import { Trash2 } from 'lucide-react'
import { useDeletePayment } from '@/hooks/usePayments'

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
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 animate-fade-in">
      {/* Method badge */}
      <div className="flex-shrink-0">
        {payment.method === 'cash' ? (
          <span className="method-cash">₹ Cash</span>
        ) : (
          <span className="method-upi">⚡ UPI</span>
        )}
      </div>

      {/* Customer info */}
      {showCustomer && (
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 truncate">
            {payment.customers?.name || 'Unknown'}
          </p>
          <p className="text-xs text-slate-500">{formatDate(payment.date)}</p>
        </div>
      )}

      {!showCustomer && (
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">{formatDate(payment.date)}</p>
          {payment.notes && (
            <p className="text-xs text-slate-400 truncate">{payment.notes}</p>
          )}
        </div>
      )}

      {/* Amount */}
      <div className="text-right">
        <p className="font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
        {payment.customers?.daily_amount && (
          <p className="text-xs text-slate-400">
            due {formatCurrency(payment.customers.daily_amount)}
          </p>
        )}
      </div>

      {/* Delete */}
      {showDelete && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}
