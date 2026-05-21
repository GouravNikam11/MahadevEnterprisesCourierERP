import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createCourierCompany,
  deleteCourierCompany,
  listCourierCompanies,
  updateCourierCompany,
  type CourierCompany,
} from '../../services/mastersApi'
import { downloadCsv } from '../../utils/csv'

const schema = z.object({
  name: z.string().min(2),
  trackingUrl: z.string().url().optional().or(z.literal('')),
  supportPhone: z.string().min(10).max(15).optional().or(z.literal('')),
  isActive: z.coerce.boolean().default(true),
})
type FormValues = z.infer<typeof schema>

export function CourierCompanyPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: CourierCompany[]; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<CourierCompany | null>(null)

  const query = useMemo(() => ({ q: q.trim() || undefined, page, pageSize: 10 }), [q, page])
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', trackingUrl: '', supportPhone: '', isActive: true },
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listCourierCompanies(query)
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
    const created = await createCourierCompany({
      name: values.name,
      trackingUrl: values.trackingUrl || undefined,
      supportPhone: values.supportPhone || undefined,
      isActive: values.isActive,
    })
    setShowCreate(false)
    setEditing(null)
    form.reset({ name: '', trackingUrl: '', supportPhone: '', isActive: true })
    setData((prev) => (prev ? { ...prev, items: [created, ...prev.items] } : prev))
  }

  const onUpdate = async (values: FormValues) => {
    if (!editing) return
    const updated = await updateCourierCompany(editing.id, {
      name: values.name,
      trackingUrl: values.trackingUrl || undefined,
      supportPhone: values.supportPhone || undefined,
      isActive: values.isActive,
    })
    setShowCreate(false)
    setEditing(null)
    form.reset({ name: '', trackingUrl: '', supportPhone: '', isActive: true })
    setData((prev) =>
      prev ? { ...prev, items: prev.items.map((x) => (x.id === updated.id ? updated : x)) } : prev,
    )
  }

  const startEdit = (row: CourierCompany) => {
    setShowCreate(true)
    setEditing(row)
    form.reset({
      name: row.name,
      trackingUrl: row.trackingUrl ?? '',
      supportPhone: row.supportPhone ?? '',
      isActive: row.isActive,
    })
  }

  const onDelete = async (row: CourierCompany) => {
    const okConfirm = window.confirm(`Delete courier company "${row.name}"?`)
    if (!okConfirm) return
    await deleteCourierCompany(row.id)
    setData((prev) => (prev ? { ...prev, items: prev.items.filter((x) => x.id !== row.id) } : prev))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Courier Company Master</div>
          <div className="text-sm text-slate-500">Tracking URL templates and company status</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              downloadCsv(
                `courier-companies-${new Date().toISOString().slice(0, 10)}.csv`,
                (data?.items ?? []).map((x) => ({
                  name: x.name,
                  trackingUrl: x.trackingUrl ?? '',
                  supportPhone: x.supportPhone ?? '',
                  isActive: x.isActive,
                })),
              )
            }
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add Company
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Search by company name"
          className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <div className="text-xs text-slate-500">{loading ? 'Loading…' : ' '}</div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-medium">{editing ? 'Edit courier company' : 'Create courier company'}</div>
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            onSubmit={form.handleSubmit(editing ? onUpdate : onCreate)}
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Company name *</label>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <div className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Support phone</label>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                {...form.register('supportPhone')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">Tracking URL template</label>
              <input
                placeholder="https://trackingcompany.com/track/{tracking_number}"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                {...form.register('trackingUrl')}
              />
              {form.formState.errors.trackingUrl && (
                <div className="mt-1 text-xs text-red-600">{form.formState.errors.trackingUrl.message}</div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" defaultChecked {...form.register('isActive')} />
              Active
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {form.formState.isSubmitting ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setEditing(null)
                  form.reset({ name: '', trackingUrl: '', supportPhone: '', isActive: true })
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Tracking URL</th>
              <th className="px-4 py-3">Support</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-slate-600">{row.trackingUrl ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{row.supportPhone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      'inline-flex rounded-full px-2 py-0.5 text-xs',
                      row.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600',
                    ].join(' ')}
                  >
                    {row.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs hover:bg-slate-50"
                      onClick={() => startEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => onDelete(row)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && (data?.items?.length ?? 0) === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  No courier companies found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Page {page} of {data?.totalPages ?? 1}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            disabled={page >= (data?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

