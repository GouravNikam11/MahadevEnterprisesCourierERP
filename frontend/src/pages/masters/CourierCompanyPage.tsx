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
  selectClass,
} from '../../components/layout/uiClasses'
import { downloadCsv } from '../../utils/csv'
import { downloadExcel, downloadPdf } from '../../utils/export'

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
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')

  const exportRows = useMemo(() => {
    return (data?.items ?? []).map((x) => ({
      name: x.name,
      trackingUrl: x.trackingUrl ?? '',
      supportPhone: x.supportPhone ?? '',
      isActive: x.isActive,
    }))
  }, [data?.items])

  const onExport = () => {
    const base = `courier-companies-${new Date().toISOString().slice(0, 10)}`
    if (exportFormat === 'csv') return downloadCsv(`${base}.csv`, exportRows)
    if (exportFormat === 'excel') return downloadExcel(`${base}.xlsx`, 'CourierCompanies', exportRows)
    return downloadPdf(`${base}.pdf`, 'Courier companies', exportRows)
  }

  const query = useMemo(() => ({ q: q.trim() || undefined, page, pageSize: 10 }), [q, page])
  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
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
    <div className={pageClass}>
      <PageHeader
        title="Courier Company Master"
        subtitle="Tracking URL templates and company status"
        actions={
          <>
            <select
              className={`${selectClass} w-full sm:w-[140px]`}
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
            >
              <option value="csv">CSV</option>
              <option value="excel">EXCEL</option>
              <option value="pdf">PDF</option>
            </select>
            <button type="button" onClick={onExport} className={btnSecondaryClass}>
              Export
            </button>
            <button type="button" onClick={() => setShowCreate((v) => !v)} className={btnPrimaryClass}>
              Add Company
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
          placeholder="Search by company name"
          className={`${inputClass} sm:max-w-md`}
        />
        <div className={`text-xs ${mutedTextClass}`}>{loading ? 'Loading…' : ' '}</div>
      </div>

      {error && <div className={alertErrorClass}>{error}</div>}

      {showCreate && (
        <div className={cardClass}>
          <div className="mb-3 text-sm font-medium">{editing ? 'Edit courier company' : 'Create courier company'}</div>
          <form
            className={formGridClass}
            onSubmit={form.handleSubmit(editing ? onUpdate : onCreate)}
          >
            <div>
              <label className={labelClass}>Company name *</label>
              <input
                className={inputClass}
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.name?.message ?? '')}</div>
              )}
            </div>
            <div>
              <label className={labelClass}>Support phone</label>
              <input
                className={inputClass}
                {...form.register('supportPhone')}
              />
            </div>
            <div className={formSpanFullClass}>
              <label className={labelClass}>Tracking URL template</label>
              <input
                placeholder="https://trackingcompany.com/track/{tracking_number}"
                className={inputClass}
                {...form.register('trackingUrl')}
              />
              {form.formState.errors.trackingUrl && (
                <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.trackingUrl?.message ?? '')}</div>
              )}
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
                  form.reset({ name: '', trackingUrl: '', supportPhone: '', isActive: true })
                }}
                className={btnSecondaryClass}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <DataTable minWidth="680px">
        <thead>
          <tr>
            <th>Name</th>
            <th>Tracking URL</th>
            <th>Support</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((row) => (
            <tr key={row.id}>
              <td className="max-w-[12rem] truncate font-medium text-erp-text sm:max-w-none">{row.name}</td>
              <td className={`max-w-[10rem] truncate sm:max-w-none ${textSecondaryClass}`}>{row.trackingUrl ?? '—'}</td>
              <td className={textSecondaryClass}>{row.supportPhone ?? '—'}</td>
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
              <td className={emptyCellClass} colSpan={5}>
                No courier companies found
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

