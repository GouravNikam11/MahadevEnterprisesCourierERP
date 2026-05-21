import { useState } from 'react'
import { api } from '../services/api'

export function ReportsPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/reports/daily-bookings', { params: { date } })
      setRows((res.data as any).data.rows)
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadCsv = () => {
    const url = `${import.meta.env.VITE_API_URL}/reports/daily-bookings?date=${encodeURIComponent(date)}&format=csv`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold">Reports</div>
        <div className="text-sm text-slate-500">Daily bookings (starter)</div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={run}
              disabled={loading}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Running…' : 'Run'}
            </button>
            <button
              onClick={downloadCsv}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              Download CSV
            </button>
          </div>
        </div>

        {rows && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Cash</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.date} className="border-t border-slate-100">
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3">{r.accountBookings}</td>
                    <td className="px-4 py-3">{r.cashBookings}</td>
                    <td className="px-4 py-3 font-medium">{r.totalBookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

