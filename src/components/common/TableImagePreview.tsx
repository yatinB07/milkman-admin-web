import { ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { assetUrl } from '../../lib/api'

type TableImagePreviewProps = {
  src: string | null
  alt: string
}

export function TableImagePreview({ src, alt }: TableImagePreviewProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <span className="store-image-placeholder">
        <ImageIcon aria-hidden="true" size={22} />
        No image
      </span>
    )
  }

  return <img className="store-table-image" src={assetUrl(src)} alt={alt} onError={() => setFailedSrc(src)} />
}
