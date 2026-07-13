import { ImageIcon, Upload, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { assetUrl } from '../../lib/api'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { uploadAdminFile } from './adminUploadRepository'

type AdminFilePickerProps = {
  name: string
  value: string
  label: string
  directory?: string
  required?: boolean
  accept?: string
  placeholder?: string
  onChange: (value: string) => void
}

export function AdminFilePicker({
  name,
  value,
  label,
  directory = 'uploads',
  required = false,
  accept = 'image/*',
  placeholder = 'images/store/example.png',
  onChange,
}: AdminFilePickerProps) {
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const hasPreview = Boolean(previewUrl || value)
  const fileName = displayFileName(value)

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  async function handleFileChange(file?: File) {
    if (!file) {
      return
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(URL.createObjectURL(file))
    setUploadError('')
    setIsUploading(true)

    try {
      const upload = await uploadAdminFile(file, directory)
      dirtyFormStore.markDirty()
      onChange(upload.path)
    } catch {
      setUploadError('Upload failed. Please choose the image again.')
    } finally {
      setIsUploading(false)
    }
  }

  function clearFile() {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl('')
    setUploadError('')
    dirtyFormStore.markDirty()
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
          <label className={`admin-file-button${isUploading ? ' is-disabled' : ''}`} htmlFor={inputId}>
            <Upload aria-hidden="true" size={16} />
            <span>{isUploading ? 'Uploading...' : value ? 'Replace file' : 'Choose file'}</span>
          </label>
          {value ? (
            <button className="admin-file-link" type="button" disabled={isUploading} onClick={clearFile}>
              Remove
            </button>
          ) : null}
        </div>
        <input
          id={inputId}
          accept={accept}
          className="sr-only"
          disabled={isUploading}
          type="file"
          onChange={(event) => handleFileChange(event.target.files?.[0])}
        />

        <div className="admin-file-meta">
          <strong title={fileName}>{fileName || 'No file selected'}</strong>
          <span title={value || placeholder}>{value || placeholder}</span>
        </div>

        <small>Uploads immediately and stores the returned path with the form.</small>
        {uploadError ? <small className="field-error">{uploadError}</small> : null}
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
