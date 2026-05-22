import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPincode, deletePincode, listPincodes, updatePincode, type Pincode } from '../../services/mastersApi'
import { downloadCsv } from '../../utils/csv'

const schema = z.object({
  areaName: z.string().min(2),
  pincode: z.string().min(4).max(10),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  isActive: z.coerce.boolean().default(true),
})
type FormValues = z.infer<typeof schema>

export function PincodeMasterPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: Pincode[]; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Pincode | null>(null)

  const query = useMemo(() => ({ q: q.trim() || undefined, page, pageSize: 10 }), [q, page])
  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: { areaName: '', pincode: '', city: '', state: '', isActive: true },
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listPincodes(query)
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
    const created = await createPincode({
      areaName: values.areaName,
      pincode: values.pincode,
      city: values.city || undefined,
      state: values.state || undefined,
      isActive: values.isActive,
    })
    setShowCreate(false)
    setEditing(null)
    form.reset({ areaName: '', pincode: '', city: '', state: '', isActive: true })
    setData((prev) => (prev ? { ...prev, items: [created, ...prev.items] } : prev))
  }

  const onUpdate = async (values: FormValues) => {
    if (!editing) return
    const updated = await updatePincode(editing.id, {
      areaName: values.areaName,
      pincode: values.pincode,
      city: values.city || undefined,
      state: values.state || undefined,
      isActive: values.isActive,
    })
    setShowCreate(false)
    setEditing(null)
    form.reset({ areaName: '', pincode: '', city: '', state: '', isActive: true })
    setData((prev) =>
      prev ? { ...prev, items: prev.items.map((x) => (x.id === updated.id ? updated : x)) } : prev,
    )
  }

  const startEdit = (row: Pincode) => {
    setShowCreate(true)
    setEditing(row)
    form.reset({
      areaName: row.areaName,
      pincode: row.pincode,
      city: row.city ?? '',
      state: row.state ?? '',
      isActive: row.isActive,
    })
  }

  const onDelete = async (row: Pincode) => {
    const okConfirm = window.confirm(`Delete pincode "${row.pincode} - ${row.areaName}"?`)
    if (!okConfirm) return
    await deletePincode(row.id)
    setData((prev) => (prev ? { ...prev, items: prev.items.filter((x) => x.id !== row.id) } : prev))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="erp-page-title">Area & Pincode Master</div>
          <div className="erp-muted">Searchable pincodes for cash bookings</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              downloadCsv(
                `pincodes-${new Date().toISOString().slice(0, 10)}.csv`,
                (data?.items ?? []).map((x) => ({
                  pincode: x.pincode,
                  areaName: x.areaName,
                  city: x.city ?? '',
                  state: x.state ?? '',
                  isActive: x.isActive,
                })),
              )
            }
            className="erp-btn-secondary"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="erp-btn-primary"
          >
            Add Pincode
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
          placeholder="Search by pincode / area / city / state"
          className="erp-input sm:max-w-md"
        />
        <div className="text-xs erp-muted">{loading ? 'Loading…' : ' '}</div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showCreate && (
        <div className="erp-card">
          <div className="mb-3 text-sm font-medium">{editing ? 'Edit pincode' : 'Create pincode'}</div>
          <form
            className="erp-form-grid"
            onSubmit={form.handleSubmit(editing ? onUpdate : onCreate)}
          >
            <div>
              <label className="erp-label">Area name *</label>
              <input
                className="erp-input"
                {...form.register('areaName')}
              />
              {form.formState.errors.areaName && (
                <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.areaName?.message ?? '')}</div>
              )}
            </div>
            <div>
              <label className="erp-label">Pincode *</label>
              <input
                className="erp-input"
                {...form.register('pincode')}
              />
              {form.formState.errors.pincode && (
                <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.pincode?.message ?? '')}</div>
              )}
            </div>
            <div>
              <label className="erp-label">City</label>
              <input
                className="erp-input"
                {...form.register('city')}
              />
            </div>
            <div>
              <label className="erp-label">State</label>
              <input
                className="erp-input"
                {...form.register('state')}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" defaultChecked {...form.register('isActive')} />
              Active
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="erp-btn-primary"
              >
                {form.formState.isSubmitting ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setEditing(null)
                  form.reset({ areaName: '', pincode: '', city: '', state: '', isActive: true })
                }}
                className="erp-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="erp-table-wrap">
        <table className="w-full text-left text-sm">
          <thead className="erp-table thead">
            <tr>
              <th className="px-4 py-3">Pincode</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((row) => (
              <tr key={row.id} className="">
                <td className="px-4 py-3 font-medium">{row.pincode}</td>
                <td className="px-4 py-3 text-erp-text">{row.areaName}</td>
                <td className="px-4 py-3 text-erp-muted">{row.city ?? '—'}</td>
                <td className="px-4 py-3 text-erp-muted">{row.state ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      'inline-flex rounded-full px-2 py-0.5 text-xs',
                      row.isActive ? 'bg-green-50 text-green-700' : 'bg-erp-hover text-erp-muted',
                    ].join(' ')}
                  >
                    {row.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      className="rounded-md border border-erp-border bg-white px-2.5 py-1 text-xs hover:bg-erp-hover"
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
                <td className="erp-empty" colSpan={6}>
                  No pincodes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs erp-muted">
          Page {page} of {data?.totalPages ?? 1}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-erp-border bg-white px-3 py-1.5 text-sm hover:bg-erp-hover disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="rounded-md border border-erp-border bg-white px-3 py-1.5 text-sm hover:bg-erp-hover disabled:opacity-50"
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

