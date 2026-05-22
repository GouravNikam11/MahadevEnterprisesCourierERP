import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { forgotPasswordRequest } from '../services/authApi'
import { AuthLayout } from '../components/layout/AuthLayout'
import {
  alertErrorClass,
  alertSuccessClass,
  authCardClass,
  btnPrimaryClass,
  inputClass,
  labelClass,
  linkClass,
  mutedTextClass,
  pageTitleClass,
  pageSubtitleClass,
} from '../components/layout/uiClasses'

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
    <AuthLayout>
      <div className={authCardClass}>
        <div className="mb-6">
          <h1 className={pageTitleClass}>Forgot password</h1>
          <p className={pageSubtitleClass}>We will email you a link to reset your password.</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className={alertSuccessClass}>
              If an account exists for that email, you will receive instructions shortly. Check your inbox and spam
              folder.
            </div>
            <p className={mutedTextClass}>
              Local development: if email is not configured, the reset link is printed in the backend server log.
            </p>
            <Link to="/login" className={`block text-center font-medium ${linkClass}`}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} {...form.register('email')} />
              {form.formState.errors.email && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">{form.formState.errors.email.message}</div>
              )}
            </div>

            <button type="submit" className={btnPrimaryClass + ' w-full'} disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>

            {form.formState.errors.root?.message && (
              <div className={`text-center text-xs ${alertErrorClass}`}>{form.formState.errors.root.message}</div>
            )}

            <Link to="/login" className={`block text-center ${linkClass}`}>
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
