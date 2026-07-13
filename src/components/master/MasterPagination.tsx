import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '../../lib/apiTypes'
import { allowedListPerPage } from '../../store/adminStore'
import { AdminSelect } from '../forms/AdminSelect'

type MasterPaginationProps = {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  perPage?: number
}

const perPageOptions = allowedListPerPage.map((option) => ({
  label: String(option),
  value: String(option),
}))

export function MasterPagination({ meta, onPageChange, onPerPageChange, perPage }: MasterPaginationProps) {
  const canGoBack = meta.currentPage > 1
  const canGoForward = meta.currentPage < meta.lastPage
  const pages = getVisiblePages(meta.currentPage, meta.lastPage)

  return (
    <nav className="master-pagination" aria-label="Pagination">
      {onPerPageChange ? (
        <label className="master-per-page">
          <span>Rows per page</span>
          <AdminSelect
            ariaLabel="Rows per page"
            isSearchable={false}
            options={perPageOptions}
            value={String(perPage ?? meta.perPage)}
            onChange={(value) => onPerPageChange(Number(value))}
          />
        </label>
      ) : null}

      <span className="master-pagination-summary">
        Showing {meta.from ?? 0} to {meta.to ?? 0} of {meta.total} records
      </span>

      <div className="master-pagination-controls">
        <button
          type="button"
          aria-label="Previous page"
          disabled={!canGoBack}
          onClick={() => onPageChange(meta.currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </button>

        {pages.map((page, index) =>
          page === 'gap' ? (
            <span aria-hidden="true" key={`${page}-${index}`}>
              ...
            </span>
          ) : (
            <button
              className={page === meta.currentPage ? 'is-active' : undefined}
              type="button"
              aria-current={page === meta.currentPage ? 'page' : undefined}
              key={page}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Next page"
          disabled={!canGoForward}
          onClick={() => onPageChange(meta.currentPage + 1)}
        >
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </nav>
  )
}

function getVisiblePages(currentPage: number, lastPage: number): Array<number | 'gap'> {
  if (lastPage <= 5) {
    return Array.from({ length: lastPage }, (_, index) => index + 1)
  }

  const middlePages = [currentPage - 1, currentPage, currentPage + 1].filter(
    (page) => page > 1 && page < lastPage,
  )

  const pages: Array<number | 'gap'> = [1]
  const firstMiddlePage = middlePages[0]
  const lastMiddlePage = middlePages[middlePages.length - 1]

  if (firstMiddlePage && firstMiddlePage > 2) {
    pages.push('gap')
  }

  pages.push(...middlePages)

  if (lastMiddlePage && lastMiddlePage < lastPage - 1) {
    pages.push('gap')
  }

  pages.push(lastPage)

  return pages
}
