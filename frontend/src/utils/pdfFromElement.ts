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
    scale: 2, // better text quality
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  })

  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let y = 0
  let remaining = imgHeight

  // Draw first page
  pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight)
  remaining -= pageHeight

  // If content is taller than a page, add pages and shift image up.
  while (remaining > 0) {
    pdf.addPage()
    y -= pageHeight
    pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight)
    remaining -= pageHeight
  }

  pdf.save(filename)
}

