import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { loginRequest } from '../services/authApi'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../redux/store'
import { setSession } from '../redux/slices/authSlice'
import { PasswordInput } from '../components/PasswordInput'

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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4">
        <article className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-6">
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="text-sm text-slate-500">Mahadev Enterprises Courier ERP</p>
          </header>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email</span>
              <input
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <span className="mt-1 block text-xs text-red-600">{form.formState.errors.email.message}</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Password</span>
              <PasswordInput autoComplete="current-password" {...form.register('password')} />
              {form.formState.errors.password && (
                <span className="mt-1 block text-xs text-red-600">{form.formState.errors.password.message}</span>
              )}
            </label>

            <p className="text-right">
              <Link to="/forgot-password" className="text-sm text-slate-600 hover:text-slate-900 hover:underline">
                Forgot password?
              </Link>
            </p>

            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

          {form.formState.errors.root?.message && (
            <p className="mt-3 text-center text-xs text-red-600">{form.formState.errors.root.message}</p>
          )}
        </article>
      </section>
    </main>
  )
}
