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
    <section className="admin-form-section">
      <h4>{title}</h4>
      <div className="form-grid" data-columns={columns}>
        {children}
      </div>
    </section>
  )
}
