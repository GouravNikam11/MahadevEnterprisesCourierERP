import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type ExportRow = Record<string, any>

export function downloadExcel(filename: string, sheetName: string, rows: ExportRow[]) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

export function downloadPdf(filename: string, title: string, rows: ExportRow[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFontSize(12)
  doc.text(title, 40, 30)

  const headers = rows.length ? Object.keys(rows[0]) : []
  const body = rows.map((r) => headers.map((h) => (r[h] == null ? '' : String(r[h]))))

  autoTable(doc, {
    startY: 44,
    head: [headers],
    body,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    theme: 'grid',
    margin: { left: 40, right: 40 },
  })

  doc.save(filename)
}

