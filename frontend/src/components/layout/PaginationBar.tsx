import { btnSecondaryClass, paginationClass } from './uiClasses'

type PaginationBarProps = {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export function PaginationBar({ page, totalPages, onPrev, onNext }: PaginationBarProps) {
  return (
    <div className={paginationClass}>
      <div className="text-xs text-erp-muted">
        Page {page} of {totalPages}
      </div>
      <div className="flex w-full gap-2 sm:w-auto">
        <button type="button" className={btnSecondaryClass} disabled={page <= 1} onClick={onPrev}>
          Prev
        </button>
        <button type="button" className={btnSecondaryClass} disabled={page >= totalPages} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  )
}
