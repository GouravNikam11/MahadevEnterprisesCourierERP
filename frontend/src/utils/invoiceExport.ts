import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { InvoicePrintData } from '../components/InvoicePrint'

function escapeCsv(v: any) {
  const s = v == null ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

function toAoa(data: InvoicePrintData) {
  const aoa: any[][] = []

  // Header block (same intent as print layout)
  aoa.push([data.companyName])
  aoa.push([data.companyAddressLine])
  if (data.companyPhonesLine) aoa.push([data.companyPhonesLine])
  aoa.push([data.companyGstNo ? `GST NO.${data.companyGstNo}` : '', data.companyPanNo ? `PAN NO. ${data.companyPanNo}` : ''])
  aoa.push([])
  aoa.push(['TO', '', '', '', 'BILL NO.', data.billNo])
  aoa.push([data.party.name ?? ''])
  if (data.party.address) aoa.push([data.party.address])
  if (data.party.phone) aoa.push([`MOB.${data.party.phone}`])
  if (data.party.gstNumber) aoa.push([`GST NO.${data.party.gstNumber}`])
  aoa.push(['', '', '', '', 'BILL DATE :-', data.billDate])
  aoa.push(['', '', '', '', 'BILL PERIOD :-', `${data.periodFrom} TO ${data.periodTo}`])
  aoa.push(['', '', '', '', 'SAC CODE :-', data.sacCode ?? ''])
  aoa.push([])
  if (data.billMonthLabel) aoa.push([`BILL MONTH OF - ${data.billMonthLabel}`])
  else aoa.push([''])
  aoa.push([])

  const headers = ['SR.NO', 'DATE', 'CUSTOMER NAME', 'COURIER NAME', 'COURIER NO', 'DESTINATION', 'WEIGHT', 'AMOUNT']
  aoa.push(headers)

  data.rows.forEach((r, i) => {
    aoa.push([
      i + 1,
      String(r.bookingDate).slice(0, 10),
      r.customerName,
      r.courierName,
      r.courierNumber,
      r.destination ?? '',
      r.weight ?? '',
      r.amount ?? '',
    ])
  })

  aoa.push([])
  aoa.push(['', '', '', '', '', '', 'SUBTOTAL', data.subtotal ?? ''])
  aoa.push(['', '', '', '', '', '', 'TOTAL', data.total ?? ''])

  return aoa
}

export function downloadInvoiceCsv(filename: string, data: InvoicePrintData) {
  const aoa = toAoa(data)
  const csv = aoa.map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadInvoiceExcel(filename: string, data: InvoicePrintData) {
  const aoa = toAoa(data)
  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Basic widths so it prints nicely
  ws['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
  ]

  // Merge a few top rows for title look (best-effort; Excel rendering varies)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Invoice')
  XLSX.writeFile(wb, filename)
}

export function downloadInvoicePdf(filename: string, data: InvoicePrintData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  let y = 36
  doc.setFontSize(14)
  doc.text(data.companyName, 297.5, y, { align: 'center' })
  y += 16

  doc.setFontSize(9)
  doc.text(data.companyAddressLine, 297.5, y, { align: 'center' })
  y += 12
  if (data.companyPhonesLine) {
    doc.text(data.companyPhonesLine, 297.5, y, { align: 'center' })
    y += 12
  }
  doc.text(`${data.companyGstNo ? `GST NO.${data.companyGstNo}` : ''}    ${data.companyPanNo ? `PAN NO. ${data.companyPanNo}` : ''}`, 297.5, y, {
    align: 'center',
  })
  y += 18

  doc.setFontSize(10)
  doc.text(`TO: ${data.party.name ?? ''}`, 40, y)
  doc.text(`BILL NO.: ${data.billNo}`, 360, y)
  y += 12
  if (data.party.address) {
    doc.text(String(data.party.address), 40, y)
    y += 12
  }
  if (data.party.phone) {
    doc.text(`MOB.${data.party.phone}`, 40, y)
    y += 12
  }
  if (data.party.gstNumber) {
    doc.text(`GST NO.${data.party.gstNumber}`, 40, y)
    y += 12
  }

  doc.text(`BILL DATE :- ${data.billDate}`, 360, y - 24)
  doc.text(`BILL PERIOD :- ${data.periodFrom} TO ${data.periodTo}`, 360, y - 12)
  doc.text(`SAC CODE :- ${data.sacCode ?? ''}`, 360, y)
  y += 12

  if (data.billMonthLabel) {
    y += 6
    doc.setFontSize(10)
    doc.text(`BILL MONTH OF - ${data.billMonthLabel}`, 297.5, y, { align: 'center' })
    y += 10
  }

  const headers = ['SR.NO', 'DATE', 'CUSTOMER NAME', 'COURIER NAME', 'COURIER NO', 'DESTINATION', 'WEIGHT', 'AMOUNT']
  const body = data.rows.map((r, i) => [
    String(i + 1),
    String(r.bookingDate).slice(0, 10),
    r.customerName ?? '',
    r.courierName ?? '',
    r.courierNumber ?? '',
    r.destination ?? '',
    r.weight == null ? '' : String(r.weight),
    r.amount == null ? '' : String(r.amount),
  ])

  autoTable(doc, {
    startY: y + 8,
    head: [headers],
    body,
    styles: { fontSize: 8, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.7 },
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.7 },
    theme: 'grid',
    margin: { left: 40, right: 40 },
  })

  const endY = (doc as any).lastAutoTable?.finalY ?? 740
  doc.setFontSize(10)
  doc.text(`SUBTOTAL: ${data.subtotal ?? ''}`, 430, endY + 18)
  doc.text(`TOTAL: ${data.total ?? ''}`, 430, endY + 32)

  doc.save(filename)
}

