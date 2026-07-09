import { Crosshair, LocateFixed, RotateCcw, Search } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

type CoordinatePoint = {
  lat: number
  lng: number
}

type ZonePolygonMapProps = {
  value: string
  onChange: (value: string) => void
  hasError?: boolean
  errorId?: string
}

type GoogleMapsNamespace = {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap
    LatLngBounds: new () => GoogleLatLngBounds
    Marker: new (options: Record<string, unknown>) => GoogleMarker
    Polygon: new (options: Record<string, unknown>) => GooglePolygon
    Polyline: new (options: Record<string, unknown>) => GooglePolyline
    ControlPosition: Record<string, number>
    MapTypeControlStyle: Record<string, number>
    SymbolPath: Record<string, string>
    event: {
      addListener: (
        instance: object,
        eventName: string,
        handler: (event?: GoogleMapEvent) => void,
      ) => GoogleMapsListener
    }
    places: {
      SearchBox: new (input: HTMLInputElement) => GoogleSearchBox
    }
  }
}

type GoogleMap = {
  controls: Record<number, { push: (element: HTMLElement) => void }>
  fitBounds: (bounds: GoogleLatLngBounds) => void
  setCenter: (point: CoordinatePoint) => void
  setZoom: (zoom: number) => void
}

type GoogleLatLng = {
  lat: () => number
  lng: () => number
}

type GoogleLatLngBounds = {
  extend: (point: CoordinatePoint | GoogleLatLng) => void
  isEmpty: () => boolean
}

type GooglePolygon = {
  setMap: (map: GoogleMap | null) => void
}

type GooglePolyline = {
  setMap: (map: GoogleMap | null) => void
  setPath: (path: CoordinatePoint[]) => void
}

type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void
}

type GoogleMapEvent = {
  latLng?: GoogleLatLng
}

type GoogleMapsListener = {
  remove: () => void
}

type GooglePlace = {
  geometry?: {
    location?: GoogleLatLng
    viewport?: GoogleLatLngBounds
  }
}

type GoogleSearchBox = {
  getPlaces: () => GooglePlace[] | undefined
}

declare global {
  interface Window {
    google?: GoogleMapsNamespace
    gm_authFailure?: () => void
    initMilkmanGoogleMaps?: () => void
  }
}

const defaultCenter: CoordinatePoint = { lat: 21.2408, lng: 72.8806 }
const defaultZoom = 13
const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
let googleMapsPromise: Promise<GoogleMapsNamespace> | null = null

