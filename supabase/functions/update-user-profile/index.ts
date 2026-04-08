// Called from the AccountPage when user saves their profile.
// Updates public.profiles, then syncs to Listmonk and InvoiceNinja.
//
// Required Secrets (same as on-user-signup):
//   LISTMONK_URL, LISTMONK_USERNAME, LISTMONK_PASSWORD
//   INVOICE_NINJA_URL, INVOICE_NINJA_TOKEN

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Country name → ISO 3166-1 numeric (for InvoiceNinja)
const COUNTRY_IDS: Record<string, string> = {
  'Schweiz': '756',
  'Deutschland': '276',
  'Österreich': '40',
  'Liechtenstein': '438',
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 })
  const jwt = auth.slice(7)

  // Verify JWT and get user
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt)
  if (userError || !user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { phone = '', street = '', zip = '', city = '', country = 'Schweiz' } = body

  // 1. Upsert profile to public.profiles
  const { error: dbError } = await adminClient.from('profiles').upsert({
    id: user.id, phone, street, zip, city, country,
    updated_at: new Date().toISOString(),
  })
  if (dbError) console.error('[update-user-profile] DB upsert error:', dbError)

  const email = user.email!
  const name = (user.user_metadata?.full_name as string) || email
  const results: Record<string, string> = {}

  // 2. Listmonk — find subscriber by email, then update attribs
  const listmonkUrl  = Deno.env.get('LISTMONK_URL')
  const listmonkUser = Deno.env.get('LISTMONK_USERNAME')
  const listmonkPass = Deno.env.get('LISTMONK_PASSWORD')

  if (listmonkUrl && listmonkUser && listmonkPass) {
    try {
      const auth = `Basic ${btoa(`${listmonkUser}:${listmonkPass}`)}`

      // Find subscriber
      const query = encodeURIComponent(`subscribers.email = '${email}'`)
      const searchRes = await fetch(`${listmonkUrl}/api/subscribers?query=${query}&page=1&per_page=1`, {
        headers: { Authorization: auth },
      })
      if (!searchRes.ok) {
        results.listmonk = `search_error_${searchRes.status}`
      } else {
        const searchData = await searchRes.json()
        const sub = searchData?.data?.results?.[0]
        if (!sub) {
          results.listmonk = 'not_found'
        } else {
          const putRes = await fetch(`${listmonkUrl}/api/subscribers/${sub.id}`, {
            method: 'PUT',
            headers: { Authorization: auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: sub.email,
              name,
              status: 'enabled',
              lists: (sub.lists ?? []).map((l: { id: number }) => l.id),
              attribs: {
                ...(sub.attribs ?? {}),
                phone, street, zip, city, country,
              },
            }),
          })
          results.listmonk = putRes.ok ? 'updated' : `error_${putRes.status}`
        }
      }
    } catch (e) {
      results.listmonk = `exception: ${e}`
    }
  } else {
    results.listmonk = 'not_configured'
  }

  // 3. InvoiceNinja — find client by custom_value1 (=user_id), then update
  const ninjaUrl   = Deno.env.get('INVOICE_NINJA_URL')
  const ninjaToken = Deno.env.get('INVOICE_NINJA_TOKEN')

  if (ninjaUrl && ninjaToken) {
    try {
      const headers = {
        'X-Api-Token': ninjaToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }

      // Find client by custom_value1 = user_id
      const searchRes = await fetch(
        `${ninjaUrl}/api/v1/clients?custom_value1=${encodeURIComponent(user.id)}&per_page=1`,
        { headers },
      )
      if (!searchRes.ok) {
        results.ninja = `search_error_${searchRes.status}`
      } else {
        const searchData = await searchRes.json()
        const client = searchData?.data?.[0]
        if (!client) {
          results.ninja = 'not_found'
        } else {
          const putRes = await fetch(`${ninjaUrl}/api/v1/clients/${client.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              name,
              phone,
              address1: street,
              postal_code: zip,
              city,
              country_id: COUNTRY_IDS[country] ?? '',
            }),
          })
          results.ninja = putRes.ok ? 'updated' : `error_${putRes.status}`
        }
      }
    } catch (e) {
      results.ninja = `exception: ${e}`
    }
  } else {
    results.ninja = 'not_configured'
  }

  console.log(`[update-user-profile] ${email}:`, results)
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
