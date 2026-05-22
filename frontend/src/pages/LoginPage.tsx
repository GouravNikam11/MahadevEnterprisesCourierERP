import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { loginRequest } from '../services/authApi'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../redux/store'
import { setSession } from '../redux/slices/authSlice'
import { PasswordInput } from '../components/PasswordInput'
import { AuthLayout } from '../components/layout/AuthLayout'
import {
  alertErrorClass,
  authCardClass,
  btnPrimaryClass,
  inputClass,
  labelClass,
  linkClass,
  pageTitleClass,
  pageSubtitleClass,
} from '../components/layout/uiClasses'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await loginRequest(values.email, values.password)
      dispatch(
        setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
          },
        }),
      )
      navigate('/app/dashboard')
    } catch (e) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error)?.message ??
        'Login failed. Please try again.'
      form.setError('root', { message })
    }
  }

  return (
    <AuthLayout>
      <article className={authCardClass}>
        <header className="mb-6">
          <h1 className={pageTitleClass}>Sign in</h1>
          <p className={pageSubtitleClass}>Mahadev Enterprises Courier ERP</p>
        </header>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input type="email" className={inputClass} {...form.register('email')} />
            {form.formState.errors.email && (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{form.formState.errors.email.message}</span>
            )}
          </label>

          <label className="block">
            <span className={labelClass}>Password</span>
            <PasswordInput autoComplete="current-password" {...form.register('password')} />
            {form.formState.errors.password && (
              <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{form.formState.errors.password.message}</span>
            )}
          </label>

          <p className="text-right">
            <Link to="/forgot-password" className={linkClass}>
              Forgot password?
            </Link>
          </p>

          <button type="submit" className={btnPrimaryClass + ' w-full'} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {form.formState.errors.root?.message && (
          <p className={`mt-3 text-center text-xs ${alertErrorClass}`}>{form.formState.errors.root.message}</p>
        )}
      </article>
    </AuthLayout>
  )
}