export function ZonePolygonMap({ value, onChange, hasError = false, errorId }: ZonePolygonMapProps) {
  const inputId = useId()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const resetControlRef = useRef<HTMLDivElement | null>(null)
  const locateControlRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<GoogleMap | null>(null)
  const polygonRef = useRef<GooglePolygon | null>(null)
  const polylineRef = useRef<GooglePolyline | null>(null)
  const previewPolylineRef = useRef<GooglePolyline | null>(null)
  const markersRef = useRef<GoogleMarker[]>([])
  const pointsRef = useRef<CoordinatePoint[]>([])
  const pathListenersRef = useRef<GoogleMapsListener[]>([])
  const mapListenersRef = useRef<GoogleMapsListener[]>([])
  const lastGeneratedValueRef = useRef('')
  const renderPointsRef = useRef<((google: GoogleMapsNamespace, map: GoogleMap, shouldEmit: boolean) => void) | null>(
    null,
  )
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    mapsApiKey ? 'idle' : 'error',
  )
  const [mapMessage, setMapMessage] = useState(mapsApiKey ? '' : 'Google Maps API key is not configured.')

  const clearPolygon = useCallback(() => {
    pathListenersRef.current.forEach((listener) => listener.remove())
    pathListenersRef.current = []
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []
    polylineRef.current?.setMap(null)
    polylineRef.current = null
    polygonRef.current?.setMap(null)
    polygonRef.current = null
  }, [])

  const clearPreviewLine = useCallback(() => {
    previewPolylineRef.current?.setMap(null)
    previewPolylineRef.current = null
  }, [])

  const renderPreviewLine = useCallback(
    (google: GoogleMapsNamespace, map: GoogleMap, point: CoordinatePoint) => {
      const lastPoint = pointsRef.current.at(-1)

      if (!lastPoint) {
        clearPreviewLine()
        return
      }

      const path = [lastPoint, point]

      if (previewPolylineRef.current) {
        previewPolylineRef.current.setPath(path)
        return
      }

      previewPolylineRef.current = new google.maps.Polyline({
        map,
        path,
        strokeColor: '#1f2937',
        strokeOpacity: 0.95,
        strokeWeight: 2,
        clickable: false,
      })
    },
    [clearPreviewLine],
  )

  const emitPoints = useCallback(
    (points: CoordinatePoint[]) => {
      const serialized = serializePath(points)
      lastGeneratedValueRef.current = serialized
      onChange(serialized)
    },
    [onChange],
  )

  const renderPoints = useCallback(
    (google: GoogleMapsNamespace, map: GoogleMap, points: CoordinatePoint[], shouldEmit: boolean) => {
      clearPolygon()
      clearPreviewLine()
      pointsRef.current = points
      markersRef.current = points.map((point, index) => {
        const marker = new google.maps.Marker({
          map,
          position: point,
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#ffffff',
            fillOpacity: 1,
            strokeColor: '#1f2937',
            strokeWeight: 2,
          },
          title: `Point ${index + 1}`,
        })

        pathListenersRef.current.push(
          google.maps.event.addListener(marker, 'dragend', (event) => {
            if (!event?.latLng) {
              return
            }

            const nextPoints = [...pointsRef.current]
            nextPoints[index] = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            }
            pointsRef.current = nextPoints
            renderPointsRef.current?.(google, map, true)
          }),
        )

        return marker
      })

      if (points.length >= 2) {
        polylineRef.current = new google.maps.Polyline({
          map,
          path: points,
          strokeColor: '#1f2937',
          strokeOpacity: 0.95,
          strokeWeight: 2,
        })
      }

      if (points.length >= 3) {
        polygonRef.current = new google.maps.Polygon({
          ...getPolygonOptions(map),
          paths: points,
        })
      }

      if (shouldEmit) {
        emitPoints(points)
      }
    },
    [clearPolygon, clearPreviewLine, emitPoints],
  )
  useEffect(() => {
    renderPointsRef.current = (google, map, shouldEmit) => {
      renderPoints(google, map, [...pointsRef.current], shouldEmit)
    }
  }, [renderPoints])

  useEffect(() => {
    if (!mapsApiKey || !mapRef.current || !searchInputRef.current) {
      return
    }

    let isCancelled = false
    setLoadState('loading')
    setMapMessage('')

    loadGoogleMaps(mapsApiKey)
      .then((google) => {
        if (isCancelled || !mapRef.current || !searchInputRef.current) {
          return
        }

        const map = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: defaultZoom,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DEFAULT,
          },
          streetViewControl: false,
          fullscreenControl: true,
        })
        mapInstanceRef.current = map

        mapListenersRef.current = [
          google.maps.event.addListener(map, 'click', (event) => {
            if (!event?.latLng) {
              return
            }

            clearPreviewLine()
            const point = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            }

            if (!polygonRef.current) {
              renderPoints(google, map, [...pointsRef.current, point], true)
              return
            }

            renderPoints(google, map, [...pointsRef.current, point], true)
          }),
          google.maps.event.addListener(map, 'mousemove', (event) => {
            if (!event?.latLng) {
              return
            }

            renderPreviewLine(google, map, {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            })
          }),
          google.maps.event.addListener(map, 'mouseout', () => {
            clearPreviewLine()
          }),
        ]

        const searchBox = new google.maps.places.SearchBox(searchInputRef.current)
        mapListenersRef.current.push(
          google.maps.event.addListener(searchBox, 'places_changed', () => {
            const places = searchBox.getPlaces() ?? []
            const bounds = new google.maps.LatLngBounds()
            let hasViewport = false

            places.forEach((place) => {
              if (place.geometry?.viewport) {
                map.fitBounds(place.geometry.viewport)
                hasViewport = true
              } else if (place.geometry?.location) {
                bounds.extend(place.geometry.location)
              }
            })

            if (!hasViewport && !bounds.isEmpty()) {
              map.fitBounds(bounds)
            }
          }),
        )

        if (resetControlRef.current) {
          map.controls[google.maps.ControlPosition.TOP_RIGHT].push(resetControlRef.current)
        }

        if (locateControlRef.current) {
          map.controls[google.maps.ControlPosition.RIGHT_TOP].push(locateControlRef.current)
        }

        setLoadState('ready')
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setLoadState('error')
          setMapMessage(
            error instanceof Error
              ? error.message
              : 'Google Maps could not be loaded. Check the key and allowed domains.',
          )
        }
      })

    return () => {
      isCancelled = true
      clearPolygon()
      clearPreviewLine()
      mapListenersRef.current.forEach((listener) => listener.remove())
      mapListenersRef.current = []
      mapInstanceRef.current = null
    }
  }, [clearPolygon, clearPreviewLine, renderPoints, renderPreviewLine])

  useEffect(() => {
    const google = window.google
    const map = mapInstanceRef.current

    if (loadState !== 'ready' || !google || !map) {
      return
    }

    if (lastGeneratedValueRef.current === value && polygonRef.current) {
      return
    }

    const points = parseCoordinates(value)
    clearPolygon()
    clearPreviewLine()

    if (points.length < 3) {
      if (!value.trim()) {
        map.setCenter(defaultCenter)
        map.setZoom(defaultZoom)
      }
      return
    }

    renderPoints(google, map, points, false)
    fitToPoints(google, map, points)
  }, [clearPolygon, clearPreviewLine, loadState, renderPoints, value])

