import { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in Leaflet with webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapPicker({ onLocationSelect, initialLocation }) {
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)

  useEffect(() => {
    if (!mapContainerRef.current || map) return

    // Initialize Leaflet map
    const defaultLocation = initialLocation 
      ? [initialLocation.latitude, initialLocation.longitude]
      : [8.9635, 38.7578] // Addis Ababa

    const mapInstance = L.map(mapContainerRef.current, {
      center: defaultLocation,
      zoom: 13,
    })

    // Add OpenStreetMap tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance)

    // Click handler to set marker
    mapInstance.on('click', (e) => {
      const { lat, lng } = e.latlng
      
      if (marker) {
        marker.setLatLng([lat, lng])
      } else {
        const newMarker = L.marker([lat, lng]).addTo(mapInstance)
        setMarker(newMarker)
      }

      onLocationSelect({ latitude: lat, longitude: lng })
    })

    setMap(mapInstance)
    mapRef.current = mapInstance

    // Cleanup on unmount
    return () => {
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [initialLocation])

  // Update map when initialLocation changes
  useEffect(() => {
    if (map && initialLocation) {
      map.setView([initialLocation.latitude, initialLocation.longitude], 13)
      if (marker) {
        marker.setLatLng([initialLocation.latitude, initialLocation.longitude])
      } else {
        const newMarker = L.marker([initialLocation.latitude, initialLocation.longitude]).addTo(map)
        setMarker(newMarker)
      }
    }
  }, [initialLocation, map])

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          if (map) {
            map.setView([lat, lng], 13)
            
            if (marker) {
              marker.setLatLng([lat, lng])
            } else {
              const newMarker = L.marker([lat, lng]).addTo(map)
              setMarker(newMarker)
            }
          }

          onLocationSelect({ latitude: lat, longitude: lng })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  return (
    <div className="space-y-4">
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '300px', borderRadius: '8px', zIndex: 1 }}
      ></div>
      <button
        onClick={handleUseCurrentLocation}
        className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600"
      >
        Use My Current Location
      </button>
    </div>
  )
}
