'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPayments,
  fetchCustomerPayments,
  addPayment,
  deletePayment,
  fetchDashboardStats,
  fetchMissedPayments,
  fetchDailyTotals,
  fetchRecentCollectionDates,
} from '@/services/payments'
import type { AddPaymentForm, PaymentFilters } from '@/types'
import { customerKeys } from './useCustomers'
import { toast } from 'sonner'
import { today } from '@/lib/utils'

// ── Keys ──────────────────────────────────────────────────────
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters?: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
  customer: (id: string) => [...paymentKeys.all, 'customer', id] as const,
  dashboard: (date: string) => ['dashboard', date] as const,
  missed: (date: string) => ['missed', date] as const,
  dailyTotals: (date: string) => ['dailyTotals', date] as const,
  recentDates: () => ['recentDates'] as const,
}

// ── Hooks ──────────────────────────────────────────────────────
export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => fetchPayments(filters),
    staleTime: 30_000,
  })
}

export function useCustomerPayments(customerId: string) {
  return useQuery({
    queryKey: paymentKeys.customer(customerId),
    queryFn: () => fetchCustomerPayments(customerId),
    enabled: !!customerId,
    staleTime: 30_000,
  })
}

export function useDashboardStats(date: string = today()) {
  return useQuery({
    queryKey: paymentKeys.dashboard(date),
    queryFn: () => fetchDashboardStats(date),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000, // refresh every 5 min
  })
}

export function useMissedPayments(date: string = today()) {
  return useQuery({
    queryKey: paymentKeys.missed(date),
    queryFn: () => fetchMissedPayments(date),
    staleTime: 60_000,
  })
}

export function useDailyTotals(date: string) {
  return useQuery({
    queryKey: paymentKeys.dailyTotals(date),
    queryFn: () => fetchDailyTotals(date),
    staleTime: 30_000,
  })
}

export function useRecentCollectionDates() {
  return useQuery({
    queryKey: paymentKeys.recentDates(),
    queryFn: () => fetchRecentCollectionDates(30),
    staleTime: 5 * 60_000,
  })
}

export function useAddPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (form: AddPaymentForm) => addPayment(form),
    onSuccess: (data) => {
      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentKeys.dashboard(data.date) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.missed(data.date) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.recentDates() })
      queryClient.invalidateQueries({
        queryKey: paymentKeys.customer(data.customer_id),
      })
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(data.customer_id),
      })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      toast.success('Payment recorded!')
    },
    onError: (error: Error) => {
      toast.error(`Payment failed: ${error.message}`)
    },
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      toast.success('Payment deleted')
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })
}
