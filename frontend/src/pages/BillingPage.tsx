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
import {
  createInvoiceItem,
  deleteInvoice,
  deleteInvoiceItem,
  generateInvoice,
  getInvoice,
  listInvoices,
  previewBilling,
  updateInvoice,
  updateInvoiceItem,
} from '../services/billingApi'
import { downloadInvoiceCsv, downloadInvoiceExcel } from '../utils/invoiceExport'
import { ReceiptModal } from '../components/ReceiptModal'
import { InvoicePrint } from '../components/InvoicePrint'
import { downloadPdfFromElement } from '../utils/pdfFromElement'
import { PaginationBar } from '../components/layout/PaginationBar'

export function BillingPage() {
  const [accountParties, setAccountParties] = useState<LookupItem[]>([])
  const [accountPartyId, setAccountPartyId] = useState('')
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [sacCode, setSacCode] = useState('996812')
  const [notes, setNotes] = useState('')
  const [cgstPct, setCgstPct] = useState(9)
  const [sgstPct, setSgstPct] = useState(9)

  const [preview, setPreview] = useState<any | null>(null)
  const [invoices, setInvoices] = useState<any[] | null>(null)
  const [showPrint, setShowPrint] = useState(false)
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState<string | null>(null)
  const [currentBillDate, setCurrentBillDate] = useState<string | null>(null)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [previewSearch, setPreviewSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [loadingInvoiceAction, setLoadingInvoiceAction] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('pdf')
  const printExportRef = useRef<HTMLDivElement | null>(null)
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null)
  const [rowDraft, setRowDraft] = useState<any | null>(null)
  const [tempRowSeq, setTempRowSeq] = useState(1)

  const [previewPage, setPreviewPage] = useState(1)
  const previewPageSize = 10
  const [invoicePage, setInvoicePage] = useState(1)
  const invoicePageSize = 10
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1)

  const filteredPreviewRows = useMemo(() => {
    const rows = (preview?.rows ?? []) as any[]
    const s = previewSearch.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r: any) => {
      const hay = [
        r.customerName,
        r.courierName,
        r.courierNumber,
        r.destination,
        r.weight != null ? `${r.weight} ${r.weightUnit ?? 'KG'}` : '',
        r.amount,
      ]
        .filter((x) => x != null)
        .join(' ')
        .toLowerCase()
      return hay.includes(s)
    })
  }, [preview?.rows, previewSearch])

  const previewTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredPreviewRows.length / previewPageSize))
  }, [filteredPreviewRows.length])

  const pagedPreviewRows = useMemo(() => {
    const start = (previewPage - 1) * previewPageSize
    return filteredPreviewRows.slice(start, start + previewPageSize)
  }, [filteredPreviewRows, previewPage])

  useEffect(() => {
    let cancelled = false
    Promise.all([lookupAccountParties(), listInvoices({ page: invoicePage, pageSize: invoicePageSize, q: invoiceSearch.trim() || undefined })])
      .then(([ap, inv]) => {
        if (cancelled) return
        setAccountParties(ap)
        setInvoices(inv.items)
        setInvoiceTotalPages(inv.totalPages ?? 1)
      })
      .catch((e) => {
        if (cancelled) return
        setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [invoicePage])

  useEffect(() => {
    // When searching invoices, jump to first page
    setInvoicePage(1)
  }, [invoiceSearch])

  useEffect(() => {
    // When preview search changes, jump to first page
    setPreviewPage(1)
  }, [previewSearch])

  const runPreview = async () => {
    setError(null)
    setLoadingPreview(true)
    try {
      const d = await previewBilling(accountPartyId, from, to)
      setPreview(d)
      setCurrentInvoiceNo(null)
      setCurrentBillDate(null)
      setEditingInvoiceId(null)
      setPreviewSearch('')
      setPreviewPage(1)
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to preview')
    } finally {
      setLoadingPreview(false)
    }
  }

  const startEditRow = (row: any) => {
    const key = row.invoiceItemId ?? row.tempId ?? row.accountBookingId ?? `${row.courierNumber}-${String(row.bookingDate)}`
    setEditingRowKey(String(key))
    setRowDraft({
      ...row,
      bookingDate: String(row.bookingDate).slice(0, 10),
      amount: row.amount ?? 0,
      weightUnit: row.weightUnit ?? 'KG',
    })
  }

  const cancelEditRow = () => {
    setEditingRowKey(null)
    setRowDraft(null)
  }

  const applyLocalRowUpdate = (key: string, next: any) => {
    setPreview((p: any) => {
      if (!p) return p
      const rows = (p.rows ?? []).map((r: any) => {
        const k = String(r.invoiceItemId ?? r.tempId ?? r.accountBookingId ?? `${r.courierNumber}-${String(r.bookingDate)}`)
        return k === key ? { ...r, ...next } : r
      })
      const subtotal = rows.reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0)
      return { ...p, rows, totals: { ...p.totals, subtotal, total: subtotal } }
    })
  }

  const deleteLocalRow = (key: string) => {
    setPreview((p: any) => {
      if (!p) return p
      const rows = (p.rows ?? []).filter((r: any) => {
        const k = String(r.invoiceItemId ?? r.tempId ?? r.accountBookingId ?? `${r.courierNumber}-${String(r.bookingDate)}`)
        return k !== key
      })
      const subtotal = rows.reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0)
      return { ...p, rows, totals: { ...p.totals, subtotal, total: subtotal } }
    })
  }

  const saveRowEdit = async () => {
    if (!preview || !rowDraft || !editingRowKey) return

    // If we're editing a saved invoice, persist to backend invoice_items
    if (editingInvoiceId && rowDraft.invoiceItemId) {
      setLoadingInvoiceAction(true)
      try {
        const { invoice } = await updateInvoiceItem(editingInvoiceId, rowDraft.invoiceItemId, {
          bookingDate: rowDraft.bookingDate,
          customerName: rowDraft.customerName,
          courierName: rowDraft.courierName,
          courierNumber: rowDraft.courierNumber,
          destination: rowDraft.destination,
          weight: rowDraft.weight,
          weightUnit: rowDraft.weightUnit,
          amount: rowDraft.amount,
        })
        // refresh totals + list
        setInvoices((prev) => (prev ? prev.map((x) => (x.id === invoice.id ? invoice : x)) : prev))
        setPreview((p: any) =>
          p
            ? {
                ...p,
                totals: { ...p.totals, subtotal: Number(invoice.subtotal ?? p.totals?.subtotal ?? 0), total: Number(invoice.total ?? p.totals?.total ?? 0) },
                rows: (p.rows ?? []).map((r: any) =>
                  r.invoiceItemId === rowDraft.invoiceItemId ? { ...r, ...rowDraft } : r,
                ),
              }
            : p,
        )
      } finally {
        setLoadingInvoiceAction(false)
      }
    } else {
      applyLocalRowUpdate(editingRowKey, rowDraft)
    }

    cancelEditRow()
  }

  const deleteRow = async (row: any) => {
    const key = String(row.invoiceItemId ?? row.tempId ?? row.accountBookingId ?? `${row.courierNumber}-${String(row.bookingDate)}`)
    if (!window.confirm('Delete this row from preview?')) return

    if (editingInvoiceId && row.invoiceItemId) {
      setLoadingInvoiceAction(true)
      try {
        const { invoice } = await deleteInvoiceItem(editingInvoiceId, row.invoiceItemId)
        setInvoices((prev) => (prev ? prev.map((x) => (x.id === invoice.id ? invoice : x)) : prev))
        deleteLocalRow(key)
        setPreview((p: any) =>
          p ? { ...p, totals: { ...p.totals, subtotal: Number(invoice.subtotal ?? 0), total: Number(invoice.total ?? 0) } } : p,
        )
      } finally {
        setLoadingInvoiceAction(false)
      }
    } else {
      deleteLocalRow(key)
    }
  }

  const onAddRow = async () => {
    if (!preview) return
    const tempId = `tmp-${tempRowSeq}`
    setTempRowSeq((x) => x + 1)

    const newRow: any = {
      tempId,
      bookingDate: new Date().toISOString().slice(0, 10),
      customerName: '',
      courierName: '',
      courierNumber: '',
      destination: '',
      weight: '',
      weightUnit: 'KG',
      amount: 0,
    }

    // If editing a saved invoice, create the row in DB immediately and load back with invoiceItemId
    if (editingInvoiceId) {
      setLoadingInvoiceAction(true)
      try {
        const { item, invoice } = await createInvoiceItem(editingInvoiceId, newRow)
        setInvoices((prev) => (prev ? prev.map((x) => (x.id === invoice.id ? invoice : x)) : prev))
        setPreview((p: any) =>
          p
            ? {
                ...p,
                rows: [
                  ...p.rows,
                  {
                    invoiceItemId: item.id,
                    accountBookingId: item.accountBookingId,
                    bookingDate: item.bookingDate,
                    customerName: item.customerName,
                    courierName: item.courierName,
                    courierNumber: item.courierNumber,
                    destination: item.destination,
                    weight: item.weight,
                    weightUnit: item.weightUnit ?? 'KG',
                    amount: item.amount,
                  },
                ],
                totals: { ...p.totals, subtotal: Number(invoice.subtotal ?? p.totals?.subtotal ?? 0), total: Number(invoice.total ?? p.totals?.total ?? 0) },
              }
            : p,
        )
      } finally {
        setLoadingInvoiceAction(false)
      }
      return
    }

    setPreview((p: any) => (p ? { ...p, rows: [...(p.rows ?? []), newRow] } : p))
    startEditRow(newRow)
  }

  const onGenerate = async () => {
    setError(null)
    setLoadingGenerate(true)
    try {
      const payload: any = {
        accountPartyId,
        from,
        to,
        sacCode: sacCode.trim() || undefined,
        notes: notes.trim() || undefined,
        cgstPct,
        sgstPct,
        // If user edited preview rows locally, persist exactly those rows
        items: (preview?.rows ?? []).map((r: any) => ({
          accountBookingId: r.accountBookingId ?? null,
          bookingDate: r.bookingDate,
          customerName: r.customerName,
          courierName: r.courierName,
          courierNumber: r.courierNumber,
          destination: r.destination,
          weight: r.weight,
          weightUnit: r.weightUnit ?? 'KG',
          amount: r.amount,
        })),
      }
      const created = await generateInvoice(payload)
      setInvoices((prev) => (prev ? [created.invoice, ...prev] : [created.invoice]))

      // keep the current preview rows but switch print/export to use the real invoice metadata
      setCurrentInvoiceNo(created.invoice?.invoiceNumber ?? null)
      setCurrentBillDate(String(created.invoice?.billDate ?? new Date().toISOString()).slice(0, 10))
      setEditingInvoiceId(created.invoice?.id ?? null)
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to generate')
    } finally {
      setLoadingGenerate(false)
    }
  }

  const loadInvoiceToPreview = async (id: string) => {
    setError(null)
    setLoadingInvoiceAction(true)
    try {
      const { invoice } = await getInvoice(id)
      setEditingInvoiceId(invoice.id)
      setAccountPartyId(invoice.accountPartyId)
      setFrom(String(invoice.periodFrom).slice(0, 10))
      setTo(String(invoice.periodTo).slice(0, 10))
      setSacCode(invoice.sacCode ?? '996812')
      setNotes(invoice.notes ?? '')
      setCgstPct(Number(invoice.cgstPct ?? 9))
      setSgstPct(Number(invoice.sgstPct ?? 9))

      setCurrentInvoiceNo(invoice.invoiceNumber ?? null)
      setCurrentBillDate(String(invoice.billDate).slice(0, 10))
      setPreviewSearch('')
      setPreviewPage(1)

      setPreview({
        accountParty: invoice.accountParty,
        period: { from: String(invoice.periodFrom).slice(0, 10), to: String(invoice.periodTo).slice(0, 10) },
        rows: (invoice.items ?? []).map((it: any) => ({
          invoiceItemId: it.id,
          accountBookingId: it.accountBookingId,
          bookingDate: it.bookingDate,
          customerName: it.customerName,
          courierName: it.courierName,
          courierNumber: it.courierNumber,
          destination: it.destination,
          weight: it.weight,
          weightUnit: it.weightUnit ?? 'KG',
          amount: it.amount,
        })),
        totals: { subtotal: Number(invoice.subtotal ?? 0), total: Number(invoice.total ?? 0) },
      })
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to load invoice')
    } finally {
      setLoadingInvoiceAction(false)
    }
  }

  const onSaveInvoiceEdits = async () => {
    if (!editingInvoiceId) return
    setError(null)
    setLoadingInvoiceAction(true)
    try {
      const { invoice } = await updateInvoice(editingInvoiceId, {
        sacCode: sacCode.trim() || undefined,
        notes: notes.trim() || undefined,
        cgstPct,
        sgstPct,
      })
      setInvoices((prev) => (prev ? prev.map((x) => (x.id === invoice.id ? invoice : x)) : prev))
      setCurrentInvoiceNo(invoice.invoiceNumber ?? null)
      setCurrentBillDate(String(invoice.billDate).slice(0, 10))
      // refresh preview totals
      setPreview((p: any) => (p ? { ...p, totals: { ...p.totals, total: Number(invoice.total ?? p.totals?.total ?? 0) } } : p))
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to save')
    } finally {
      setLoadingInvoiceAction(false)
    }
  }

  const onDeleteInvoice = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) return
    setError(null)
    setLoadingInvoiceAction(true)
    try {
      await deleteInvoice(id)
      setInvoices((prev) => (prev ? prev.filter((x) => x.id !== id) : prev))
      if (editingInvoiceId === id) {
        setEditingInvoiceId(null)
        setCurrentInvoiceNo(null)
        setCurrentBillDate(null)
      }
    } catch (e) {
      setError((e as any)?.response?.data?.message ?? (e as any)?.message ?? 'Failed to delete')
    } finally {
      setLoadingInvoiceAction(false)
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
      cgstPct,
      sgstPct,
      remark: notes.trim() || undefined,
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
  }, [preview, sacCode, currentInvoiceNo, currentBillDate, notes, cgstPct, sgstPct])

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
          <div>
            <label className={labelClass}>CGST %</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={cgstPct}
              onChange={(e) => setCgstPct(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>SGST %</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={sgstPct}
              onChange={(e) => setSgstPct(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Remark/Notes (optional)</label>
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
            {editingInvoiceId && (
              <button
                type="button"
                className={btnSecondaryClass}
                onClick={onSaveInvoiceEdits}
                disabled={loadingInvoiceAction}
              >
                {loadingInvoiceAction ? 'Saving…' : 'Save changes'}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <select className={`${selectClass} sm:w-[140px]`} value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)}>
              <option value="csv">CSV</option>
              <option value="excel">EXCEL</option>
              <option value="pdf">PDF</option>
            </select>
            <button type="button" className={btnSecondaryClass} onClick={onExport} disabled={!editingInvoiceId}>
              Download
            </button>
            <button type="button" className={btnSecondaryClass} onClick={() => setShowPrint(true)} disabled={!editingInvoiceId}>
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
            // Render at an A4-ish width so the PDF is crisp and well-proportioned.
            // (A4 at 96dpi ≈ 794px wide)
            width: 794,
            background: 'white',
            padding: 0,
          }}
        >
          <div ref={printExportRef} className="pdf-export">
            <InvoicePrint data={printData} />
          </div>
        </div>
      )}

      {preview && (
        <div className={cardClass}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium text-erp-text">
              Preview: {preview.accountParty?.name ?? ''} ({preview.period?.from} to {preview.period?.to})
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                placeholder="Search customer / courier / destination / weight / amount"
                className={`${inputClass} sm:w-[360px]`}
              />
              <button type="button" className={btnSecondaryClass} onClick={onAddRow} disabled={!preview || loadingInvoiceAction}>
                Add row
              </button>
            </div>
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
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedPreviewRows.map((r: any, i: number) => {
                const key = String(r.invoiceItemId ?? r.tempId ?? r.accountBookingId ?? `${r.courierNumber}-${String(r.bookingDate)}`)
                const isEditing = editingRowKey === key
                return (
                <tr key={key}>
                  <td className={textSecondaryClass}>{(previewPage - 1) * previewPageSize + i + 1}</td>
                  <td className={textSecondaryClass}>
                    {isEditing ? (
                      <input className={inputClass} type="date" value={rowDraft?.bookingDate ?? ''} onChange={(e)=>setRowDraft((d:any)=>({...(d??{}),bookingDate:e.target.value}))}/>
                    ) : (
                      String(r.bookingDate).slice(0, 10)
                    )}
                  </td>
                  <td className={textPrimaryClass}>
                    {isEditing ? (
                      <input className={inputClass} value={rowDraft?.customerName ?? ''} onChange={(e)=>setRowDraft((d:any)=>({...(d??{}),customerName:e.target.value}))}/>
                    ) : (
                      r.customerName
                    )}
                  </td>
                  <td className={textSecondaryClass}>
                    {isEditing ? (
                      <input className={inputClass} value={rowDraft?.courierName ?? ''} onChange={(e)=>setRowDraft((d:any)=>({...(d??{}),courierName:e.target.value}))}/>
                    ) : (
                      r.courierName
                    )}
                  </td>
                  <td className={textSecondaryClass}>
                    {isEditing ? (
                      <input className={inputClass} value={rowDraft?.courierNumber ?? ''} onChange={(e)=>setRowDraft((d:any)=>({...(d??{}),courierNumber:e.target.value}))}/>
                    ) : (
                      r.courierNumber
                    )}
                  </td>
                  <td className={textSecondaryClass}>
                    {isEditing ? (
                      <input className={inputClass} value={rowDraft?.destination ?? ''} onChange={(e)=>setRowDraft((d:any)=>({...(d??{}),destination:e.target.value}))}/>
                    ) : (
                      r.destination ?? '—'
                    )}
                  </td>
                  <td className={textSecondaryClass}>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input className={inputClass} type="number" step="0.01" value={rowDraft?.weight ?? ''} onChange={(e)=>setRowDraft((d:any)=>({...(d??{}),weight:e.target.value}))}/>
                        <select className={`${selectClass} w-[90px]`} value={rowDraft?.weightUnit ?? 'KG'} onChange={(e)=>setRowDraft((d:any)=>({...(d??{}),weightUnit:e.target.value}))}>
                          <option value="KG">KG</option>
                          <option value="GM">GM</option>
                        </select>
                      </div>
                    ) : (
                      r.weight != null ? `${r.weight} ${r.weightUnit ?? 'KG'}` : '—'
                    )}
                  </td>
                  <td className="text-right text-erp-text">
                    {isEditing ? (
                      <input className={inputClass} type="number" step="0.01" value={rowDraft?.amount ?? 0} onChange={(e)=>setRowDraft((d:any)=>({...(d??{}),amount:e.target.value}))}/>
                    ) : (
                      r.amount ?? '—'
                    )}
                  </td>
                  <td className="text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <button type="button" className={btnSecondaryClass + ' !min-h-[30px] !px-2 !py-1 !text-xs'} disabled={loadingInvoiceAction} onClick={saveRowEdit}>Save</button>
                        <button type="button" className={btnSecondaryClass + ' !min-h-[30px] !px-2 !py-1 !text-xs'} onClick={cancelEditRow}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button type="button" className={btnSecondaryClass + ' !min-h-[30px] !px-2 !py-1 !text-xs'} onClick={()=>startEditRow(r)}>Edit</button>
                        <button type="button" className={btnSecondaryClass + ' !min-h-[30px] !px-2 !py-1 !text-xs'} onClick={()=>deleteRow(r)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              )})}
              {pagedPreviewRows.length === 0 && (
                <tr>
                  <td className={emptyCellClass} colSpan={9}>
                    No matching records
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
          <PaginationBar
            page={previewPage}
            totalPages={previewTotalPages}
            onPrev={() => setPreviewPage((p) => Math.max(1, p - 1))}
            onNext={() => setPreviewPage((p) => Math.min(previewTotalPages, p + 1))}
          />
          <div className="mt-3 flex justify-end gap-6 text-sm">
            <div className={textSecondaryClass}>Subtotal: <span className="font-medium text-erp-text">{preview.totals?.subtotal ?? 0}</span></div>
            <div className={textSecondaryClass}>Total: <span className="font-semibold text-erp-text">{preview.totals?.total ?? 0}</span></div>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-medium text-erp-text">Recent invoices</div>
          <input
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
            placeholder="Search invoice / party / period"
            className={`${inputClass} sm:max-w-sm`}
          />
        </div>
        <DataTable minWidth="900px">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice #</th>
              <th>Account Party</th>
              <th>Period</th>
              <th className="text-right">Total</th>
              <th className="text-right">Actions</th>
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
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className={btnSecondaryClass + ' !min-h-[30px] !px-2 !py-1 !text-xs'}
                      disabled={loadingInvoiceAction}
                      onClick={() => loadInvoiceToPreview(inv.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={btnSecondaryClass + ' !min-h-[30px] !px-2 !py-1 !text-xs'}
                      disabled={loadingInvoiceAction}
                      onClick={() => onDeleteInvoice(inv.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(invoices ?? []).length === 0 && (
              <tr>
                <td className={emptyCellClass} colSpan={6}>
                  No invoices yet
                </td>
              </tr>
            )}
          </tbody>
        </DataTable>
        <PaginationBar
          page={invoicePage}
          totalPages={invoiceTotalPages}
          onPrev={() => setInvoicePage((p) => Math.max(1, p - 1))}
          onNext={() => setInvoicePage((p) => Math.min(invoiceTotalPages, p + 1))}
        />
      </div>

      {showPrint && printData && (
        <ReceiptModal title="Invoice" panelClassName="max-w-6xl" onClose={() => setShowPrint(false)}>
          <InvoicePrint data={printData} />
        </ReceiptModal>
      )}
    </div>
  )
}
