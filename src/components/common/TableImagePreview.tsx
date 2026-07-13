import { ImageIcon } from 'lucide-react'
import { assetUrl } from '../../lib/api'

type TableImagePreviewProps = {
  src: string | null
  alt: string
}

export function TableImagePreview({ src, alt }: TableImagePreviewProps) {
  if (!src) {
    return (
      <span className="store-image-placeholder">
        <ImageIcon aria-hidden="true" size={22} />
        No image
      </span>
    )
  }

  return <img className="store-table-image" src={assetUrl(src)} alt={alt} />
}
