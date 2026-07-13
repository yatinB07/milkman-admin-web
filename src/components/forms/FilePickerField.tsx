import { ImageIcon, Upload, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { assetUrl } from '../../lib/api'
import { dirtyFormStore } from '../../store/dirtyFormStore'
import { uploadAdminFile } from './adminUploadRepository'

type FilePickerFieldProps = {
  name: string
  value: string
  label: string
  directory?: string
  required?: boolean
  accept?: string
  placeholder?: string
  onChange: (value: string) => void
}

export function FilePickerField({
  name,
  value,
  label,
  directory = 'uploads',
  required = false,
  accept = 'image/*',
  placeholder = 'images/store/example.png',
  onChange,
}: FilePickerFieldProps) {
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState('')
  const [failedPreviewSource, setFailedPreviewSource] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const previewSource = previewUrl || value
  const hasPreview = Boolean(previewSource) && failedPreviewSource !== previewSource
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
    setFailedPreviewSource('')
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
    setFailedPreviewSource('')
    setUploadError('')
    dirtyFormStore.markDirty()
    onChange('')
  }

  return (
    <div className="file-picker-field">
      <input name={name} required={required} type="hidden" value={value} />

      <div className="file-picker-preview">
        {hasPreview ? (
          <img
            src={previewUrl || assetUrl(value)}
            alt={`${label} preview`}
            onError={() => setFailedPreviewSource(previewSource)}
          />
        ) : (
          <span>
            <ImageIcon aria-hidden="true" size={26} />
            No image selected
          </span>
        )}
      </div>

      <div className="file-picker-body">
        <div className="file-picker-actions">
          <label className={`file-picker-button${isUploading ? ' is-disabled' : ''}`} htmlFor={inputId}>
            <Upload aria-hidden="true" size={16} />
            <span>{isUploading ? 'Uploading...' : value ? 'Replace file' : 'Choose file'}</span>
          </label>
          {value ? (
            <button className="file-picker-link" type="button" disabled={isUploading} onClick={clearFile}>
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

        <div className="file-picker-meta">
          <strong title={fileName}>{fileName || 'No file selected'}</strong>
          <span title={value || placeholder}>{value || placeholder}</span>
        </div>

        <small>Uploads immediately and stores the returned path with the form.</small>
        {uploadError ? <small className="field-error">{uploadError}</small> : null}
      </div>

      {value ? (
        <button className="file-picker-clear" type="button" aria-label={`Clear ${label}`} onClick={clearFile}>
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
