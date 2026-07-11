import { Bold, Italic, List, Quote } from 'lucide-react'
import { useRef } from 'react'
import { dirtyFormStore } from '../../store/dirtyFormStore'

type AdminRichTextEditorProps = {
  name: string
  value: string
  placeholder?: string
  helpText?: string
  maxLength?: number
  onChange: (value: string) => void
}

const actions = [
  { label: 'Bold', icon: Bold, before: '**', after: '**' },
  { label: 'Italic', icon: Italic, before: '_', after: '_' },
  { label: 'Quote', icon: Quote, before: '> ', after: '' },
  { label: 'List', icon: List, before: '- ', after: '' },
]

export function AdminRichTextEditor({
  name,
  value,
  placeholder,
  helpText,
  maxLength,
  onChange,
}: AdminRichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  function applyFormat(before: string, after: string) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
    dirtyFormStore.markDirty()
    onChange(nextValue)

    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-editor-toolbar" aria-label={`${name} formatting`}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            aria-label={action.label}
            title={action.label}
            onClick={() => applyFormat(action.before, action.after)}
          >
            <action.icon aria-hidden="true" size={16} />
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => {
          dirtyFormStore.markDirty()
          onChange(event.target.value)
        }}
      />
      <div className="admin-rich-editor-footer">
        <span>{helpText}</span>
        {maxLength ? <span>{value.length}/{maxLength}</span> : null}
      </div>
    </div>
  )
}
