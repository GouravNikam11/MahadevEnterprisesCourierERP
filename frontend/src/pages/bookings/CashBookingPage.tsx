import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCashBooking, listCashBookings } from '../../services/bookingApi'
import {
  lookupCourierCompanies,
  lookupPincodes,
  type LookupItem,
  type PincodeLookupItem,
} from '../../services/lookupApi'
import { ReceiptModal } from '../../components/ReceiptModal'
import { DataTable } from '../../components/layout/DataTable'
import { PageHeader } from '../../components/layout/PageHeader'
import { PaginationBar } from '../../components/layout/PaginationBar'
import { downloadCsv } from '../../utils/csv'
import { downloadExcel, downloadPdf } from '../../utils/export'
import {
  alertErrorClass,
  btnPrimaryClass,
  btnSecondaryClass,
  cardClass,
  cardMutedClass,
  emptyCellClass,
  formActionsClass,
  formGridClass,
  formSpanFullClass,
  inputClass,
  labelClass,
  mutedTextClass,
  pageClass,
  selectClass,
  textPrimaryClass,
  textSecondaryClass,
  toolbarClass,
} from '../../components/layout/uiClasses'

const schema = z.object({
  bookingDate: z.string().min(10),
  fromName: z.string().min(2),
  toName: z.string().min(2),
  mobileNumber: z.string().min(10).max(15).optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  pincodeId: z.string().uuid().optional().or(z.literal('')),
  courierCompanyId: z.string().uuid(),
  courierNumber: z.string().min(3),
  weight: z.coerce.number().nonnegative().optional(),
  weightUnit: z.enum(['KG', 'GM']).optional().default('KG'),
  amount: z.coerce.number().nonnegative().optional(),
  remarks: z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

export function CashBookingPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: any[]; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingLink, setTrackingLink] = useState<string | null>(null)
  const [receiptRow, setReceiptRow] = useState<any | null>(null)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')

  const [courierCompanies, setCourierCompanies] = useState<LookupItem[]>([])
  const [pincodes, setPincodes] = useState<PincodeLookupItem[]>([])
  const [pincodeSearch, setPincodeSearch] = useState('')

  const pageSize = 10

  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      bookingDate: new Date().toISOString().slice(0, 10),
      fromName: '',
      toName: '',
      mobileNumber: '',
      location: '',
      pincodeId: '',
      courierCompanyId: '',
      courierNumber: '',
      weightUnit: 'KG',
      remarks: '',
    } as any,
  })

  useEffect(() => {
    Promise.all([lookupCourierCompanies(), lookupPincodes()]).then(([cc, pc]) => {
      setCourierCompanies(cc)
      setPincodes(pc)
    })
  }, [])

  const query = useMemo(() => ({ q: q.trim() || undefined, page, pageSize }), [q, page, pageSize])

  const exportRows = useMemo(() => {
    return (data?.items ?? []).map((x) => ({
      date: String(x.bookingDate).slice(0, 10),
      courierNo: x.courierNumber,
      fromName: x.fromName,
      toName: x.toName,
      mobileNo: x.mobileNumber ?? '',
      status: x.status,
    }))
  }, [data?.items])

  const onExport = () => {
    const base = `cash-bookings-${new Date().toISOString().slice(0, 10)}`
    if (exportFormat === 'csv') return downloadCsv(`${base}.csv`, exportRows)
    if (exportFormat === 'excel') return downloadExcel(`${base}.xlsx`, 'CashBookings', exportRows)
    return downloadPdf(`${base}.pdf`, 'Cash bookings', exportRows)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listCashBookings(query)
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

  const filteredPincodes = useMemo(() => {
    const s = pincodeSearch.trim().toLowerCase()
    if (!s) return pincodes.slice(0, 50)
    return pincodes
      .filter(
        (x) =>
          x.pincode.toLowerCase().includes(s) ||
          x.areaName.toLowerCase().includes(s) ||
          (x.city ?? '').toLowerCase().includes(s),
      )
      .slice(0, 50)
  }, [pincodeSearch, pincodes])

  const onCreate = async (values: FormValues) => {
    setError(null)
    setTrackingLink(null)
    const res = await createCashBooking({
      ...values,
      mobileNumber: values.mobileNumber || undefined,
      location: values.location || undefined,
      pincodeId: values.pincodeId || undefined,
      remarks: values.remarks || undefined,
      weightUnit: values.weightUnit ?? 'KG',
    })
    setTrackingLink(res.trackingLink)
    form.reset({
      bookingDate: new Date().toISOString().slice(0, 10),
      fromName: '',
      toName: '',
      mobileNumber: '',
      location: '',
      pincodeId: '',
      courierCompanyId: '',
      courierNumber: '',
      weightUnit: 'KG',
      remarks: '',
    } as any)
    setData((prev) => (prev ? { ...prev, items: [res.booking, ...prev.items] } : prev))
  }

  return (
    <div className={pageClass}>
      <PageHeader title="Cash Booking" subtitle="Fast entry cash bookings with pincode lookup" />

      {trackingLink && (
        <div className={cardMutedClass}>
          Tracking link:{' '}
          <a className="text-erp-accent underline" href={trackingLink} target="_blank" rel="noreferrer">
            {trackingLink}
          </a>
        </div>
      )}
      {error && <div className={alertErrorClass}>{error}</div>}

      <div className={cardClass}>
        <div className="mb-3 text-sm font-medium text-erp-text">New booking</div>
        <form className={formGridClass} onSubmit={form.handleSubmit(onCreate)}>
          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" className={inputClass} {...form.register('bookingDate')} />
          </div>
          <div>
            <label className={labelClass}>From name *</label>
            <input className={inputClass} {...form.register('fromName')} />
          </div>
          <div>
            <label className={labelClass}>To name *</label>
            <input className={inputClass} {...form.register('toName')} />
          </div>
          <div>
            <label className={labelClass}>Mobile number</label>
            <input className={inputClass} {...form.register('mobileNumber')} />
          </div>
          <div className={formSpanFullClass}>
            <label className={labelClass}>Location</label>
            <input className={inputClass} {...form.register('location')} />
          </div>

          <div className={formSpanFullClass}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Search pincode</label>
              <input
                value={pincodeSearch}
                onChange={(e) => setPincodeSearch(e.target.value)}
                placeholder="Type pincode / area / city"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Select pincode</label>
              <select
                className={selectClass}
                {...form.register('pincodeId')}
              >
                <option value="">(optional)</option>
                {filteredPincodes.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.pincode} - {x.areaName}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
            <input className={inputClass} {...form.register('courierNumber')} />
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
            <label className={labelClass}>Amount</label>
            <input type="number" step="0.01" className={inputClass} {...form.register('amount')} />
          </div>
          <div className={formSpanFullClass}>
            <label className={labelClass}>Remarks</label>
            <input className={inputClass} {...form.register('remarks')} />
          </div>
          <div className={formActionsClass}>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className={btnPrimaryClass}
            >
              {form.formState.isSubmitting ? 'Saving…' : 'Save booking'}
            </button>
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
          placeholder="Search by courier number / names"
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

      <DataTable minWidth="860px">
        <thead>
          <tr>
            <th>Date</th>
            <th>Courier #</th>
            <th>From → To</th>
            <th>Status</th>
            <th className="text-right">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((row) => (
            <tr key={row.id}>
              <td className={`${textSecondaryClass} whitespace-nowrap`}>{String(row.bookingDate).slice(0, 10)}</td>
              <td className="font-medium text-erp-text whitespace-nowrap">{row.courierNumber}</td>
              <td className={textPrimaryClass}>
                {row.fromName} → {row.toName}
              </td>
              <td className={`${textSecondaryClass} whitespace-nowrap`}>{row.status}</td>
              <td className="text-right">
                <button type="button" className={btnSecondaryClass} onClick={() => setReceiptRow(row)}>
                  Print
                </button>
              </td>
            </tr>
          ))}
          {!loading && (data?.items?.length ?? 0) === 0 && (
            <tr>
              <td className={emptyCellClass} colSpan={5}>
                No bookings found
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>

      {receiptRow && (
        <ReceiptModal title="Cash Booking Receipt" onClose={() => setReceiptRow(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-semibold">Mahadev Enterprises</div>
                <div className="text-xs erp-muted">Courier Booking Receipt</div>
              </div>
              <div className="text-right text-xs erp-muted">
                Date: {String(receiptRow.bookingDate).slice(0, 10)}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="rounded-md border border-erp-border p-3">
                <div className="text-xs erp-muted">Courier Number</div>
                <div className="font-medium">{receiptRow.courierNumber}</div>
              </div>
              <div className="rounded-md border border-erp-border p-3">
                <div className="text-xs erp-muted">From → To</div>
                <div className="font-medium">
                  {receiptRow.fromName} → {receiptRow.toName}
                </div>
                {receiptRow.mobileNumber && <div className="text-xs erp-muted">{receiptRow.mobileNumber}</div>}
              </div>
              <div className="rounded-md border border-erp-border p-3">
                <div className="text-xs erp-muted">Status</div>
                <div className="font-medium">{receiptRow.status}</div>
              </div>
              <div className="rounded-md border border-erp-border p-3">
                <div className="text-xs erp-muted">Remarks</div>
                <div className="font-medium">{receiptRow.remarks ?? '—'}</div>
              </div>
            </div>
            <div className="text-xs erp-muted">
              Note: Tracking link is shown after saving if courier company has a template.
            </div>
          </div>
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

