'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { LogIn, Eye, EyeOff, TrendingUp } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <TrendingUp size={40} strokeWidth={2.5} className="text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FinTrack</h1>
          <p className="text-slate-400 mt-1 text-sm">Loan Collection Manager</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Sign In</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                {...register('email')}
                className="mobile-input"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="mobile-input pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-action w-full mt-2 bg-slate-900 text-white disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-slate-600 text-xs mt-6 text-center">
          Single-owner finance tracking system
        </p>
      </div>
    </div>
  )
}
