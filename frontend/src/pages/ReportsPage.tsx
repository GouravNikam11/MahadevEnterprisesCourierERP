import { useMemo, useState } from 'react'
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
import { downloadCsv } from '../utils/csv'
import { downloadExcel, downloadPdf } from '../utils/export'

export function ReportsPage() {
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')

  const exportRows = useMemo(() => {
    return (rows ?? []).map((r) => ({
      date: r.date,
      accountBookings: r.accountBookings,
      cashBookings: r.cashBookings,
      totalBookings: r.totalBookings,
    }))
  }, [rows])

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/reports/daily-bookings', { params: { from, to } })
      setRows((res.data as any).data.rows)
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const onExport = () => {
    const base = `daily-bookings-${from}-to-${to}`
    if (exportFormat === 'csv') return downloadCsv(`${base}.csv`, exportRows)
    if (exportFormat === 'excel') return downloadExcel(`${base}.xlsx`, 'DailyBookings', exportRows)
    return downloadPdf(`${base}.pdf`, 'Daily bookings', exportRows)
  }

  return (
    <div className={pageClass}>
      <PageHeader title="Reports" subtitle="Daily bookings (starter)" />

      {error && <div className={alertErrorClass}>{error}</div>}

      <div className={cardClass}>
        <div className={formGridClass}>
          <div>
            <label className={labelClass}>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <button type="button" onClick={run} disabled={loading} className={btnPrimaryClass}>
              {loading ? 'Running…' : 'Run'}
            </button>
            <select
              className={`${inputClass} sm:w-[140px]`}
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
            >
              <option value="csv">CSV</option>
              <option value="excel">EXCEL</option>
              <option value="pdf">PDF</option>
            </select>
            <button type="button" onClick={onExport} className={btnSecondaryClass} disabled={!rows?.length}>
              Download
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
