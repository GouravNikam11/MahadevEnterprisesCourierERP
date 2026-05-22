import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createAccountParty,
  deleteAccountParty,
  listAccountParties,
  updateAccountParty,
  type AccountParty,
} from '../../services/accountPartyApi'
import { DataTable } from '../../components/layout/DataTable'
import { PageHeader } from '../../components/layout/PageHeader'
import { PaginationBar } from '../../components/layout/PaginationBar'
import {
  alertErrorClass,
  badgeActiveClass,
  badgeInactiveClass,
  btnDangerClass,
  btnPrimaryClass,
  btnSecondaryClass,
  btnTableActionClass,
  cardClass,
  emptyCellClass,
  mutedTextClass,
  textSecondaryClass,
  formActionsClass,
  formGridClass,
  formSpanFullClass,
  inputClass,
  labelClass,
  pageClass,
  toolbarClass,
} from '../../components/layout/uiClasses'
import { downloadCsv } from '../../utils/csv'

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(15).optional().or(z.literal('')),
  gstNumber: z.string().min(5).max(20).optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  rate: z.coerce.number().nonnegative().optional(),
  isActive: z.coerce.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

export function AccountPartyPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [data, setData] = useState<{ items: AccountParty[]; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<AccountParty | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: { name: '', phone: '', gstNumber: '', state: '', address: '', isActive: true },
  })

  const query = useMemo(() => ({ q: q.trim() || undefined, page, pageSize }), [q, page, pageSize])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listAccountParties(query)
      .then((res) => {
        if (cancelled) return
        setData({ items: res.items, totalPages: res.totalPages })
      })
      .catch((e) => {
        if (cancelled) return
        setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to load')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query])

  const onCreate = async (values: FormValues) => {
    setError(null)
    const created = await createAccountParty({
      name: values.name,
      phone: values.phone || undefined,
      gstNumber: values.gstNumber || undefined,
      state: values.state || undefined,
      address: values.address || undefined,
      rate: values.rate,
      isActive: values.isActive,
    })
    setShowCreate(false)
    form.reset({ name: '', phone: '', gstNumber: '', state: '', address: '', isActive: true })
    setData((prev) => (prev ? { ...prev, items: [created, ...prev.items] } : prev))
  }

  const onUpdate = async (values: FormValues) => {
    if (!editing) return
    setError(null)
    const updated = await updateAccountParty(editing.id, {
      name: values.name,
      phone: values.phone || undefined,
      gstNumber: values.gstNumber || undefined,
      state: values.state || undefined,
      address: values.address || undefined,
      rate: values.rate,
      isActive: values.isActive,
    })
    setEditing(null)
    form.reset({ name: '', phone: '', gstNumber: '', state: '', address: '', isActive: true })
    setData((prev) =>
      prev ? { ...prev, items: prev.items.map((x) => (x.id === updated.id ? updated : x)) } : prev,
    )
  }

  const startEdit = (row: AccountParty) => {
    setShowCreate(true)
    setEditing(row)
    form.reset({
      name: row.name,
      phone: row.phone ?? '',
      gstNumber: row.gstNumber ?? '',
      state: row.state ?? '',
      address: row.address ?? '',
      rate: row.rate == null ? undefined : Number(row.rate),
      isActive: row.isActive,
    })
  }

  const onDelete = async (row: AccountParty) => {
    const okConfirm = window.confirm(`Delete account party "${row.name}"?`)
    if (!okConfirm) return
    await deleteAccountParty(row.id)
    setData((prev) => (prev ? { ...prev, items: prev.items.filter((x) => x.id !== row.id) } : prev))
  }

  return (
    <div className={pageClass}>
      <PageHeader
        title="Account Party"
        subtitle="Manage account customers (rates, GST, contact)"
        actions={
          <>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `account-parties-${new Date().toISOString().slice(0, 10)}.csv`,
                  (data?.items ?? []).map((x) => ({
                    name: x.name,
                    phone: x.phone ?? '',
                    gstNumber: x.gstNumber ?? '',
                    state: x.state ?? '',
                    rate: x.rate ?? '',
                    isActive: x.isActive,
                  })),
                )
              }
              className={btnSecondaryClass}
            >
              Export CSV
            </button>
            <button type="button" onClick={() => setShowCreate((v) => !v)} className={btnPrimaryClass}>
              Add Party
            </button>
          </>
        }
      />

      <div className={toolbarClass}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Search by name / phone / GST"
          className={`${inputClass} sm:max-w-md`}
        />
        <div className={`text-xs ${mutedTextClass}`}>{loading ? 'Loading…' : ' '}</div>
      </div>

      {error && <div className={alertErrorClass}>{error}</div>}

      {showCreate && (
        <div className={cardClass}>
          <div className="mb-3 text-sm font-medium">{editing ? 'Edit account party' : 'Create account party'}</div>
          <form
            className={formGridClass}
            onSubmit={form.handleSubmit(editing ? onUpdate : onCreate)}
          >
            <div>
              <label className={labelClass}>Name *</label>
              <input
                className={inputClass}
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.name?.message ?? '')}</div>
              )}
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass}
                {...form.register('phone')}
              />
            </div>
            <div>
              <label className={labelClass}>GST Number</label>
              <input
                className={inputClass}
                {...form.register('gstNumber')}
              />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input
                className={inputClass}
                {...form.register('state')}
              />
            </div>
            <div className={formSpanFullClass}>
              <label className={labelClass}>Address</label>
              <input
                className={inputClass}
                {...form.register('address')}
              />
            </div>
            <div>
              <label className={labelClass}>Rate</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                {...form.register('rate')}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" defaultChecked {...form.register('isActive')} />
              Active
            </label>
            <div className={formActionsClass}>
              <button type="submit" disabled={form.formState.isSubmitting} className={btnPrimaryClass}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setEditing(null)
                  form.reset({ name: '', phone: '', gstNumber: '', state: '', address: '', isActive: true })
                }}
                className={btnSecondaryClass}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <DataTable minWidth="720px">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>GST</th>
            <th>State</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((row) => (
            <tr key={row.id}>
              <td className="font-medium text-erp-text">{row.name}</td>
              <td className={textSecondaryClass}>{row.phone ?? '—'}</td>
              <td className={textSecondaryClass}>{row.gstNumber ?? '—'}</td>
              <td className={textSecondaryClass}>{row.state ?? '—'}</td>
              <td>
                <span className={row.isActive ? badgeActiveClass : badgeInactiveClass}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="text-right">
                <div className="inline-flex flex-wrap justify-end gap-2">
                  <button type="button" className={btnTableActionClass} onClick={() => startEdit(row)}>
                    Edit
                  </button>
                  <button type="button" className={btnDangerClass} onClick={() => onDelete(row)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && (data?.items?.length ?? 0) === 0 && (
            <tr>
              <td className={emptyCellClass} colSpan={6}>
                No account parties found
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>

      <PaginationBar
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  )
}

