import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAccountBooking, listAccountBookings } from '../../services/bookingApi'
import { lookupAccountParties, lookupCourierCompanies, type LookupItem } from '../../services/lookupApi'
import { ReceiptModal } from '../../components/ReceiptModal'
import { downloadCsv } from '../../utils/csv'

const schema = z.object({
  accountPartyId: z.string().uuid(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(10).max(15).optional().or(z.literal('')),
  courierCompanyId: z.string().uuid(),
  courierNumber: z.string().min(3),
  parcelType: z.string().optional().or(z.literal('')),
  destination: z.string().optional().or(z.literal('')),
  weight: z.coerce.number().nonnegative().optional(),
  charges: z.coerce.number().nonnegative().optional(),
  remarks: z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

export function AccountBookingPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: any[]; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingLink, setTrackingLink] = useState<string | null>(null)
  const [receiptRow, setReceiptRow] = useState<any | null>(null)

  const [accountParties, setAccountParties] = useState<LookupItem[]>([])
  const [courierCompanies, setCourierCompanies] = useState<LookupItem[]>([])

  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      accountPartyId: '',
      customerName: '',
      customerPhone: '',
      courierCompanyId: '',
      courierNumber: '',
      parcelType: '',
      destination: '',
      remarks: '',
    } as any,
  })

  useEffect(() => {
    Promise.all([lookupAccountParties(), lookupCourierCompanies()]).then(([ap, cc]) => {
      setAccountParties(ap)
      setCourierCompanies(cc)
    })
  }, [])

  const query = useMemo(() => ({ q: q.trim() || undefined, page, pageSize: 10 }), [q, page])

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

  const onCreate = async (values: FormValues) => {
    setError(null)
    setTrackingLink(null)
    const res = await createAccountBooking({
      ...values,
      customerPhone: values.customerPhone || undefined,
      parcelType: values.parcelType || undefined,
      destination: values.destination || undefined,
      remarks: values.remarks || undefined,
    })
    setTrackingLink(res.trackingLink)
    form.reset({
      accountPartyId: '',
      customerName: '',
      customerPhone: '',
      courierCompanyId: '',
      courierNumber: '',
      parcelType: '',
      destination: '',
      remarks: '',
    } as any)
    setData((prev) => (prev ? { ...prev, items: [res.booking, ...prev.items] } : prev))
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Account Booking</div>
        <div className="text-sm text-slate-500">Create account bookings and generate tracking link</div>
      </div>

      {trackingLink && (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
          Tracking link:{' '}
          <a className="underline" href={trackingLink} target="_blank" rel="noreferrer">
            {trackingLink}
          </a>
        </div>
      )}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-medium">New booking</div>
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={form.handleSubmit(onCreate)}>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Account Party *</label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
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
            <label className="mb-1 block text-xs font-medium text-slate-700">Courier Company *</label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
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
            <label className="mb-1 block text-xs font-medium text-slate-700">Customer name *</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              {...form.register('customerName')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Customer phone</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              {...form.register('customerPhone')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Courier number *</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              {...form.register('courierNumber')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Destination</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              {...form.register('destination')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Weight</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              {...form.register('weight')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Charges</label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              {...form.register('charges')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">Remarks</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              {...form.register('remarks')}
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
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
          placeholder="Search by courier number / customer"
          className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <button
          onClick={() =>
            downloadCsv(
              `account-bookings-${new Date().toISOString().slice(0, 10)}.csv`,
              (data?.items ?? []).map((x) => ({
                bookingDate: String(x.bookingDate).slice(0, 10),
                courierNumber: x.courierNumber,
                customerName: x.customerName,
                customerPhone: x.customerPhone ?? '',
                status: x.status,
              })),
            )
          }
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Export CSV
        </button>
        <div className="text-xs text-slate-500">{loading ? 'Loading…' : ' '}</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Courier #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-600">{String(row.bookingDate).slice(0, 10)}</td>
                <td className="px-4 py-3 font-medium">{row.courierNumber}</td>
                <td className="px-4 py-3 text-slate-700">{row.customerName}</td>
                <td className="px-4 py-3 text-slate-600">{row.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs hover:bg-slate-50"
                    onClick={() => setReceiptRow(row)}
                  >
                    Print
                  </button>
                </td>
              </tr>
            ))}
            {!loading && (data?.items?.length ?? 0) === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {receiptRow && (
        <ReceiptModal title="Account Booking Receipt" onClose={() => setReceiptRow(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-semibold">Mahadev Enterprises</div>
                <div className="text-xs text-slate-500">Courier Booking Receipt</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                Date: {String(receiptRow.bookingDate).slice(0, 10)}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="rounded-md border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Courier Number</div>
                <div className="font-medium">{receiptRow.courierNumber}</div>
              </div>
              <div className="rounded-md border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Customer</div>
                <div className="font-medium">{receiptRow.customerName}</div>
                {receiptRow.customerPhone && <div className="text-xs text-slate-500">{receiptRow.customerPhone}</div>}
              </div>
              <div className="rounded-md border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Status</div>
                <div className="font-medium">{receiptRow.status}</div>
              </div>
              <div className="rounded-md border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Remarks</div>
                <div className="font-medium">{receiptRow.remarks ?? '—'}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Note: Tracking link is shown after saving if courier company has a template.
            </div>
          </div>
        </ReceiptModal>
      )}

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

