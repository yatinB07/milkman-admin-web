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
    Polygon: new (options: Record<string, unknown>) => GooglePolygon
    ControlPosition: Record<string, number>
    MapTypeControlStyle: Record<string, number>
    drawing: {
      DrawingManager: new (options: Record<string, unknown>) => GoogleDrawingManager
      OverlayType: Record<string, string>
    }
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
  getPath: () => GoogleMapsPath
}

type GoogleMapsPath = {
  getArray: () => GoogleLatLng[]
}

type GoogleMapEvent = {
  latLng?: GoogleLatLng
  overlay?: GooglePolygon
}

type GoogleDrawingManager = {
  setMap: (map: GoogleMap | null) => void
  setDrawingMode: (mode: string | null) => void
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
const mapsApiVersion = (import.meta.env.VITE_GOOGLE_MAPS_VERSION as string | undefined) ?? '3.64'
let googleMapsPromise: Promise<GoogleMapsNamespace> | null = null

export function ZonePolygonMap({ value, onChange, hasError = false, errorId }: ZonePolygonMapProps) {
  const inputId = useId()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const resetControlRef = useRef<HTMLDivElement | null>(null)
  const locateControlRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<GoogleMap | null>(null)
  const polygonRef = useRef<GooglePolygon | null>(null)
  const drawingManagerRef = useRef<GoogleDrawingManager | null>(null)
  const pathListenersRef = useRef<GoogleMapsListener[]>([])
  const mapListenersRef = useRef<GoogleMapsListener[]>([])
  const lastGeneratedValueRef = useRef('')
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    mapsApiKey ? 'idle' : 'error',
  )
  const [mapMessage, setMapMessage] = useState(mapsApiKey ? '' : 'Google Maps API key is not configured.')

  const clearPolygon = useCallback(() => {
    pathListenersRef.current.forEach((listener) => listener.remove())
    pathListenersRef.current = []
    polygonRef.current?.setMap(null)
    polygonRef.current = null
  }, [])

  const emitPoints = useCallback(
    (points: CoordinatePoint[]) => {
      const serialized = serializePath(points)
      lastGeneratedValueRef.current = serialized
      onChange(serialized)
    },
    [onChange],
  )

  const emitPolygon = useCallback(
    (polygon: GooglePolygon) => {
      emitPoints(
        polygon
          .getPath()
          .getArray()
          .map((point) => ({ lat: point.lat(), lng: point.lng() })),
      )
    },
    [emitPoints],
  )

  const setActivePolygon = useCallback(
    (google: GoogleMapsNamespace, polygon: GooglePolygon, shouldEmit: boolean) => {
      clearPolygon()
      polygonRef.current = polygon
      drawingManagerRef.current?.setDrawingMode(null)

      const path = polygon.getPath()
      pathListenersRef.current = ['set_at', 'insert_at', 'remove_at'].map((eventName) =>
        google.maps.event.addListener(path, eventName, () => emitPolygon(polygon)),
      )

      if (shouldEmit) {
        emitPolygon(polygon)
      }
    },
    [clearPolygon, emitPolygon],
  )

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

        const drawingManager = new google.maps.drawing.DrawingManager({
          drawingMode: google.maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: getPolygonOptions(map),
        })
        drawingManager.setMap(map)
        drawingManagerRef.current = drawingManager

        mapListenersRef.current = [
          google.maps.event.addListener(drawingManager, 'overlaycomplete', (event) => {
            if (!event?.overlay) {
              return
            }

            setActivePolygon(google, event.overlay, true)
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
      drawingManagerRef.current?.setMap(null)
      drawingManagerRef.current = null
      mapListenersRef.current.forEach((listener) => listener.remove())
      mapListenersRef.current = []
      mapInstanceRef.current = null
    }
  }, [clearPolygon, setActivePolygon])

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

    if (points.length < 3) {
      drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
      if (!value.trim()) {
        map.setCenter(defaultCenter)
        map.setZoom(defaultZoom)
      }
      return
    }

    const polygon = new google.maps.Polygon({
      ...getPolygonOptions(map),
      paths: points,
    })
    setActivePolygon(google, polygon, false)
    fitToPoints(google, map, points)
  }, [clearPolygon, loadState, setActivePolygon, value])

function handleClear() {
    const google = window.google
    clearPolygon()
    lastGeneratedValueRef.current = ''
    onChange('')
    if (google) {
      drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
    }
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
        Select the polygon tool, click the map to draw the boundary, and click the first point to finish it.
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
  if (window.google?.maps?.places && window.google.maps.drawing) {
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
      if (window.google?.maps?.places && window.google.maps.drawing) {
        resolve(window.google)
      } else {
        reject(new Error('Google Maps loaded without required drawing or places libraries.'))
      }
    }

    if (existingScript) {
      existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load.')))
      return
    }

    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'drawing,places',
      callback: 'initMilkmanGoogleMaps',
      v: mapsApiVersion,
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
