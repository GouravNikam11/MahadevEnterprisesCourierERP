import jsPDF from 'jspdf'

type Html2Canvas = (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>

async function getHtml2Canvas(): Promise<Html2Canvas> {
  // lazy-load so initial app bundle stays smaller
  const mod: any = await import('html2canvas')
  return (mod?.default ?? mod) as Html2Canvas
}

/**
 * Export a DOM element to a multi-page A4 PDF, preserving the visual layout.
 * This is meant to match the Print view exactly.
 */
export async function downloadPdfFromElement(filename: string, el: HTMLElement) {
  const html2canvas = await getHtml2Canvas()

  const canvas = await html2canvas(el, {
    backgroundColor: '#ffffff',
    // Too high a scale can cause anti-aliased borders to look "double" when downscaled in PDF.
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 24

  const contentWidthPt = pageWidth - margin * 2
  const scalePtPerPx = contentWidthPt / canvas.width
  const pageContentHeightPx = Math.floor((pageHeight - margin * 2) / scalePtPerPx)

  const makeSlice = (sy: number, sh: number) => {
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sh
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) return null
    // Keep borders crisp (avoid smoothing that can produce "double" lines)
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh)
    return pageCanvas
  }

  let sy = 0
  let pageIndex = 0
  while (sy < canvas.height) {
    const sh = Math.min(pageContentHeightPx, canvas.height - sy)
    const slice = makeSlice(sy, sh)
    if (!slice) break

    const imgData = slice.toDataURL('image/png')
    const sliceHeightPt = sh * scalePtPerPx

    if (pageIndex > 0) pdf.addPage()
    // Lossless embedding keeps thin borders cleaner
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidthPt, sliceHeightPt, undefined, 'NONE')

    sy += sh
    pageIndex += 1
  }

  pdf.save(filename)
}

