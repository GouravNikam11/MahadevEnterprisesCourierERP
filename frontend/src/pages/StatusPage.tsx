import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../services/api'

const schema = z.object({
  bookingType: z.enum(['account', 'cash']),
  bookingId: z.string().uuid(),
  status: z.enum([
    'BOOKED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'NOT_DELIVERED',
    'RETURNED',
    'CANCELLED',
  ]),
  remarks: z.string().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export function StatusPage() {
  const [timeline, setTimeline] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: { bookingType: 'account', bookingId: '', status: 'IN_TRANSIT', remarks: '' },
  })

  const refreshTimeline = async (bookingType: string, bookingId: string) => {
    const res = await api.get('/status/timeline', { params: { bookingType, bookingId } })
    setTimeline((res.data as any).data.items)
  }

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setTimeline(null)
    try {
      await api.post('/status', values)
      await refreshTimeline(values.bookingType, values.bookingId)
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="erp-page-title">Courier Status</div>
        <div className="erp-muted">Update status and view timeline history</div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-card">
        <div className="mb-3 text-sm font-medium">Update status</div>
        <form className="erp-form-grid" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="erp-label">Booking type</label>
            <select
              className="erp-input"
              {...form.register('bookingType')}
            >
              <option value="account">Account booking</option>
              <option value="cash">Cash booking</option>
            </select>
          </div>
          <div>
            <label className="erp-label">Booking ID *</label>
            <input
              placeholder="UUID"
              className="erp-input"
              {...form.register('bookingId')}
            />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select
              className="erp-input"
              {...form.register('status')}
            >
              {schema.shape.status.options.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Remarks</label>
            <input
              className="erp-input"
              {...form.register('remarks')}
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="erp-btn-primary"
            >
              {form.formState.isSubmitting ? 'Updating…' : 'Update status'}
            </button>
          </div>
        </form>
      </div>

      <div className="erp-card">
        <div className="mb-3 text-sm font-medium">Timeline</div>
        {!timeline && <div className="erp-muted">Submit a status update to load timeline.</div>}
        {timeline && timeline.length === 0 && <div className="erp-muted">No timeline found.</div>}
        {timeline && timeline.length > 0 && (
          <div className="space-y-2">
            {timeline.map((t) => (
              <div key={t.id} className="rounded-md border border-erp-border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{t.status}</div>
                  <div className="text-xs erp-muted">{String(t.occurredAt).replace('T', ' ').slice(0, 19)}</div>
                </div>
                {t.remarks && <div className="mt-1 text-erp-muted">{t.remarks}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

