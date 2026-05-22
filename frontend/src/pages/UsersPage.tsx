import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSelector } from 'react-redux'
import type { RootState } from '../redux/store'
import { createUser, listUsers, type UserRow } from '../services/usersApi'
import type { AppRole } from '../constants/rbac'
import { PasswordInput } from '../components/PasswordInput'

const roleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF'])

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  roleName: roleSchema,
})

type FormValues = z.infer<typeof formSchema>

function roleOptionsForActor(actor: string | undefined): AppRole[] {
  if (actor === 'SUPER_ADMIN') return ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'STAFF']
  if (actor === 'ADMIN') return ['ADMIN', 'OPERATOR', 'STAFF']
  return []
}

export function UsersPage() {
  const actorRole = useSelector((s: RootState) => s.auth.user?.role)
  const allowedRoles = useMemo(() => roleOptionsForActor(actorRole), [actorRole])

  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      roleName: allowedRoles[0] ?? 'STAFF',
    },
  })

  useEffect(() => {
    if (allowedRoles[0]) form.setValue('roleName', allowedRoles[0])
  }, [allowedRoles, form])

  const load = () => {
    setLoading(true)
    setError(null)
    listUsers()
      .then((r) => setRows(r.items))
      .catch((e) => setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setSuccess(null)
    try {
      await createUser({
        email: values.email,
        password: values.password,
        name: values.name?.trim() || undefined,
        roleName: values.roleName,
      })
      form.reset({ email: '', password: '', name: '', roleName: allowedRoles[0] ?? 'STAFF' })
      setSuccess('User created.')
      load()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Create failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="erp-page-title">Users</div>
        <p className="mt-1 erp-muted">Create logins for Admin, Operator, and Staff. Operators manage day-to-day masters and bookings.</p>
      </div>

      <div className="erp-card md:p-6">
        <div className="mb-3 text-sm font-medium text-erp-text">New user</div>
        <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="text-xs text-erp-muted">Email</label>
            <input className="mt-1 w-full rounded-md border border-erp-border px-2 py-1.5 text-sm" {...form.register('email')} />
            {form.formState.errors.email && (
              <div className="text-xs text-red-600">{form.formState.errors.email.message}</div>
            )}
          </div>
          <div>
            <label className="text-xs text-erp-muted">Password (min 8)</label>
            <PasswordInput
              autoComplete="new-password"
              className="mt-1 border-erp-border py-1.5 pl-2"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <div className="text-xs text-red-600">{form.formState.errors.password.message}</div>
            )}
          </div>
          <div>
            <label className="text-xs text-erp-muted">Display name (optional)</label>
            <input className="mt-1 w-full rounded-md border border-erp-border px-2 py-1.5 text-sm" {...form.register('name')} />
          </div>
          <div>
            <label className="text-xs text-erp-muted">Role</label>
            <select className="mt-1 w-full rounded-md border border-erp-border px-2 py-1.5 text-sm" {...form.register('roleName')}>
              {allowedRoles.map((r) => (
                <option key={r} value={r}>
                  {r.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="erp-btn-primary"
            >
              Create user
            </button>
          </div>
        </form>
        {form.formState.errors.root && (
          <div className="mt-2 text-sm text-red-600">{form.formState.errors.root.message}</div>
        )}
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        {success && <div className="mt-2 text-sm text-green-700">{success}</div>}
      </div>

      <div className="erp-table-wrap">
        <div className="border-b border-erp-border px-4 py-3 text-sm font-medium text-erp-text">All users</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="">
              <tr>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="erp-empty">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((u) => (
                  <tr key={u.id} className="">
                    <td className="px-4 py-2 font-medium text-erp-text">{u.email}</td>
                    <td className="px-4 py-2 text-erp-muted">{u.name ?? '—'}</td>
                    <td className="px-4 py-2 text-erp-muted">{u.role.name}</td>
                    <td className="px-4 py-2 text-erp-muted">{u.status}</td>
                    <td className="px-4 py-2 text-erp-muted">{new Date(u.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="erp-empty">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
