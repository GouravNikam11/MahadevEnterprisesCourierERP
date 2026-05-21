import { useEffect } from 'react'

export function ReceiptModal(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [props])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={props.onClose}>
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-medium">{props.title}</div>
          <button
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
            onClick={props.onClose}
          >
            Close
          </button>
        </div>
        <div className="p-4">
          <div className="print:p-0">{props.children}</div>
          <div className="mt-4 flex justify-end gap-2 print:hidden">
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => window.print()}
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

