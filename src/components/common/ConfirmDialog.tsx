import { Button } from './Button'

export type ConfirmDialogOptions = {
  title: string
  message: string
  confirmLabel?: string
}

type ConfirmDialogProps = {
  options: ConfirmDialogOptions | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ options, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!options) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title">{options.title}</h3>
        <p>{options.message}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {options.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </section>
    </div>
  )
}
