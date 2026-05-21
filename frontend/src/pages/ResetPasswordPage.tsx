import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PasswordInput } from '../components/PasswordInput'
import { resetPasswordRequest } from '../services/authApi'

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [done, setDone] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      form.setError('root', { message: 'Reset link is invalid or missing. Request a new link.' })
      return
    }
    try {
      await resetPasswordRequest(token, values.password)
      setDone(true)
    } catch (e) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error)?.message ??
        'Reset failed. The link may have expired.'
      form.setError('root', { message })
    }
  }

  if (!token && !done) {
    return (
      <main className="min-h-screen bg-slate-50 p-4">
        <section className="mx-auto mt-24 max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-700">This reset link is invalid.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm font-medium text-slate-900 hover:underline">
            Request a new link
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4">
        <article className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-6">
            <h1 className="text-xl font-semibold">Set new password</h1>
            <p className="text-sm text-slate-500">Choose a strong password (min. 8 characters).</p>
          </header>

          {done ? (
            <section className="space-y-4">
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                Your password has been updated.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Sign in
              </button>
            </section>
          ) : (
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">New password</span>
                <PasswordInput autoComplete="new-password" {...form.register('password')} />
                {form.formState.errors.password && (
                  <span className="mt-1 block text-xs text-red-600">{form.formState.errors.password.message}</span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Confirm password</span>
                <PasswordInput autoComplete="new-password" {...form.register('confirmPassword')} />
                {form.formState.errors.confirmPassword && (
                  <span className="mt-1 block text-xs text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </span>
                )}
              </label>

              <button
                type="submit"
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving...' : 'Update password'}
              </button>

              {form.formState.errors.root?.message && (
                <p className="text-center text-xs text-red-600">{form.formState.errors.root.message}</p>
              )}
            </form>
          )}
        </article>
      </section>
    </main>
  )
}
