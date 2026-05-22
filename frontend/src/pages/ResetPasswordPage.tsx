import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PasswordInput } from '../components/PasswordInput'
import { resetPasswordRequest } from '../services/authApi'
import { AuthLayout } from '../components/layout/AuthLayout'
import {
  alertErrorClass,
  alertSuccessClass,
  authCardClass,
  btnPrimaryClass,
  labelClass,
  linkClass,
  pageTitleClass,
  pageSubtitleClass,
} from '../components/layout/uiClasses'

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
      <AuthLayout>
        <section className={`${authCardClass} text-center`}>
          <p className="text-sm text-erp-text">This reset link is invalid.</p>
          <Link to="/forgot-password" className={`mt-4 inline-block font-medium ${linkClass}`}>
            Request a new link
          </Link>
        </section>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <article className={authCardClass}>
        <header className="mb-6">
          <h1 className={pageTitleClass}>Set new password</h1>
          <p className={pageSubtitleClass}>Choose a strong password (min. 8 characters).</p>
        </header>

        {done ? (
          <section className="space-y-4">
            <p className={alertSuccessClass}>Your password has been updated.</p>
            <button type="button" onClick={() => navigate('/login')} className={btnPrimaryClass + ' w-full'}>
              Sign in
            </button>
          </section>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <label className="block">
              <span className={labelClass}>New password</span>
              <PasswordInput autoComplete="new-password" {...form.register('password')} />
              {form.formState.errors.password && (
                <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{form.formState.errors.password.message}</span>
              )}
            </label>

            <label className="block">
              <span className={labelClass}>Confirm password</span>
              <PasswordInput autoComplete="new-password" {...form.register('confirmPassword')} />
              {form.formState.errors.confirmPassword && (
                <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
                  {form.formState.errors.confirmPassword.message}
                </span>
              )}
            </label>

            <button type="submit" className={btnPrimaryClass + ' w-full'} disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : 'Update password'}
            </button>

            {form.formState.errors.root?.message && (
              <p className={`text-center text-xs ${alertErrorClass}`}>{form.formState.errors.root.message}</p>
            )}
          </form>
        )}
      </article>
    </AuthLayout>
  )
}
