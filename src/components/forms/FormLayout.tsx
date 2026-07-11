import type { ReactNode } from 'react'

export function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <span>
      {label} {required ? <span className="required-mark" aria-hidden="true">*</span> : null}
    </span>
  )
}

export function FormSection({
  title,
  columns = 2,
  children,
}: {
  title: string
  columns?: 1 | 2 | 3
  children: ReactNode
}) {
  return (
    <section className="store-form-section">
      <h4>{title}</h4>
      <div className="form-grid" data-columns={columns}>
        {children}
      </div>
    </section>
  )
}

export function FormErrorSummary({ errors }: { errors: Array<string | false | null | undefined> }) {
  const visibleErrors = errors.filter((error): error is string => Boolean(error))

  if (visibleErrors.length === 0) return null

  return (
    <>
      {visibleErrors.map((error) => (
        <div className="form-error" key={error}>
          {error}
        </div>
      ))}
    </>
  )
}
