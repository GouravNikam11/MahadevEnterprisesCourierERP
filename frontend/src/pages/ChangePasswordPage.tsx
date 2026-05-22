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
import { PageHeader } from '../components/layout/PageHeader'
import {
  alertErrorClass,
  alertSuccessClass,
  btnPrimaryClass,
  cardClass,
  labelClass,
  pageClass,
} from '../components/layout/uiClasses'

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
    <div className={pageClass}>
      <PageHeader
        title="Change password"
        subtitle="Update your password while signed in. You will be signed out on all devices after saving."
      />

      {success ? (
        <p className={alertSuccessClass}>Password updated. Redirecting to sign in…</p>
      ) : (
        <form className={`${cardClass} space-y-4`} onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block">
            <span className={labelClass}>Current password</span>
            <PasswordInput autoComplete="current-password" {...form.register('currentPassword')} />
            {form.formState.errors.currentPassword && (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
                {form.formState.errors.currentPassword.message}
              </span>
            )}
          </label>

          <label className="block">
            <span className={labelClass}>New password</span>
            <PasswordInput autoComplete="new-password" {...form.register('newPassword')} />
            {form.formState.errors.newPassword && (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{form.formState.errors.newPassword.message}</span>
            )}
          </label>

          <label className="block">
            <span className={labelClass}>Confirm new password</span>
            <PasswordInput autoComplete="new-password" {...form.register('confirmPassword')} />
            {form.formState.errors.confirmPassword && (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
                {form.formState.errors.confirmPassword.message}
              </span>
            )}
          </label>

          <button type="submit" className={btnPrimaryClass} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Update password'}
          </button>

          {form.formState.errors.root?.message && <p className={alertErrorClass}>{form.formState.errors.root.message}</p>}
        </form>
      )}
    </div>
  )
}
