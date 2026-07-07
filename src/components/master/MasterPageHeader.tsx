import type { ReactNode } from 'react'

type MasterPageHeaderProps = {
  title: string
  description: string
  actions?: ReactNode
}

export function MasterPageHeader({ title, description, actions }: MasterPageHeaderProps) {
  return (
    <section className="master-page-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {actions ? <div className="master-page-actions">{actions}</div> : null}
    </section>
  )
}
