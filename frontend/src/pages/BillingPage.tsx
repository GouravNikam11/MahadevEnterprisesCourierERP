import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { DataTable } from '../components/layout/DataTable'
import {
  alertErrorClass,
  btnPrimaryClass,
  btnSecondaryClass,
  cardClass,
  emptyCellClass,
  formGridClass,
  inputClass,
  labelClass,
  mutedTextClass,
  pageClass,
  selectClass,
  textPrimaryClass,
  textSecondaryClass,
} from '../components/layout/uiClasses'
import { lookupAccountParties, type LookupItem } from '../services/lookupApi'
import { generateInvoice, listInvoices, previewBilling } from '../services/billingApi'
import { downloadInvoiceCsv, downloadInvoiceExcel } from '../utils/invoiceExport'
import { ReceiptModal } from '../components/ReceiptModal'
import { InvoicePrint } from '../components/InvoicePrint'
import { downloadPdfFromElement } from '../utils/pdfFromElement'

export function BillingPage() {
  const [accountParties, setAccountParties] = useState<LookupItem[]>([])
  const [accountPartyId, setAccountPartyId] = useState('')
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [sacCode, setSacCode] = useState('996812')
  const [notes, setNotes] = useState('')

  const [preview, setPreview] = useState<any | null>(null)
  const [invoices, setInvoices] = useState<any[] | null>(null)
  const [showPrint, setShowPrint] = useState(false)
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState<string | null>(null)
  const [currentBillDate, setCurrentBillDate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('pdf')
  const printExportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([lookupAccountParties(), listInvoices()])
      .then(([ap, inv]) => {
        if (cancelled) return
        setAccountParties(ap)
        setInvoices(inv.items)
      })
      .catch((e) => {
        if (cancelled) return
        setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const runPreview = async () => {
    setError(null)
    setLoadingPreview(true)
    try {
      const d = await previewBilling(accountPartyId, from, to)
      setPreview(d)
      setCurrentInvoiceNo(null)
      setCurrentBillDate(null)
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to preview')
    } finally {
      setLoadingPreview(false)
    }
  }

  const onGenerate = async () => {
    setError(null)
    setLoadingGenerate(true)
    try {
      const created = await generateInvoice({
        accountPartyId,
        from,
        to,
        sacCode: sacCode.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      setInvoices((prev) => (prev ? [created.invoice, ...prev] : [created.invoice]))

      // keep the current preview rows but switch print/export to use the real invoice metadata
      setCurrentInvoiceNo(created.invoice?.invoiceNumber ?? null)
      setCurrentBillDate(String(created.invoice?.billDate ?? new Date().toISOString()).slice(0, 10))
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to generate')
    } finally {
      setLoadingGenerate(false)
    }
  }

  const onExport = () => {
    if (!printData) return
    const base = `billing-${from}-to-${to}`
    if (exportFormat === 'csv') return downloadInvoiceCsv(`${base}.csv`, printData)
    if (exportFormat === 'excel') return downloadInvoiceExcel(`${base}.xlsx`, printData)
    const el = printExportRef.current
    if (!el) return
    return downloadPdfFromElement(`${base}.pdf`, el)
  }

  const printData = useMemo(() => {
    if (!preview) return null
    return {
      companyName: 'MAHADEV ENTERPRISES',
      companyAddressLine: '2013, A WARD, RANKALA TOWER, EXCISE OFFICE, RANKALA TOWER CHOWK, KOLHAPUR - 416002',
      companyPhonesLine: 'MOB. 9834593123 / 9561237114',
      companyGstNo: '27GXMPK5825E1Z5',
      companyPanNo: 'GXMPK5825E',
      billNo: currentInvoiceNo ?? 'PREVIEW',
      billDate: currentBillDate ?? new Date().toISOString().slice(0, 10),
      periodFrom: preview.period?.from,
      periodTo: preview.period?.to,
      sacCode: sacCode.trim() || undefined,
      party: {
        name: preview.accountParty?.name,
        address: preview.accountParty?.address,
        phone: preview.accountParty?.phone,
        gstNumber: preview.accountParty?.gstNumber,
      },
      billMonthLabel: undefined,
      rows: (preview.rows ?? []).map((r: any) => ({
        bookingDate: r.bookingDate,
        customerName: r.customerName,
        courierName: r.courierName,
        courierNumber: r.courierNumber,
        destination: r.destination,
        weight: r.weight != null ? `${r.weight} ${r.weightUnit ?? 'KG'}` : r.weight,
        amount: r.amount,
      })),
      subtotal: preview.totals?.subtotal ?? 0,
      total: preview.totals?.total ?? 0,
    }
  }, [preview, sacCode, currentInvoiceNo, currentBillDate])

  return (
    <div className={pageClass}>
      <PageHeader
        title="Billing"
        subtitle="Generate Account Party invoices for any date range (Super Admin only)"
      />
      {error && <div className={alertErrorClass}>{error}</div>}

      <div className={cardClass}>
        <div className={formGridClass}>
          <div>
            <label className={labelClass}>Account Party *</label>
            <select className={selectClass} value={accountPartyId} onChange={(e) => setAccountPartyId(e.target.value)}>
              <option value="">Select</option>
              {accountParties.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>From *</label>
            <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>To *</label>
            <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>SAC Code</label>
            <input className={inputClass} value={sacCode} onChange={(e) => setSacCode(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Notes (optional)</label>
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <button
              type="button"
              className={btnPrimaryClass}
              onClick={runPreview}
              disabled={!accountPartyId || loadingPreview}
            >
              {loadingPreview ? 'Running…' : 'Preview'}
            </button>
            <button
              type="button"
              className={btnSecondaryClass}
              onClick={onGenerate}
              disabled={!accountPartyId || loadingGenerate}
            >
              {loadingGenerate ? 'Generating…' : 'Generate invoice'}
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <select className={`${selectClass} sm:w-[140px]`} value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)}>
              <option value="csv">CSV</option>
              <option value="excel">EXCEL</option>
              <option value="pdf">PDF</option>
            </select>
            <button type="button" className={btnSecondaryClass} onClick={onExport} disabled={!preview?.rows?.length}>
              Download
            </button>
            <button type="button" className={btnSecondaryClass} onClick={() => setShowPrint(true)} disabled={!preview?.rows?.length}>
              Print
            </button>
            <div className={`text-xs ${mutedTextClass}`}>{preview?.rows?.length ? `${preview.rows.length} rows` : ' '}</div>
          </div>
        </div>
      </div>

      {/* Off-screen render used for PDF download so it matches Print exactly */}
      {printData && (
        <div
          style={{
            position: 'fixed',
            left: -10000,
            top: 0,
            width: 900,
            background: 'white',
            padding: 0,
          }}
        >
          <div ref={printExportRef}>
            <InvoicePrint data={printData} />
          </div>
        </div>
      )}

      {preview && (
        <div className={cardClass}>
          <div className="mb-2 text-sm font-medium text-erp-text">
            Preview: {preview.accountParty?.name ?? ''} ({preview.period?.from} to {preview.period?.to})
          </div>
          <DataTable minWidth="1100px">
            <thead>
              <tr>
                <th>Sr.No</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Courier Name</th>
                <th>Courier No</th>
                <th>Destination</th>
                <th>Weight</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(preview.rows ?? []).map((r: any, i: number) => (
                <tr key={r.accountBookingId ?? i}>
                  <td className={textSecondaryClass}>{i + 1}</td>
                  <td className={textSecondaryClass}>{String(r.bookingDate).slice(0, 10)}</td>
                  <td className={textPrimaryClass}>{r.customerName}</td>
                  <td className={textSecondaryClass}>{r.courierName}</td>
                  <td className={textSecondaryClass}>{r.courierNumber}</td>
                  <td className={textSecondaryClass}>{r.destination ?? '—'}</td>
                  <td className={textSecondaryClass}>
                    {r.weight != null ? `${r.weight} ${r.weightUnit ?? 'KG'}` : '—'}
                  </td>
                  <td className="text-right text-erp-text">{r.amount ?? '—'}</td>
                </tr>
              ))}
              {(preview.rows ?? []).length === 0 && (
                <tr>
                  <td className={emptyCellClass} colSpan={8}>
                    No bookings found for selected range
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
          <div className="mt-3 flex justify-end gap-6 text-sm">
            <div className={textSecondaryClass}>Subtotal: <span className="font-medium text-erp-text">{preview.totals?.subtotal ?? 0}</span></div>
            <div className={textSecondaryClass}>Total: <span className="font-semibold text-erp-text">{preview.totals?.total ?? 0}</span></div>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <div className="mb-2 text-sm font-medium text-erp-text">Recent invoices</div>
        <DataTable minWidth="900px">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice #</th>
              <th>Account Party</th>
              <th>Period</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((inv: any) => (
              <tr key={inv.id}>
                <td className={textSecondaryClass}>{String(inv.billDate).slice(0, 10)}</td>
                <td className="font-medium text-erp-text">{inv.invoiceNumber}</td>
                <td className={textPrimaryClass}>{inv.accountParty?.name ?? '—'}</td>
                <td className={textSecondaryClass}>
                  {String(inv.periodFrom).slice(0, 10)} → {String(inv.periodTo).slice(0, 10)}
                </td>
                <td className="text-right text-erp-text">{inv.total ?? inv.subtotal ?? '—'}</td>
              </tr>
            ))}
            {(invoices ?? []).length === 0 && (
              <tr>
                <td className={emptyCellClass} colSpan={5}>
                  No invoices yet
                </td>
              </tr>
            )}
          </tbody>
        </DataTable>
      </div>

      {showPrint && printData && (
        <ReceiptModal title="Invoice" panelClassName="max-w-6xl" onClose={() => setShowPrint(false)}>
          <InvoicePrint data={printData} />
        </ReceiptModal>
      )}
    </div>
  )
}
