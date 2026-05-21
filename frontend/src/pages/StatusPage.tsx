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
        <div className="text-2xl font-semibold">Courier Status</div>
        <div className="text-sm text-slate-500">Update status and view timeline history</div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-medium">Update status</div>
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Booking type</label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
              {...form.register('bookingType')}
            >
              <option value="account">Account booking</option>
              <option value="cash">Cash booking</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Booking ID *</label>
            <input
              placeholder="UUID"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              {...form.register('bookingId')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
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
              {form.formState.isSubmitting ? 'Updating…' : 'Update status'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-medium">Timeline</div>
        {!timeline && <div className="text-sm text-slate-500">Submit a status update to load timeline.</div>}
        {timeline && timeline.length === 0 && <div className="text-sm text-slate-500">No timeline found.</div>}
        {timeline && timeline.length > 0 && (
          <div className="space-y-2">
            {timeline.map((t) => (
              <div key={t.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{t.status}</div>
                  <div className="text-xs text-slate-500">{String(t.occurredAt).replace('T', ' ').slice(0, 19)}</div>
                </div>
                {t.remarks && <div className="mt-1 text-slate-600">{t.remarks}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

