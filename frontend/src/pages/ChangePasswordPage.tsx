import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PasswordInput } from '../components/PasswordInput'
import { changePasswordRequest } from '../services/authApi'
import type { AppDispatch } from '../redux/store'
import { clearSession } from '../redux/slices/authSlice'

const schema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ChangePasswordPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await changePasswordRequest(values.currentPassword, values.newPassword)
      setSuccess(true)
      dispatch(clearSession())
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error)?.message ??
        'Could not change password.'
      form.setError('root', { message })
    }
  }

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Change password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update your password while signed in. You will be signed out on all devices after saving.
        </p>
      </header>

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Password updated. Redirecting to sign in…
        </p>
      ) : (
        <form
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Current password</span>
            <PasswordInput autoComplete="current-password" {...form.register('currentPassword')} />
            {form.formState.errors.currentPassword && (
              <span className="mt-1 block text-xs text-red-600">
                {form.formState.errors.currentPassword.message}
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">New password</span>
            <PasswordInput autoComplete="new-password" {...form.register('newPassword')} />
            {form.formState.errors.newPassword && (
              <span className="mt-1 block text-xs text-red-600">{form.formState.errors.newPassword.message}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Confirm new password</span>
            <PasswordInput autoComplete="new-password" {...form.register('confirmPassword')} />
            {form.formState.errors.confirmPassword && (
              <span className="mt-1 block text-xs text-red-600">
                {form.formState.errors.confirmPassword.message}
              </span>
            )}
          </label>

          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Saving...' : 'Update password'}
          </button>

          {form.formState.errors.root?.message && (
            <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
          )}
        </form>
      )}
    </section>
  )
}
