// MS-06 — API Gateway
// All service calls pass through here for auth validation, role checks, rate limiting, and audit logging.

import { supabase } from '../supabaseClient'

// ── In-memory rate limiter ────────────────────────────────────────────────────
const requestCounts = {}
const RATE_LIMIT = 60       // max requests per window
const WINDOW_MS  = 60_000   // 1 minute

function checkRateLimit(userId) {
  const now = Date.now()
  if (!requestCounts[userId]) {
    requestCounts[userId] = { count: 1, windowStart: now }
    return true
  }
  const entry = requestCounts[userId]
  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 1
    entry.windowStart = now
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Session helper ────────────────────────────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentVolunteer() {
  const session = await getSession()
  if (!session) return null
  const { data } = await supabase
    .from('volunteers')
    .select('*')
    .eq('id', session.user.id)
    .single()
  return data
}

// ── Core gateway function ─────────────────────────────────────────────────────
export async function gatewayCall({ action, requireAdmin = false, targetId = null, details = null, fn }) {
  // 1. Validate session
  const session = await getSession()
  if (!session) throw new Error('Not authenticated. Please log in.')

  const userId = session.user.id

  // 2. Rate limit
  if (!checkRateLimit(userId)) throw new Error('Rate limit exceeded. Please wait a moment.')

  // 3. Role check for admin-only operations
  if (requireAdmin) {
    const volunteer = await getCurrentVolunteer()
    if (!volunteer || volunteer.role !== 'admin') {
      throw new Error('Access denied. Admin role required.')
    }
  }

  // 4. Execute the service function
  const result = await fn(session)

  // 5. Audit log (non-blocking)
  try {
    await supabase.from('admin_logs').insert({
      action,
      performed_by: userId,
      target_id: targetId,
      details: details ? JSON.stringify(details) : null,
    })
  } catch (_) { /* audit logging is best-effort */ }

  return result
}
