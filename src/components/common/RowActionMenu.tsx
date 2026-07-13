import { MoreVertical } from 'lucide-react'
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const hiddenPopoverStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  visibility: 'hidden',
}

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
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>(hiddenPopoverStyle)
  const menuRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const getPopoverPosition = useCallback((): CSSProperties => {
    const trigger = triggerRef.current
    if (!trigger) return hiddenPopoverStyle

    const rect = trigger.getBoundingClientRect()
    const estimatedHeight = visibleActions.length * 38 + 12
    const opensUp = window.innerHeight - rect.bottom < estimatedHeight + 12

    return {
      position: 'fixed',
      top: opensUp ? Math.max(8, rect.top - estimatedHeight - 6) : rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right),
      visibility: 'visible',
    }
  }, [visibleActions.length])

  const updatePopoverPosition = useCallback(() => {
    setPopoverStyle(getPopoverPosition())
  }, [getPopoverPosition])

  const toggleMenu = useCallback(() => {
    setIsOpen((current) => {
      if (current) return false

      setPopoverStyle(getPopoverPosition())
      return true
    })
  }, [getPopoverPosition])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node

      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return

      setIsOpen(false)
    }

    window.addEventListener('resize', updatePopoverPosition)
    window.addEventListener('scroll', updatePopoverPosition, true)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('resize', updatePopoverPosition)
      window.removeEventListener('scroll', updatePopoverPosition, true)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen, updatePopoverPosition])

  if (visibleActions.length === 0) return null

  return (
    <span
      className="row-action-menu"
      onBlur={(event) => {
        const target = event.relatedTarget

        if (!event.currentTarget.contains(target) && !menuRef.current?.contains(target)) {
          setIsOpen(false)
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="row-action-trigger"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={toggleMenu}
      >
        <MoreVertical aria-hidden="true" size={17} />
      </button>
      {isOpen
        ? createPortal(
            <span ref={menuRef} className="row-action-popover" role="menu" style={popoverStyle}>
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
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}
