type AdminTextareaProps = {
  name: string
  value: string
  required?: boolean
  minRows?: number
  maxLength?: number
  placeholder?: string
  helpText?: string
  onChange: (value: string) => void
}

export function AdminTextarea({
  name,
  value,
  required = false,
  minRows = 5,
  maxLength,
  placeholder,
  helpText,
  onChange,
}: AdminTextareaProps) {
  const characterCount = value.length

  return (
    <div className="admin-textarea">
      <textarea
        name={name}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={minRows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="admin-textarea-footer">
        <span>{helpText}</span>
        <span>{maxLength ? `${characterCount}/${maxLength}` : `${characterCount} characters`}</span>
      </div>
    </div>
  )
}
