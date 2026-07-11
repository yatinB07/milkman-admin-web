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
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            {options.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </section>
    </div>
  )
}
