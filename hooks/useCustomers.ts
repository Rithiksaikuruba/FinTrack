'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import {
  fetchCustomers,
  fetchCustomer,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  searchActiveCustomers,
} from '@/services/customers'
import type { AddCustomerForm, CustomerFilters } from '@/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// ── Keys ──────────────────────────────────────────────────────
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters?: CustomerFilters) => [...customerKeys.lists(), filters] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
  search: (q: string) => [...customerKeys.all, 'search', q] as const,
}

// ── Hooks ──────────────────────────────────────────────────────
export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => fetchCustomers(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: () => searchActiveCustomers(query),
    enabled: query.length >= 2,
    staleTime: 10_000,
  })
}

export function useAddCustomer() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (form: AddCustomerForm) => addCustomer(form),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      toast.success(`${data.name} added successfully!`)
      router.push(`/customers/${data.id}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to add customer: ${error.message}`)
    },
  })
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<AddCustomerForm>) => updateCustomer(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      toast.success('Customer updated!')
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      toast.success('Customer deleted')
      router.push('/customers')
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })
}
