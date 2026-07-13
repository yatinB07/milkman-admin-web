export function formatDate(value?: string | null, fallback = 'Never') {
  if (!value) return fallback

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return fallback

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function serialNumber(meta: { from: number | null }, index: number) {
  return (meta.from || 1) + index
}
