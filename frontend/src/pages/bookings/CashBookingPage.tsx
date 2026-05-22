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
import { downloadCsv } from '../../utils/csv'

const schema = z.object({
  fromName: z.string().min(2),
  toName: z.string().min(2),
  mobileNumber: z.string().min(10).max(15).optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  pincodeId: z.string().uuid().optional().or(z.literal('')),
  courierCompanyId: z.string().uuid(),
  courierNumber: z.string().min(3),
  weight: z.coerce.number().nonnegative().optional(),
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

  const [courierCompanies, setCourierCompanies] = useState<LookupItem[]>([])
  const [pincodes, setPincodes] = useState<PincodeLookupItem[]>([])
  const [pincodeSearch, setPincodeSearch] = useState('')

  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      fromName: '',
      toName: '',
      mobileNumber: '',
      location: '',
      pincodeId: '',
      courierCompanyId: '',
      courierNumber: '',
      remarks: '',
    } as any,
  })

  useEffect(() => {
    Promise.all([lookupCourierCompanies(), lookupPincodes()]).then(([cc, pc]) => {
      setCourierCompanies(cc)
      setPincodes(pc)
    })
  }, [])

  const query = useMemo(() => ({ q: q.trim() || undefined, page, pageSize: 10 }), [q, page])

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
    })
    setTrackingLink(res.trackingLink)
    form.reset({
      fromName: '',
      toName: '',
      mobileNumber: '',
      location: '',
      pincodeId: '',
      courierCompanyId: '',
      courierNumber: '',
      remarks: '',
    } as any)
    setData((prev) => (prev ? { ...prev, items: [res.booking, ...prev.items] } : prev))
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="erp-page-title">Cash Booking</div>
        <div className="erp-muted">Fast entry cash bookings with pincode lookup</div>
      </div>

      {trackingLink && (
        <div className="erp-card-muted">
          Tracking link:{' '}
          <a className="underline" href={trackingLink} target="_blank" rel="noreferrer">
            {trackingLink}
          </a>
        </div>
      )}
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-card">
        <div className="mb-3 text-sm font-medium">New booking</div>
        <form className="erp-form-grid" onSubmit={form.handleSubmit(onCreate)}>
          <div>
            <label className="erp-label">From name *</label>
            <input className="erp-input" {...form.register('fromName')} />
          </div>
          <div>
            <label className="erp-label">To name *</label>
            <input className="erp-input" {...form.register('toName')} />
          </div>
          <div>
            <label className="erp-label">Mobile number</label>
            <input className="erp-input" {...form.register('mobileNumber')} />
          </div>
          <div>
            <label className="erp-label">Location</label>
            <input className="erp-input" {...form.register('location')} />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <label className="erp-label">Search pincode</label>
              <input
                value={pincodeSearch}
                onChange={(e) => setPincodeSearch(e.target.value)}
                placeholder="Type pincode / area / city"
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Select pincode</label>
              <select
                className="erp-input"
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

          <div>
            <label className="erp-label">Courier Company *</label>
            <select
              className="erp-input"
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
            <label className="erp-label">Courier number *</label>
            <input className="erp-input" {...form.register('courierNumber')} />
          </div>
          <div>
            <label className="erp-label">Weight</label>
            <input type="number" step="0.01" className="erp-input" {...form.register('weight')} />
          </div>
          <div>
            <label className="erp-label">Amount</label>
            <input type="number" step="0.01" className="erp-input" {...form.register('amount')} />
          </div>
          <div className="md:col-span-2">
            <label className="erp-label">Remarks</label>
            <input className="erp-input" {...form.register('remarks')} />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="erp-btn-primary"
            >
              {form.formState.isSubmitting ? 'Saving…' : 'Save booking'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Search by courier number / names"
          className="erp-input sm:max-w-md"
        />
        <button
          onClick={() =>
            downloadCsv(
              `cash-bookings-${new Date().toISOString().slice(0, 10)}.csv`,
              (data?.items ?? []).map((x) => ({
                bookingDate: String(x.bookingDate).slice(0, 10),
                courierNumber: x.courierNumber,
                fromName: x.fromName,
                toName: x.toName,
                mobileNumber: x.mobileNumber ?? '',
                status: x.status,
              })),
            )
          }
          className="erp-btn-secondary"
        >
          Export CSV
        </button>
        <div className="text-xs erp-muted">{loading ? 'Loading…' : ' '}</div>
      </div>

      <div className="erp-table-wrap">
        <table className="w-full text-left text-sm">
          <thead className="erp-table thead">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Courier #</th>
              <th className="px-4 py-3">From → To</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((row) => (
              <tr key={row.id} className="">
                <td className="px-4 py-3 text-erp-muted">{String(row.bookingDate).slice(0, 10)}</td>
                <td className="px-4 py-3 font-medium">{row.courierNumber}</td>
                <td className="px-4 py-3 text-erp-text">
                  {row.fromName} → {row.toName}
                </td>
                <td className="px-4 py-3 text-erp-muted">{row.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="rounded-md border border-erp-border bg-white px-2.5 py-1 text-xs hover:bg-erp-hover"
                    onClick={() => setReceiptRow(row)}
                  >
                    Print
                  </button>
                </td>
              </tr>
            ))}
            {!loading && (data?.items?.length ?? 0) === 0 && (
              <tr>
                <td className="erp-empty" colSpan={5}>
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

