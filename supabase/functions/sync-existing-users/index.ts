// One-time sync: pushes all existing Supabase users to Listmonk + InvoiceNinja
// Run via: Supabase Dashboard → Edge Functions → sync-existing-users → Test (service role)

import { createClient } from 'npm:@supabase/supabase-js@2'

// Find active (non-deleted) InvoiceNinja client ID by contact email
async function findNinjaClientId(url: string, token: string, email: string): Promise<string | null> {
  const res = await fetch(`${url}/api/v1/clients?filter=${encodeURIComponent(email)}&per_page=10`, {
    headers: { 'X-Api-Token': token, Accept: 'application/json' },
  })
  if (!res.ok) return null
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
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const listmonkUrl  = Deno.env.get('LISTMONK_URL')?.replace(/\/$/, '')
  const listmonkUser = Deno.env.get('LISTMONK_USERNAME')?.trim()
  const listmonkPass = Deno.env.get('LISTMONK_PASSWORD')?.trim()
  const listmonkList = Number(Deno.env.get('LISTMONK_LIST_ID') ?? '1')
  const ninjaUrl     = Deno.env.get('INVOICE_NINJA_URL')?.replace(/\/$/, '')
  const ninjaToken   = Deno.env.get('INVOICE_NINJA_TOKEN')

  const results: Array<{ email: string; listmonk?: string; ninja?: string }> = []
  let page = 1, hasMore = true

  while (hasMore) {
    const { data: { users }, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error || !users?.length) break
    hasMore = users.length === 100
    page++

    for (const user of users) {
      const { id: userId, email } = user
      if (!email) continue

      const name      = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || ''
      const firstName = name.split(' ')[0] ?? ''
      const lastName  = name.split(' ').slice(1).join(' ') || firstName
      const row: { email: string; listmonk?: string; ninja?: string } = { email }

      // ── Listmonk: create subscriber (409 = already exists, skip) ──
      if (listmonkUrl && listmonkUser && listmonkPass) {
        try {
          const creds = btoa(unescape(encodeURIComponent(`${listmonkUser.trim()}:${listmonkPass.trim()}`)))
          const res   = await fetch(`${listmonkUrl}/api/subscribers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Basic ${creds}` },
            body: JSON.stringify({
              email, name: name || email, status: 'enabled',
              lists: [listmonkList],
              attribs: { user_id: userId, source: 'path_app_sync' },
              preconfirm_subscriptions: true,
            }),
          })
          row.listmonk = res.status === 409 ? 'already_exists' : res.ok ? 'created' : `error_${res.status}`
        } catch (e) { row.listmonk = `exception: ${e}` }
      }

      // ── InvoiceNinja: find by email, update or create ──
      if (ninjaUrl && ninjaToken) {
        try {
          const headers = { 'X-Api-Token': ninjaToken, 'Content-Type': 'application/json', Accept: 'application/json' }
          const clientId = await findNinjaClientId(ninjaUrl, ninjaToken, email)

          if (clientId) {
            // Already exists — update name/custom_value1 only
            const res = await fetch(`${ninjaUrl}/api/v1/clients/${clientId}`, {
              method: 'PUT', headers,
              body: JSON.stringify({ name: name || email, custom_value1: userId }),
            })
            row.ninja = res.ok ? 'updated' : `error_${res.status}`
          } else {
            // Create new
            const res = await fetch(`${ninjaUrl}/api/v1/clients`, {
              method: 'POST', headers,
              body: JSON.stringify({
                name: name || email,
                contacts: [{ email, first_name: firstName, last_name: lastName || firstName, send_email: false }],
                custom_value1: userId,
                public_notes: `PATH App user. Supabase signup: ${user.created_at}`,
              }),
            })
            row.ninja = res.ok ? 'created' : `error_${res.status}`
          }
        } catch (e) { row.ninja = `exception: ${e}` }
      }

      results.push(row)
      await new Promise(r => setTimeout(r, 120))
    }
  }

  return new Response(JSON.stringify({ total: results.length, results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
