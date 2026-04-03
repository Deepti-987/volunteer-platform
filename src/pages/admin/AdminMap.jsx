import { useEffect, useState } from 'react'
import { Map, RefreshCw } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { getAllActiveLocations } from '../../services/locationService'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const makeIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

const activeIcon   = makeIcon('green')
const inactiveIcon = makeIcon('grey')
const adminIcon    = makeIcon('gold')

export default function AdminMap() {
  const [locations, setLocations] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  async function load() {
    try {
      const data = await getAllActiveLocations()
      setLocations(data || [])
      setLastUpdate(new Date())
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  const center = locations.length > 0
    ? [locations[0].lat, locations[0].lng]
    : [20, 0]

  return (
    <div className="p-6 max-w-7xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Map size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-900">Command Map</h1>
            <p className="text-slate-500 text-sm">
              {locations.length} volunteers visible · {lastUpdate ? `Updated ${formatDistanceToNow(lastUpdate, { addSuffix: true })}` : ''}
            </p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-4 text-xs text-slate-500 flex-wrap">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-400" /> Active volunteer</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-400" /> Inactive volunteer</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-400" /> Admin</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style={{ height: '560px' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner text="Loading command map..." />
          </div>
        ) : (
          <MapContainer center={center} zoom={locations.length > 0 ? 5 : 2} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map(loc => {
              const icon = loc.volunteers?.role === 'admin' ? adminIcon
                : loc.volunteers?.availability === 'active' ? activeIcon : inactiveIcon
              return (
                <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={icon}>
                  <Popup>
                    <div className="text-sm min-w-[140px]">
                      <strong className="block text-slate-900">{loc.volunteers?.name || 'Unknown'}</strong>
                      <span className={`text-xs font-semibold capitalize ${loc.volunteers?.availability === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {loc.volunteers?.availability || 'unknown'}
                      </span>
                      {loc.volunteers?.role === 'admin' && <span className="ml-2 text-xs text-blue-600 font-bold">ADMIN</span>}
                      <div className="mt-1.5 text-xs text-slate-400">
                        {loc.lat?.toFixed(5)}, {loc.lng?.toFixed(5)}<br />
                        Updated {formatDistanceToNow(new Date(loc.updated_at), { addSuffix: true })}
                      </div>
                      {loc.volunteers?.skills?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {loc.volunteers.skills.slice(0, 4).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded capitalize">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        )}
      </div>

      {/* Volunteer list */}
      {locations.length > 0 && (
        <div className="mt-5 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="font-heading font-bold text-slate-800 text-sm">Active Volunteers</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {locations.map(loc => (
              <div key={loc.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${loc.volunteers?.availability === 'active' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <span className="font-medium text-slate-800 text-sm">{loc.volunteers?.name}</span>
                  {loc.volunteers?.role === 'admin' && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">ADMIN</span>}
                </div>
                <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(loc.updated_at), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
