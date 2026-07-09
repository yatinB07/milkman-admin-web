import { ImageIcon, Upload, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

type AdminFilePickerProps = {
  name: string
  value: string
  label: string
  required?: boolean
  accept?: string
  placeholder?: string
  onChange: (value: string) => void
}

export function AdminFilePicker({
  name,
  value,
  label,
  required = false,
  accept = 'image/*',
  placeholder = 'images/store/example.png',
  onChange,
}: AdminFilePickerProps) {
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState('')
  const hasPreview = Boolean(previewUrl || value)
  const fileName = displayFileName(value)

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFileChange(file?: File) {
    if (!file) {
      return
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(URL.createObjectURL(file))
    onChange(toTemporaryUploadPath(file.name))
  }

  function clearFile() {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl('')
    onChange('')
  }

  return (
    <div className="admin-file-picker">
      <input name={name} required={required} type="hidden" value={value} />

      <div className="admin-file-preview">
        {hasPreview ? (
          <img src={previewUrl || assetUrl(value)} alt={`${label} preview`} />
        ) : (
          <span>
            <ImageIcon aria-hidden="true" size={26} />
            No image selected
          </span>
        )}
      </div>

      <div className="admin-file-body">
        <div className="admin-file-actions">
          <label className="admin-file-button" htmlFor={inputId}>
            <Upload aria-hidden="true" size={16} />
            <span>{value ? 'Replace file' : 'Choose file'}</span>
          </label>
          {value ? (
            <button className="admin-file-link" type="button" onClick={clearFile}>
              Remove
            </button>
          ) : null}
        </div>
        <input
          id={inputId}
          accept={accept}
          className="sr-only"
          type="file"
          onChange={(event) => handleFileChange(event.target.files?.[0])}
        />

        <div className="admin-file-meta">
          <strong title={fileName}>{fileName || 'No file selected'}</strong>
          <span title={value || placeholder}>{value || placeholder}</span>
        </div>

        <small>
          Preview is immediate. Upload storage will be connected through the backend upload endpoint.
        </small>
      </div>

      {value ? (
        <button className="admin-file-clear" type="button" aria-label={`Clear ${label}`} onClick={clearFile}>
          <X aria-hidden="true" size={15} />
        </button>
      ) : null}
    </div>
  )
}

function displayFileName(path: string) {
  if (!path.trim()) {
    return ''
  }

  try {
    const url = new URL(path)
    return decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? path)
  } catch {
    return path.split('/').filter(Boolean).at(-1) ?? path
  }
}

function toTemporaryUploadPath(fileName: string) {
  const safeName = fileName.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')

  return `images/store/${safeName || 'store-image.png'}`
}

function assetUrl(path: string) {
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:')) {
    return path
  }

  return `/${path.replace(/^\/+/, '')}`
}
