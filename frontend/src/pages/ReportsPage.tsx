import { useState } from 'react'
import { api } from '../services/api'
import { DataTable } from '../components/layout/DataTable'
import { PageHeader } from '../components/layout/PageHeader'
import {
  alertErrorClass,
  btnPrimaryClass,
  btnSecondaryClass,
  cardClass,
  formGridClass,
  inputClass,
  labelClass,
  pageClass,
  textPrimaryClass,
} from '../components/layout/uiClasses'

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
    <div className={pageClass}>
      <PageHeader title="Reports" subtitle="Daily bookings (starter)" />

      {error && <div className={alertErrorClass}>{error}</div>}

      <div className={cardClass}>
        <div className={formGridClass}>
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <button type="button" onClick={run} disabled={loading} className={btnPrimaryClass}>
              {loading ? 'Running…' : 'Run'}
            </button>
            <button type="button" onClick={downloadCsv} className={btnSecondaryClass}>
              Download CSV
            </button>
          </div>
        </div>

        {rows && (
          <div className="mt-4">
            <DataTable minWidth="480px">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Account</th>
                  <th>Cash</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.date}>
                    <td className={textPrimaryClass}>{r.date}</td>
                    <td>{r.accountBookings}</td>
                    <td>{r.cashBookings}</td>
                    <td className="font-medium text-erp-text">{r.totalBookings}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        )}
      </div>
    </div>
  )
}
