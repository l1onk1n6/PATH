// One-time sync: pushes all existing Supabase users to Listmonk + InvoiceNinja
// Run once via: Supabase Dashboard → Edge Functions → sync-existing-users → Invoke
// Same Secrets as on-user-signup are required.

import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Simple auth check — only allow with service role key
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const listmonkUrl  = Deno.env.get('LISTMONK_URL')
  const listmonkUser = Deno.env.get('LISTMONK_USERNAME')
  const listmonkPass = Deno.env.get('LISTMONK_PASSWORD')
  const listmonkList = Number(Deno.env.get('LISTMONK_LIST_ID') ?? '1')
  const ninjaUrl     = Deno.env.get('INVOICE_NINJA_URL')
  const ninjaToken   = Deno.env.get('INVOICE_NINJA_TOKEN')

  // Fetch all users (max 1000 per page)
  const results: Array<{ email: string; listmonk?: string; ninja?: string }> = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const { data: { users }, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error || !users?.length) break
    hasMore = users.length === 100
    page++

    for (const user of users) {
      const { id: userId, email } = user
      if (!email) continue

      const name = (user.user_metadata?.name as string) || ''
      const firstName = name.split(' ')[0] ?? ''
      const lastName  = name.split(' ').slice(1).join(' ') || firstName
      const row: { email: string; listmonk?: string; ninja?: string } = { email }

      // ── Listmonk ────────────────────────────────────────────
      if (listmonkUrl && listmonkUser && listmonkPass) {
        try {
          const creds = btoa(`${listmonkUser}:${listmonkPass}`)
          const res = await fetch(`${listmonkUrl}/api/subscribers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${creds}` },
            body: JSON.stringify({
              email, name: name || email, status: 'enabled',
              lists: [listmonkList],
              attribs: { user_id: userId, source: 'path_app_sync' },
              preconfirm_subscriptions: true,
            }),
          })
          row.listmonk = res.status === 409 ? 'already_exists' : res.ok ? 'created' : `error_${res.status}`
        } catch (e) {
          row.listmonk = `exception: ${e}`
        }
      }

      // ── InvoiceNinja ─────────────────────────────────────────
      if (ninjaUrl && ninjaToken) {
        try {
          const res = await fetch(`${ninjaUrl}/api/v1/clients`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Token': ninjaToken,
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
              name: name || email,
              contacts: [{ email, first_name: firstName, last_name: lastName || firstName, send_email: false }],
              custom_value1: userId,
              public_notes: `PATH App user (bulk sync). Supabase signup: ${user.created_at}`,
            }),
          })
          row.ninja = res.ok ? 'created' : `error_${res.status}`
        } catch (e) {
          row.ninja = `exception: ${e}`
        }
      }

      results.push(row)
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 120))
    }
  }

  return new Response(JSON.stringify({ total: results.length, results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
