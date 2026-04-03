// MS-03 — Location Service
import { supabase } from '../supabaseClient'
import { gatewayCall } from './gateway'
import { haversineDistance } from '../utils/distance'

let locationInterval = null

export async function pushLocation(lat, lng) {
  return gatewayCall({
    action: 'PUSH_LOCATION',
    fn: async (session) => {
      const { data, error } = await supabase
        .from('locations')
        .upsert({
          volunteer_id: session.user.id,
          lat,
          lng,
          updated_at: new Date().toISOString()
        }, { onConflict: 'volunteer_id' })
        .select()
        .single()
      if (error) throw error
      return data
    }
  })
}

export function startLocationTracking(onSuccess, onError) {
  if (!navigator.geolocation) {
    onError && onError('Geolocation is not supported by your browser.')
    return
  }

  const sendLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await pushLocation(pos.coords.latitude, pos.coords.longitude)
          onSuccess && onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        } catch (err) {
          onError && onError(err.message)
        }
      },
      (err) => { onError && onError(err.message) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  sendLocation() // immediate first push
  locationInterval = setInterval(sendLocation, 30_000)
  return locationInterval
}

export function stopLocationTracking() {
  if (locationInterval) {
    clearInterval(locationInterval)
    locationInterval = null
  }
}

export async function getAllActiveLocations() {
  return gatewayCall({
    action: 'GET_ALL_LOCATIONS',
    fn: async () => {
      const cutoff = new Date(Date.now() - 5 * 60_000).toISOString() // 5 min window
      const { data, error } = await supabase
        .from('locations')
        .select(`*, volunteers(id, name, skills, availability, role)`)
        .gte('updated_at', cutoff)
      if (error) throw error
      return data
    }
  })
}

export async function getVolunteersNearTask(taskLat, taskLng, radiusKm = 50) {
  return gatewayCall({
    action: 'PROXIMITY_QUERY',
    details: { taskLat, taskLng, radiusKm },
    fn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select(`*, volunteers(id, name, skills, availability)`)
      if (error) throw error

      return data.filter(loc => {
        const dist = haversineDistance(taskLat, taskLng, loc.lat, loc.lng)
        return dist <= radiusKm
      }).map(loc => ({ ...loc, distanceKm: haversineDistance(taskLat, taskLng, loc.lat, loc.lng) }))
    }
  })
}
