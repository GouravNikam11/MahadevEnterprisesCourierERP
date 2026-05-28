import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAccountBooking, listAccountBookings, updateAccountBooking } from '../../services/bookingApi'
import { lookupAccountParties, lookupCourierCompanies, type LookupItem } from '../../services/lookupApi'
import { accountBookingToConsignmentLabel, ConsignmentLabel } from '../../components/ConsignmentLabel'
import { ReceiptModal } from '../../components/ReceiptModal'
import { DataTable } from '../../components/layout/DataTable'
import { PageHeader } from '../../components/layout/PageHeader'
import { PaginationBar } from '../../components/layout/PaginationBar'
import {
  btnPrimaryClass,
  btnSecondaryClass,
  alertErrorClass,
  btnTableActionClass,
  cardClass,
  cardMutedClass,
  emptyCellClass,
  mutedTextClass,
  textPrimaryClass,
  textSecondaryClass,
  formActionsClass,
  formGridClass,
  formSpanFullClass,
  inputClass,
  labelClass,
  pageClass,
  selectClass,
  toolbarClass,
} from '../../components/layout/uiClasses'
import { downloadCsv } from '../../utils/csv'
import { downloadExcel, downloadPdf } from '../../utils/export'

const schema = z.object({
  bookingDate: z.string().min(10),
  accountPartyId: z.string().uuid(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(10).max(15).optional().or(z.literal('')),
  courierCompanyId: z.string().uuid(),
  courierNumber: z.string().min(3),
  parcelType: z.string().optional().or(z.literal('')),
  destination: z.string().optional().or(z.literal('')),
  weight: z.coerce.number().nonnegative().optional(),
  weightUnit: z.enum(['KG', 'GM']).optional().default('KG'),
  charges: z.coerce.number().nonnegative().optional(),
  remarks: z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

function optionalNumber(v: unknown) {
  if (v === '' || v == null) return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

export function AccountBookingPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: any[]; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingLink, setTrackingLink] = useState<string | null>(null)
  const [receiptRow, setReceiptRow] = useState<any | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')

  const formCardRef = useRef<HTMLDivElement>(null)
  const [accountParties, setAccountParties] = useState<LookupItem[]>([])
  const [courierCompanies, setCourierCompanies] = useState<LookupItem[]>([])

  const pageSize = 10
  const serialOffset = (page - 1) * pageSize

  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      bookingDate: new Date().toISOString().slice(0, 10),
      accountPartyId: '',
      customerName: '',
      customerPhone: '',
      courierCompanyId: '',
      courierNumber: '',
      parcelType: '',
      destination: '',
      weight: '',
      weightUnit: 'KG',
      charges: '',
      remarks: '',
    } as any,
  })

  useEffect(() => {
    Promise.all([lookupAccountParties(), lookupCourierCompanies()]).then(([ap, cc]) => {
      setAccountParties(ap)
      setCourierCompanies(cc)
    })
  }, [])

  const query = useMemo(() => ({ q: q.trim() || undefined, page, pageSize }), [q, page, pageSize])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listAccountBookings(query)
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

  const emptyFormValues = {
    bookingDate: new Date().toISOString().slice(0, 10),
    accountPartyId: '',
    customerName: '',
    customerPhone: '',
    courierCompanyId: '',
    courierNumber: '',
    parcelType: '',
    destination: '',
    weight: '',
    weightUnit: 'KG',
    charges: '',
    remarks: '',
  } as const

  const toPayload = (values: FormValues) => ({
    ...values,
    customerPhone: values.customerPhone || undefined,
    parcelType: values.parcelType || undefined,
    destination: values.destination || undefined,
    weight: optionalNumber(values.weight),
    weightUnit: values.weightUnit ?? 'KG',
    charges: optionalNumber(values.charges),
    remarks: values.remarks || undefined,
  })

  const onCreate = async (values: FormValues) => {
    setError(null)
    setTrackingLink(null)
    const res = await createAccountBooking(toPayload(values))
    setTrackingLink(res.trackingLink)
    form.reset(emptyFormValues as any)
    const accountParty = accountParties.find((p) => p.id === values.accountPartyId)
    const courierCompany = courierCompanies.find((c) => c.id === values.courierCompanyId)
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: [
              {
                ...res.booking,
                accountParty: accountParty ? { id: accountParty.id, name: accountParty.name } : null,
                courierCompany: courierCompany ? { id: courierCompany.id, name: courierCompany.name } : null,
              },
              ...prev.items,
            ],
          }
        : prev,
    )
  }

  const onUpdate = async (values: FormValues) => {
    if (!editing) return
    setError(null)
    try {
      const updated = await updateAccountBooking(editing.id, toPayload(values))
      setEditing(null)
      form.reset(emptyFormValues as any)
      setData((prev) => (prev ? { ...prev, items: prev.items.map((x) => (x.id === updated.id ? updated : x)) } : prev))
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to update booking')
    }
  }

  const startEdit = (row: any) => {
    setEditing(row)
    setTrackingLink(null)
    form.reset({
      bookingDate: row.bookingDate ? String(row.bookingDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      accountPartyId: row.accountPartyId,
      customerName: row.customerName,
      customerPhone: row.customerPhone ?? '',
      courierCompanyId: row.courierCompanyId,
      courierNumber: row.courierNumber,
      parcelType: row.parcelType ?? '',
      destination: row.destination ?? '',
      weight: row.weight != null ? Number(row.weight) : undefined,
      weightUnit: row.weightUnit ?? 'KG',
      charges: row.charges != null ? Number(row.charges) : undefined,
      remarks: row.remarks ?? '',
    } as any)
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cancelEdit = () => {
    setEditing(null)
    form.reset(emptyFormValues as any)
  }

  const exportRows = useMemo(() => {
    return (data?.items ?? []).map((x, i) => ({
      srNo: serialOffset + i + 1,
      date: String(x.bookingDate).slice(0, 10),
      courierNo: x.courierNumber,
      courierName: x.accountParty?.name ?? '',
      customerName: x.customerName,
      mobileNo: x.customerPhone ?? '',
      destination: x.destination ?? '',
      weight: x.weight ?? '',
    }))
  }, [data?.items, serialOffset])

  const onExport = () => {
    const base = `account-bookings-${new Date().toISOString().slice(0, 10)}`
    if (exportFormat === 'csv') return downloadCsv(`${base}.csv`, exportRows)
    if (exportFormat === 'excel') return downloadExcel(`${base}.xlsx`, 'AccountBookings', exportRows)
    return downloadPdf(`${base}.pdf`, 'Account bookings', exportRows)
  }

  return (
    <div className={pageClass}>
      <PageHeader
        title="Account Booking"
        subtitle="Create account bookings and generate tracking link"
      />

      {trackingLink && (
        <div className={cardMutedClass}>
          Tracking link:{' '}
          <a className="text-erp-accent underline" href={trackingLink} target="_blank" rel="noreferrer">
            {trackingLink}
          </a>
        </div>
      )}
      {error && <div className={alertErrorClass}>{error}</div>}

      <div ref={formCardRef} className={cardClass}>
        <div className="mb-3 text-sm font-medium text-erp-text">
          {editing ? 'Edit booking' : 'New booking'}
        </div>
        <form className={formGridClass} onSubmit={form.handleSubmit(editing ? onUpdate : onCreate)}>
          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" className={inputClass} {...form.register('bookingDate')} />
          </div>
          <div>
            <label className={labelClass}>Account Party *</label>
            <select
              className={selectClass}
              {...form.register('accountPartyId')}
            >
              <option value="">Select</option>
              {accountParties.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Courier Company *</label>
            <select
              className={selectClass}
              {...form.register('courierCompanyId')}
            >
              <option value="">Select</option>
              {courierCompanies.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Courier number *</label>
            <input
              className={inputClass}
              {...form.register('courierNumber')}
            />
          </div>
          <div>
            <label className={labelClass}>Destination</label>
            <input
              className={inputClass}
              {...form.register('destination')}
            />
          </div>
          <div>
            <label className={labelClass}>Customer name *</label>
            <input
              className={inputClass}
              {...form.register('customerName')}
            />
          </div>
          <div>
            <label className={labelClass}>Customer phone</label>
            <input
              className={inputClass}
              {...form.register('customerPhone')}
            />
          </div>
          <div>
            <label className={labelClass}>Weight</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" className={inputClass} {...form.register('weight')} />
              <select className={`${selectClass} w-[110px]`} {...form.register('weightUnit')}>
                <option value="KG">KG</option>
                <option value="GM">GM</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Charges</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              {...form.register('charges')}
            />
          </div>
          <div className={formSpanFullClass}>
            <label className={labelClass}>Remarks</label>
            <input
              className={inputClass}
              {...form.register('remarks')}
            />
          </div>
          <div className={formActionsClass}>
            <button type="submit" disabled={form.formState.isSubmitting} className={btnPrimaryClass}>
              {form.formState.isSubmitting ? 'Saving…' : editing ? 'Update booking' : 'Save booking'}
            </button>
            {editing && (
              <button type="button" className={btnSecondaryClass} onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={toolbarClass}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Search by courier number / customer"
          className={`${inputClass} sm:max-w-md`}
        />
        <select
          className={`${selectClass} w-full sm:w-[140px]`}
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as any)}
        >
          <option value="csv">CSV</option>
          <option value="excel">EXCEL</option>
          <option value="pdf">PDF</option>
        </select>
        <button onClick={onExport} className={btnSecondaryClass}>
          Export
        </button>
        <div className={`text-xs ${mutedTextClass}`}>{loading ? 'Loading…' : ' '}</div>
      </div>

      <DataTable minWidth="1100px">
        <thead>
          <tr>
            <th>Sr.No</th>
            <th>Date</th>
            <th>Courier No</th>
            <th>Courier Name</th>
            <th>Customer Name</th>
            <th>Mobile No</th>
            <th>Destination</th>
            <th>Weight</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((row, i) => (
            <tr key={row.id}>
              <td className={textSecondaryClass}>{serialOffset + i + 1}</td>
              <td className={`${textSecondaryClass} whitespace-nowrap`}>{String(row.bookingDate).slice(0, 10)}</td>
              <td className="font-medium text-erp-text whitespace-nowrap">{row.courierNumber}</td>
              <td className={textPrimaryClass}>{row.accountParty?.name ?? '—'}</td>
              <td className={textPrimaryClass}>{row.customerName}</td>
              <td className={textSecondaryClass}>{row.customerPhone ?? '—'}</td>
              <td className={textSecondaryClass}>{row.destination ?? '—'}</td>
              <td className={textSecondaryClass}>
                {row.weight != null ? `${row.weight} ${row.weightUnit ?? 'KG'}` : '—'}
              </td>
              <td className="text-right">
                <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                  <button type="button" className={btnTableActionClass} onClick={() => startEdit(row)}>
                    Edit
                  </button>
                  <button type="button" className={btnTableActionClass} onClick={() => setReceiptRow(row)}>
                    Print
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && (data?.items?.length ?? 0) === 0 && (
            <tr>
              <td className={emptyCellClass} colSpan={9}>
                No bookings found
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>

      {receiptRow && (
        <ReceiptModal
          title="Consignment label"
          panelClassName="max-w-4xl"
          onClose={() => setReceiptRow(null)}
        >
          <ConsignmentLabel data={accountBookingToConsignmentLabel(receiptRow)} />
        </ReceiptModal>
      )}

      <PaginationBar
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  )
}

