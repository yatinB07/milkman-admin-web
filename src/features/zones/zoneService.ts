import type { ZoneFormErrors, ZoneFormValues, ZonePayload, ZoneRow } from './zoneTypes'

export function toZonePayload(values: ZoneFormValues): ZonePayload {
  const coordinates = values.coordinates.trim()
  const alias = values.alias.trim()

  return {
    title: values.title.trim(),
    coordinates,
    alias: alias === '' ? coordinates : alias,
    is_active: values.is_active,
  }
}

export function resolveZoneAlias(alias: string, coordinates: string, editingZone: ZoneRow | null) {
  const trimmedAlias = alias.trim()
  const trimmedCoordinates = coordinates.trim()

  if (!editingZone || !trimmedAlias) {
    return trimmedAlias
  }

  const aliasWasNotEdited = trimmedAlias === (editingZone.alias ?? '').trim()
  const polygonChanged =
    trimmedCoordinates !== editingZone.coordinates.trim() &&
    trimmedCoordinates !== (editingZone.alias ?? '').trim()

  return aliasWasNotEdited && polygonChanged ? trimmedCoordinates : trimmedAlias
}

export function validateZoneForm(values: ZoneFormValues, statusValue: string) {
  const errors: ZoneFormErrors = {}
  const title = values.title.trim()
  const alias = values.alias.trim()
  const coordinates = values.coordinates.trim()

  if (!title) {
    errors.title = 'Zone title is required.'
  } else if (title.length > 255) {
    errors.title = 'Zone title must be 255 characters or fewer.'
  }

  if (alias.length > 255) {
    errors.alias = 'Alias must be 255 characters or fewer.'
  }

  if (statusValue !== 'true' && statusValue !== 'false') {
    errors.is_active = 'Choose Active or Inactive.'
  }

  if (!coordinates) {
    errors.coordinates = 'Coordinates are required.'
  } else if (countCoordinatePairs(coordinates) < 3) {
    errors.coordinates = 'Coordinates must include at least 3 points.'
  }

  return errors
}

function countCoordinatePairs(value: string) {
  return (
    value.match(/-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?|-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g)
      ?.length ?? 0
  )
}
