// Called from the AccountPage when user saves their profile.
// Updates public.profiles, then syncs to Listmonk and InvoiceNinja.
//
// Required Secrets:
//   LISTMONK_URL, LISTMONK_USERNAME, LISTMONK_PASSWORD
//   INVOICE_NINJA_URL, INVOICE_NINJA_TOKEN

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COUNTRY_IDS: Record<string, string> = {
  'Schweiz': '756', 'Deutschland': '276', 'Österreich': '40', 'Liechtenstein': '438',
}

// Find active (non-deleted) InvoiceNinja client ID by contact email
async function findNinjaClientId(url: string, token: string, email: string): Promise<string | null> {
  const res = await fetch(`${url}/api/v1/clients?filter=${encodeURIComponent(email)}&per_page=10`, {
    headers: { 'X-Api-Token': token, Accept: 'application/json' },
  })
  if (!res.ok) {
    console.error('[update-user-profile] ninja search failed:', res.status, await res.text())
    return null
  }
  const data = await res.json()
  const client = (data?.data ?? []).find((c: Record<string, unknown>) =>
    !c.is_deleted &&
    (c.contacts as Array<{ email: string }>)?.some(
      (ct) => ct.email?.toLowerCase() === email.toLowerCase()
    )
  )
  return (client?.id as string) ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS })

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401, headers: CORS })

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: { user }, error: userError } = await adminClient.auth.getUser(authHeader.slice(7))
  if (userError || !user) return new Response('Unauthorized', { status: 401, headers: CORS })

  const body = await req.json().catch(() => ({}))
  const { phone = '', street = '', zip = '', city = '', country = 'Schweiz' } = body

  // 1. Upsert to public.profiles
  const { error: dbError } = await adminClient.from('profiles').upsert({
    id: user.id, phone, street, zip, city, country,
    updated_at: new Date().toISOString(),
  })
  if (dbError) console.error('[update-user-profile] DB error:', dbError)

  const email = user.email!
  const name  = (user.user_metadata?.full_name as string) || email
  const results: Record<string, string> = {}

  // 2. Listmonk
  const lmUrl  = Deno.env.get('LISTMONK_URL')?.replace(/\/$/, '')
  const lmUser = Deno.env.get('LISTMONK_USERNAME')?.trim()
  const lmPass = Deno.env.get('LISTMONK_PASSWORD')?.trim()

  if (lmUrl && lmUser && lmPass) {
    try {
      const lmAuth = `Basic ${btoa(unescape(encodeURIComponent(`${lmUser}:${lmPass}`)))}`
      const query  = encodeURIComponent(`subscribers.email = '${email}'`)
      const searchUrl = `${lmUrl}/api/subscribers?query=${query}&page=1&per_page=1`
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: lmAuth },
      })
      if (!searchRes.ok) {
        const body = await searchRes.text()
        console.error('[update-user-profile] listmonk search error:', searchRes.status, body)
        results.listmonk = `search_error_${searchRes.status}`
      } else {
        const sub = (await searchRes.json())?.data?.results?.[0]
        if (!sub) {
          // Not yet subscribed — create
          const listmonkList = Number(Deno.env.get('LISTMONK_LIST_ID') ?? '1')
          const createRes = await fetch(`${lmUrl}/api/subscribers`, {
            method: 'POST',
            headers: { Authorization: lmAuth, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email, name, status: 'enabled',
              lists: [listmonkList],
              attribs: { user_id: user.id, phone, street, zip, city, country },
              preconfirm_subscriptions: true,
            }),
          })
          if (!createRes.ok) console.error('[update-user-profile] listmonk create error:', createRes.status, await createRes.text())
          results.listmonk = createRes.ok ? 'created' : createRes.status === 409 ? 'already_exists' : `create_error_${createRes.status}`
        } else {
          const putRes = await fetch(`${lmUrl}/api/subscribers/${sub.id}`, {
            method: 'PUT',
            headers: { Authorization: lmAuth, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: sub.email, name, status: 'enabled',
              lists: (sub.lists ?? []).map((l: { id: number }) => l.id),
              attribs: { ...(sub.attribs ?? {}), phone, street, zip, city, country },
            }),
          })
          if (!putRes.ok) console.error('[update-user-profile] listmonk update error:', putRes.status, await putRes.text())
          results.listmonk = putRes.ok ? 'updated' : `error_${putRes.status}`
        }
      }
    } catch (e) { results.listmonk = `exception: ${e}` }
  } else {
    results.listmonk = 'not_configured'
    console.warn('[update-user-profile] Listmonk secrets missing:', { lmUrl: !!lmUrl, lmUser: !!lmUser, lmPass: !!lmPass })
  }

  // 3. InvoiceNinja — find by email, update or create
  const ninjaUrl   = Deno.env.get('INVOICE_NINJA_URL')?.replace(/\/$/, '')
  const ninjaToken = Deno.env.get('INVOICE_NINJA_TOKEN')

  if (ninjaUrl && ninjaToken) {
    try {
      const clientId = await findNinjaClientId(ninjaUrl, ninjaToken, email)
      const headers  = { 'X-Api-Token': ninjaToken, 'Content-Type': 'application/json', Accept: 'application/json' }

      // Build payload — omit empty/invalid fields
      const countryId = COUNTRY_IDS[country]
      const payload: Record<string, string> = { name }
      if (phone)     payload.phone       = phone
      if (street)    payload.address1    = street
      if (zip)       payload.postal_code = zip
      if (city)      payload.city        = city
      if (countryId) payload.country_id  = countryId

      if (clientId) {
        const res = await fetch(`${ninjaUrl}/api/v1/clients/${clientId}`, {
          method: 'PUT', headers, body: JSON.stringify(payload),
        })
        if (!res.ok) console.error('[update-user-profile] ninja update error:', res.status, await res.text())
        results.ninja = res.ok ? 'updated' : `error_${res.status}`
      } else {
        // Client not found — create
        const firstName = name.split(' ')[0]
        const res = await fetch(`${ninjaUrl}/api/v1/clients`, {
          method: 'POST', headers,
          body: JSON.stringify({
            ...payload,
            contacts: [{ email, first_name: firstName, last_name: name.split(' ').slice(1).join(' ') || firstName }],
            custom_value1: user.id,
          }),
        })
        if (!res.ok) console.error('[update-user-profile] ninja create error:', res.status, await res.text())
        results.ninja = res.ok ? 'created' : `error_${res.status}`
      }
    } catch (e) { results.ninja = `exception: ${e}` }
  } else {
    results.ninja = 'not_configured'
    console.warn('[update-user-profile] InvoiceNinja secrets missing')
  }

  console.log(`[update-user-profile] ${email}:`, results)
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
