import { useEffect } from 'react'
import { btnPrimaryClass, btnSecondaryClass } from './layout/uiClasses'

export function ReceiptModal(props: {
  title: string
  onClose: () => void
  children: React.ReactNode
  panelClassName?: string
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [props])

  return (
    <div className="erp-modal-overlay" onMouseDown={props.onClose} role="presentation">
      <div
        className={`erp-modal-panel erp-modal-panel-print ${props.panelClassName ?? ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="erp-modal-header">
          <div className="text-sm font-medium text-erp-text">{props.title}</div>
          <button type="button" className={btnSecondaryClass + ' !min-h-[32px] !w-auto !px-2 !py-1 !text-xs'} onClick={props.onClose}>
            Close
          </button>
        </div>
        <div className="p-4 text-erp-text">
          <div className="print:p-0">{props.children}</div>
          <div className="mt-4 flex flex-col gap-2 justify-end sm:flex-row print:hidden">
            <button type="button" className={btnSecondaryClass} onClick={() => window.print()}>
              Print
            </button>
            <button type="button" className={btnPrimaryClass + ' sm:hidden'} onClick={props.onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