function handleClear() {
    clearPolygon()
    clearPreviewLine()
    pointsRef.current = []
    lastGeneratedValueRef.current = ''
    onChange('')
    mapInstanceRef.current?.setCenter(defaultCenter)
    mapInstanceRef.current?.setZoom(defaultZoom)
  }

  function handleLocate() {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      setMapMessage('Current location is not available in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapInstanceRef.current?.setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        mapInstanceRef.current?.setZoom(15)
        setMapMessage('')
      },
      () => {
        setMapMessage('Current location permission was not granted.')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="zone-map-field">
      <div className="zone-map-toolbar">
        <label className="zone-map-search" htmlFor={`${inputId}-search`}>
          <Search aria-hidden="true" size={16} />
          <input
            id={`${inputId}-search`}
            ref={searchInputRef}
            type="search"
            placeholder="Search places"
            disabled={loadState !== 'ready'}
          />
        </label>
        <button className="secondary-button is-icon" type="button" onClick={handleLocate}>
          <LocateFixed aria-hidden="true" size={16} />
          <span>Locate</span>
        </button>
        <button className="secondary-button is-icon" type="button" onClick={handleClear}>
          <RotateCcw aria-hidden="true" size={16} />
          <span>Reset</span>
        </button>
      </div>

      <div className="zone-map-shell">
        <div ref={mapRef} className="zone-map-canvas" aria-label="Delivery zone polygon map" />
        {loadState !== 'ready' ? (
          <div className="zone-map-state">
            <Crosshair aria-hidden="true" size={28} />
            <span>{loadState === 'loading' ? 'Loading Google Maps...' : mapMessage}</span>
          </div>
        ) : null}
        <div ref={resetControlRef} className="zone-map-control">
          <button type="button" onClick={handleClear}>
            Reset
          </button>
        </div>
        <div ref={locateControlRef} className="zone-map-control">
          <button type="button" onClick={handleLocate}>
            Locate
          </button>
        </div>
      </div>

      {mapMessage && loadState === 'ready' ? <small className="zone-map-message">{mapMessage}</small> : null}

      <small className="zone-map-message">
        Click the map to add points. Move the cursor to preview the next edge; a zone polygon appears after 3
        points.
      </small>

      <textarea
        name="coordinates"
        required
        readOnly
        value={value}
        aria-invalid={hasError}
        aria-describedby={errorId}
      />
    </div>
  )
}

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google)
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-milkman-google-maps]')

    window.gm_authFailure = () => {
      reject(new Error('Google Maps rejected this API key. Check API restrictions, billing, and referrers.'))
    }

    window.initMilkmanGoogleMaps = () => {
      if (window.google?.maps?.places) {
        resolve(window.google)
      } else {
        reject(new Error('Google Maps loaded without the Places library. Enable Places API and restart.'))
      }
    }

    if (existingScript) {
      existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load.')))
      return
    }

    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'places',
      callback: 'initMilkmanGoogleMaps',
      v: 'weekly',
    })

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.defer = true
    script.dataset.milkmanGoogleMaps = 'true'
    script.onerror = () => reject(new Error('Google Maps failed to load.'))
    document.head.appendChild(script)
  })

  return googleMapsPromise
}

function getPolygonOptions(map: GoogleMap) {
  return {
    map,
    editable: true,
    draggable: false,
    fillColor: '#111827',
    fillOpacity: 0.16,
    strokeColor: '#1f2937',
    strokeOpacity: 0.95,
    strokeWeight: 2,
    clickable: true,
  }
}

function serializePath(points: CoordinatePoint[]) {
  return points
    .map((point) => `(${point.lat.toFixed(6)},${point.lng.toFixed(6)})`)
    .join(',')
}

function parseCoordinates(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return []
  }

  const jsonPoints = parseJsonCoordinates(trimmed)

  if (jsonPoints.length >= 3) {
    return jsonPoints
  }

  return parseTextCoordinates(trimmed)
}

function parseJsonCoordinates(value: string) {
  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((point) => {
        if (!point || typeof point !== 'object') {
          return null
        }

        const maybePoint = point as Record<string, unknown>
        const lat = Number(maybePoint.lat ?? maybePoint.latitude)
        const lng = Number(maybePoint.lng ?? maybePoint.lon ?? maybePoint.long ?? maybePoint.longitude)

        return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
      })
      .filter((point): point is CoordinatePoint => Boolean(point))
  } catch {
    return []
  }
}

function parseTextCoordinates(value: string) {
  const matches =
    value.match(/-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?|-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g) ?? []

  return matches
    .map((pair) => {
      const numbers = pair.match(/-?\d+(?:\.\d+)?/g) ?? []
      const lat = Number(numbers[0])
      const lng = Number(numbers[1])

      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
    })
    .filter((point): point is CoordinatePoint => Boolean(point))
}

function fitToPoints(google: GoogleMapsNamespace, map: GoogleMap, points: CoordinatePoint[]) {
  const bounds = new google.maps.LatLngBounds()
  points.forEach((point) => bounds.extend(point))

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds)
  }
}
