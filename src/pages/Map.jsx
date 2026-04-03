import { useEffect, useState, useRef } from 'react'
import { MapPin, Navigation, RefreshCw } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { startLocationTracking, stopLocationTracking, getAllActiveLocations } from '../services/locationService'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const myIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

const otherIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

export default function MapPage() {
  const { user, volunteer }   = useAuth()
  const [locations, setLocations] = useState([])
  const [myPos,     setMyPos]     = useState(null)
  const [tracking,  setTracking]  = useState(false)
  const [loading,   setLoading]   = useState(true)

  async function loadLocations() {
    try {
      const data = await getAllActiveLocations()
      setLocations(data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadLocations()
    const interval = setInterval(loadLocations, 30_000)
    return () => clearInterval(interval)
  }, [])

  function handleStartTracking() {
    setTracking(true)
    toast.success('Location tracking started')
    startLocationTracking(
      (pos) => setMyPos(pos),
      (err) => { toast.error(err); setTracking(false) }
    )
  }

  function handleStopTracking() {
    stopLocationTracking()
    setTracking(false)
    toast('Location tracking stopped')
  }

  useEffect(() => () => stopLocationTracking(), [])

  const center = myPos ? [myPos.lat, myPos.lng] : [20, 0]

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <MapPin size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-900">Live Map</h1>
            <p className="text-slate-500 text-sm">{locations.length} active volunteer{locations.length !== 1 ? 's' : ''} visible</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadLocations} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
            <RefreshCw size={16} />
          </button>
          {!tracking ? (
            <button onClick={handleStartTracking}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
              <Navigation size={15} /> Share My Location
            </button>
          ) : (
            <button onClick={handleStopTracking}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Tracking Live
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /> Your location</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Other volunteers</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style={{ height: '520px' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner text="Loading map..." />
          </div>
        ) : (
          <MapContainer center={center} zoom={myPos ? 13 : 2} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {myPos && (
              <Marker position={[myPos.lat, myPos.lng]} icon={myIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>📍 You ({volunteer?.name})</strong><br />
                    <span className="text-slate-500">Lat: {myPos.lat.toFixed(5)}<br />Lng: {myPos.lng.toFixed(5)}</span>
                  </div>
                </Popup>
              </Marker>
            )}
            {locations.filter(l => l.volunteer_id !== user?.id).map(loc => (
              <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={otherIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>🙋 {loc.volunteers?.name || 'Volunteer'}</strong><br />
                    <span className="text-slate-500 capitalize">{loc.volunteers?.availability || 'unknown'}</span><br />
                    {loc.volunteers?.skills?.length > 0 && (
                      <span className="text-slate-400 text-xs">{loc.volunteers.skills.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
