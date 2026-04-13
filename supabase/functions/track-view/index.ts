// Edge Function: track-view
// Called by SharedResumePage on load (POST) and on unload via sendBeacon (PATCH).
// JWT enforcement: OFF — public endpoint
//
// POST  { token: string }              → logs a new view, returns { view_id }
// PATCH { view_id: string, duration_s: number } → updates duration of existing view

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS })
}

function parseDevice(ua: string): string {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\//i.test(ua)) return 'Opera'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  if (/firefox/i.test(ua)) return 'Firefox'
  return 'Other'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // sendBeacon always uses POST; it passes ?method=PATCH to signal a duration update
    const methodOverride = new URL(req.url).searchParams.get('method')?.toUpperCase()
    const method = methodOverride ?? req.method

    // ── PATCH: update duration of an existing view ─────────
    if (method === 'PATCH') {
      const { view_id, duration_s } = await req.json()
      if (!view_id || typeof duration_s !== 'number') return json({ error: 'bad request' }, 400)
      await sb.from('resume_views').update({ duration_s }).eq('id', view_id)
      return json({ ok: true })
    }

    // ── POST: log new view ─────────────────────────────────
    if (method !== 'POST') return json({ error: 'method not allowed' }, 405)

    const { token } = await req.json()
    if (!token) return json({ error: 'token required' }, 400)

    // Resolve share link
    const { data: link } = await sb
      .from('share_links')
      .select('id')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle()

    if (!link) return json({ error: 'not found' }, 404)

    // Geo: prefer Cloudflare header, fallback to ip-api (free, 45 req/min)
    let country: string | undefined
    let countryCode: string | undefined
    let city: string | undefined

    const cfCountry = req.headers.get('cf-ipcountry')
    if (cfCountry && cfCountry !== 'XX') {
      countryCode = cfCountry
    } else {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      if (ip && ip !== '::1' && !ip.startsWith('127.') && !ip.startsWith('192.168.')) {
        try {
          const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`, {
            signal: AbortSignal.timeout(2000),
          })
          const geo = await res.json()
          if (geo.status === 'success') {
            country      = geo.country
            countryCode  = geo.countryCode
            city         = geo.city
          }
        } catch { /* skip geo on timeout */ }
      }
    }

    const ua       = req.headers.get('user-agent') ?? ''
    const referrer = req.headers.get('referer') ?? undefined

    const { data: view } = await sb
      .from('resume_views')
      .insert({
        share_link_id: link.id,
        country:       country ?? null,
        country_code:  countryCode ?? null,
        city:          city ?? null,
        device:        parseDevice(ua),
        browser:       parseBrowser(ua),
        referrer:      referrer ?? null,
      })
      .select('id')
      .single()

    return json({ view_id: view?.id })
  } catch (e) {
    console.error('[track-view]', e)
    return json({ error: String(e) }, 500)
  }
})
