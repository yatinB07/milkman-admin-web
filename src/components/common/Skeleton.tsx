import clsx from 'clsx'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <span className={clsx('skeleton', className)} aria-hidden="true" />
}

type PageSkeletonProps = {
  label?: string
}

export function PageSkeleton({ label = 'Loading content' }: PageSkeletonProps) {
  return (
    <section className="page-skeleton" aria-label={label} aria-busy="true">
      <div className="page-skeleton-header">
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-action" />
      </div>
      <div className="page-skeleton-panel">
        <Skeleton className="skeleton-filter" />
        <Skeleton className="skeleton-filter is-short" />
      </div>
      <div className="page-skeleton-table">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="skeleton-row" key={index} />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </section>
  )
}
