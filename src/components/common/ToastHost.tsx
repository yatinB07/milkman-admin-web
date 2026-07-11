import { X } from 'lucide-react'
import { toast, useToasts } from './toastStore'

export function ToastHost() {
  const messages = useToasts()

  if (messages.length === 0) return null

  return (
    <div className="toast-host" aria-live="polite" aria-label="Notifications">
      {messages.map((message) => (
        <div className={`toast-card is-${message.tone}`} key={message.id} role="status">
          <span>{message.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => toast.dismiss(message.id)}>
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
