import type { ReactNode } from 'react'
import { tableClass, tableWrapClass } from './uiClasses'

type DataTableProps = {
  children: ReactNode
  minWidth?: string
}

/** Horizontally scrollable table wrapper for small screens. */
export function DataTable({ children, minWidth = '640px' }: DataTableProps) {
  return (
    <div className={tableWrapClass}>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className={tableClass} style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  )
}
