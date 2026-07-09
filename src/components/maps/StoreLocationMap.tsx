import { Crosshair, LocateFixed, Search } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

type CoordinatePoint = {
  lat: number
  lng: number
}

type StoreLocationMapProps = {
  latitude: string
  longitude: string
  onChange: (point: CoordinatePoint) => void
}

type GoogleMapsNamespace = {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap
    Marker: new (options: Record<string, unknown>) => GoogleMarker
    LatLngBounds: new () => GoogleLatLngBounds
    ControlPosition: Record<string, number>
    MapTypeControlStyle: Record<string, number>
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

type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void
  setPosition: (point: CoordinatePoint) => void
}

type GoogleLatLng = {
  lat: () => number
  lng: () => number
}

type GoogleLatLngBounds = {
  extend: (point: CoordinatePoint | GoogleLatLng) => void
  isEmpty: () => boolean
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
    gm_authFailure?: () => void
    initMilkmanStoreGoogleMaps?: () => void
  }
}

const defaultCenter: CoordinatePoint = { lat: 21.2408, lng: 72.8806 }
const defaultZoom = 13
const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
let googleMapsPromise: Promise<GoogleMapsNamespace> | null = null

export function StoreLocationMap({ latitude, longitude, onChange }: StoreLocationMapProps) {
  const inputId = useId()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const mapInstanceRef = useRef<GoogleMap | null>(null)
  const markerRef = useRef<GoogleMarker | null>(null)
  const mapListenersRef = useRef<GoogleMapsListener[]>([])
  const onChangeRef = useRef(onChange)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    mapsApiKey ? 'idle' : 'error',
  )
  const [mapMessage, setMapMessage] = useState(mapsApiKey ? '' : 'Google Maps API key is not configured.')

  const selectedPoint = useMemo(() => parsePoint(latitude, longitude), [latitude, longitude])
  const selectedPointRef = useRef(selectedPoint)

  useEffect(() => {
    onChangeRef.current = onChange
    selectedPointRef.current = selectedPoint
  }, [onChange, selectedPoint])

  const setMarker = useCallback((google: GoogleMapsNamespace, map: GoogleMap, point: CoordinatePoint) => {
    if (markerRef.current) {
      markerRef.current.setPosition(point)
    } else {
      markerRef.current = new google.maps.Marker({
        map,
        position: point,
        draggable: true,
        title: 'Store location',
      })

      mapListenersRef.current.push(
        google.maps.event.addListener(markerRef.current, 'dragend', (event) => {
          if (!event?.latLng) {
            return
          }

          onChangeRef.current({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          })
        }),
      )
    }

    map.setCenter(point)
  }, [])

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
          center: selectedPointRef.current ?? defaultCenter,
          zoom: selectedPointRef.current ? 15 : defaultZoom,
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

            const point = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            }

            setMarker(google, map, point)
            onChangeRef.current(point)
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

        if (selectedPointRef.current) {
          setMarker(google, map, selectedPointRef.current)
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
      mapListenersRef.current.forEach((listener) => listener.remove())
      mapListenersRef.current = []
      markerRef.current?.setMap(null)
      markerRef.current = null
      mapInstanceRef.current = null
    }
  }, [setMarker])

  useEffect(() => {
    const google = window.google as unknown as GoogleMapsNamespace | undefined
    const map = mapInstanceRef.current

    if (loadState !== 'ready' || !google || !map || !selectedPoint) {
      return
    }

    setMarker(google, map, selectedPoint)
  }, [loadState, selectedPoint, setMarker])

  function handleLocate() {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      setMapMessage('Current location is not available in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        onChangeRef.current(point)
        mapInstanceRef.current?.setCenter(point)
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
    <div className="zone-map-field store-location-map">
      <div className="zone-map-toolbar">
        <label className="zone-map-search" htmlFor={`${inputId}-search`}>
          <Search aria-hidden="true" size={16} />
          <input
            id={`${inputId}-search`}
            ref={searchInputRef}
            type="search"
            placeholder="Search store location"
            disabled={loadState !== 'ready'}
          />
        </label>
        <button className="secondary-button is-icon" type="button" onClick={handleLocate}>
          <LocateFixed aria-hidden="true" size={16} />
          <span>Locate</span>
        </button>
      </div>

      <div className="zone-map-shell">
        <div ref={mapRef} className="zone-map-canvas" aria-label="Store location picker map" />
        {loadState !== 'ready' ? (
          <div className="zone-map-state">
            <Crosshair aria-hidden="true" size={28} />
            <span>{loadState === 'loading' ? 'Loading Google Maps...' : mapMessage}</span>
          </div>
        ) : null}
      </div>

      {mapMessage && loadState === 'ready' ? <small className="zone-map-message">{mapMessage}</small> : null}
      <small className="zone-map-message">Click the map or drag the marker to set store latitude and longitude.</small>
    </div>
  )
}

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google as unknown as GoogleMapsNamespace)
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-milkman-google-maps]')

    window.gm_authFailure = () => {
      reject(new Error('Google Maps rejected this API key. Check API restrictions, billing, and referrers.'))
    }

    window.initMilkmanStoreGoogleMaps = () => {
      if (window.google?.maps?.places) {
        resolve(window.google as unknown as GoogleMapsNamespace)
      } else {
        reject(new Error('Google Maps loaded without the Places library. Enable Places API and restart.'))
      }
    }

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.google?.maps?.places) {
          resolve(window.google as unknown as GoogleMapsNamespace)
        }
      })
      existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load.')))
      return
    }

    const script = document.createElement('script')
    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'places',
      callback: 'initMilkmanStoreGoogleMaps',
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

function parsePoint(latitude: string, longitude: string) {
  const lat = Number(latitude)
  const lng = Number(longitude)

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}
