import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { forgotPasswordRequest } from '../services/authApi'

const schema = z.object({
  email: z.string().email(),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await forgotPasswordRequest(values.email)
      setSent(true)
      form.clearErrors('root')
    } catch (e) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error)?.message ??
        'Request failed. Please try again.'
      form.setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="text-xl font-semibold">Forgot password</div>
            <div className="text-sm text-slate-500">We will email you a link to reset your password.</div>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                If an account exists for that email, you will receive instructions shortly. Check your inbox and spam
                folder.
              </div>
              <p className="text-xs text-slate-500">
                Local development: if email is not configured, the reset link is printed in the backend server log.
              </p>
              <Link to="/login" className="block text-center text-sm font-medium text-slate-900 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <div className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</div>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>

              {form.formState.errors.root?.message && (
                <div className="text-center text-xs text-red-600">{form.formState.errors.root.message}</div>
              )}

              <Link to="/login" className="block text-center text-sm text-slate-600 hover:text-slate-900">
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
