import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAccountBooking, listAccountBookings } from '../../services/bookingApi'
import { lookupAccountParties, lookupCourierCompanies, type LookupItem } from '../../services/lookupApi'
import { ReceiptModal } from '../../components/ReceiptModal'
import { DataTable } from '../../components/layout/DataTable'
import { PageHeader } from '../../components/layout/PageHeader'
import { PaginationBar } from '../../components/layout/PaginationBar'
import {
  btnPrimaryClass,
  btnSecondaryClass,
  alertErrorClass,
  alertInfoClass,
  btnTableActionClass,
  cardClass,
  cardMutedClass,
  emptyCellClass,
  mutedTextClass,
  receiptCellClass,
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

      <div className={cardClass}>
        <div className="mb-3 text-sm font-medium text-erp-text">New booking</div>
        <form className={formGridClass} onSubmit={form.handleSubmit(onCreate)}>
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
            <label className={labelClass}>Weight</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              {...form.register('weight')}
            />
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
          placeholder="Search by courier number / customer"
          className={`${inputClass} sm:max-w-md`}
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
          className={btnSecondaryClass}
        >
          Export CSV
        </button>
        <div className={`text-xs ${mutedTextClass}`}>{loading ? 'Loading…' : ' '}</div>
      </div>

      <DataTable minWidth="560px">
        <thead>
          <tr>
            <th>Date</th>
            <th>Courier #</th>
            <th>Customer</th>
            <th>Status</th>
            <th className="text-right">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((row) => (
            <tr key={row.id}>
              <td className={textSecondaryClass}>{String(row.bookingDate).slice(0, 10)}</td>
              <td className="font-medium text-erp-text">{row.courierNumber}</td>
              <td className={textPrimaryClass}>{row.customerName}</td>
              <td className={textSecondaryClass}>{row.status}</td>
              <td className="text-right">
                <button type="button" className={btnTableActionClass} onClick={() => setReceiptRow(row)}>
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
        <ReceiptModal title="Account Booking Receipt" onClose={() => setReceiptRow(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-semibold text-erp-text">Mahadev Enterprises</div>
                <div className={`text-xs ${mutedTextClass}`}>Courier Booking Receipt</div>
              </div>
              <div className={`text-right text-xs ${mutedTextClass}`}>
                Date: {String(receiptRow.bookingDate).slice(0, 10)}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className={receiptCellClass}>
                <div className={`text-xs ${mutedTextClass}`}>Courier Number</div>
                <div className="font-medium text-erp-text">{receiptRow.courierNumber}</div>
              </div>
              <div className={receiptCellClass}>
                <div className={`text-xs ${mutedTextClass}`}>Customer</div>
                <div className="font-medium text-erp-text">{receiptRow.customerName}</div>
                {receiptRow.customerPhone && <div className={`text-xs ${mutedTextClass}`}>{receiptRow.customerPhone}</div>}
              </div>
              <div className={receiptCellClass}>
                <div className={`text-xs ${mutedTextClass}`}>Status</div>
                <div className="font-medium text-erp-text">{receiptRow.status}</div>
              </div>
              <div className={receiptCellClass}>
                <div className={`text-xs ${mutedTextClass}`}>Remarks</div>
                <div className="font-medium text-erp-text">{receiptRow.remarks ?? '—'}</div>
              </div>
            </div>
            <div className={`text-xs ${mutedTextClass}`}>
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

