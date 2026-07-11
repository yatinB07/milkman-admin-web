import { MoreVertical } from 'lucide-react'
import { type ReactNode, useState } from 'react'

export type RowAction = {
  label: string
  icon: ReactNode
  onSelect: () => void
  tone?: 'danger'
}

type RowActionMenuProps = {
  actions: Array<RowAction | false | null | undefined>
  label?: string
}

export function RowActionMenu({ actions, label = 'Row actions' }: RowActionMenuProps) {
  const visibleActions = actions.filter((action): action is RowAction => Boolean(action))
  const [isOpen, setIsOpen] = useState(false)

  if (visibleActions.length === 0) return null

  return (
    <span
      className="row-action-menu"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false)
        }
      }}
    >
      <button
        type="button"
        className="row-action-trigger"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setIsOpen((current) => !current)}
      >
        <MoreVertical aria-hidden="true" size={17} />
      </button>
      {isOpen ? (
        <span className="row-action-popover" role="menu">
          {visibleActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={action.tone === 'danger' ? 'is-danger' : undefined}
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                action.onSelect()
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  )
}
