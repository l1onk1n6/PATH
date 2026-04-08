// Triggered via Supabase Database Webhook on auth.users INSERT
// Setup: Supabase Dashboard → Database → Webhooks → Create Webhook
//   Table: users  |  Schema: auth  |  Event: INSERT
//   Type: HTTP Request → POST → [this function's URL]
//   Headers: Authorization: Bearer [SUPABASE_SERVICE_ROLE_KEY]
//
// Required Secrets (Edge Functions → Secrets):
//   LISTMONK_URL          = https://listmonk.yourdomain.com
//   LISTMONK_USERNAME     = admin
//   LISTMONK_PASSWORD     = yourpassword (or API token)
//   LISTMONK_LIST_ID      = 1          (integer ID of your list)
//   INVOICE_NINJA_URL     = https://invoiceninja.yourdomain.com
//   INVOICE_NINJA_TOKEN   = your-api-token

interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: {
    id: string
    email: string
    raw_user_meta_data: Record<string, unknown>
    email_confirmed_at: string | null
    created_at: string
  }
  old_record: null | Record<string, unknown>
}

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
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let payload: SupabaseWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (payload.type !== 'INSERT' || payload.schema !== 'auth' || payload.table !== 'users') {
    return new Response('ignored', { status: 200 })
  }

  const { id: userId, email, raw_user_meta_data } = payload.record
  const name      = (raw_user_meta_data?.full_name as string) || (raw_user_meta_data?.name as string) || ''
  const firstName = name.split(' ')[0] ?? ''
  const lastName  = name.split(' ').slice(1).join(' ') || firstName

  console.log(`[on-user-signup] New user: ${email} (${userId})`)

  const results: Record<string, unknown> = {}

  // ── Listmonk ────────────────────────────────────────────────
  const listmonkUrl  = Deno.env.get('LISTMONK_URL')?.replace(/\/$/, '')
  const listmonkUser = Deno.env.get('LISTMONK_USERNAME')?.trim()
  const listmonkPass = Deno.env.get('LISTMONK_PASSWORD')?.trim()
  const listmonkList = Number(Deno.env.get('LISTMONK_LIST_ID') ?? '1')

  if (listmonkUrl && listmonkUser && listmonkPass) {
    try {
      const credentials = btoa(unescape(encodeURIComponent(`${listmonkUser}:${listmonkPass}`)))
      const res = await fetch(`${listmonkUrl}/api/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          email,
          name: name || email,
          status: 'enabled',
          lists: [listmonkList],
          attribs: { user_id: userId, source: 'path_app' },
          preconfirm_subscriptions: true,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        results.listmonk = { ok: true, subscriberId: data?.data?.id }
        console.log(`[on-user-signup] ✓ Listmonk subscriber created: ${data?.data?.id}`)
      } else if (res.status === 409) {
        results.listmonk = { ok: true, note: 'already exists' }
        console.log(`[on-user-signup] Listmonk: subscriber already exists for ${email}`)
      } else {
        const body = await res.text()
        results.listmonk = { ok: false, status: res.status, body }
        console.error(`[on-user-signup] Listmonk error ${res.status}: ${body}`)
      }
    } catch (err) {
      results.listmonk = { ok: false, error: String(err) }
      console.error('[on-user-signup] Listmonk exception:', err)
    }
  } else {
    results.listmonk = { ok: false, note: 'not configured' }
  }

  // ── InvoiceNinja ────────────────────────────────────────────
  const ninjaUrl   = Deno.env.get('INVOICE_NINJA_URL')?.replace(/\/$/, '')
  const ninjaToken = Deno.env.get('INVOICE_NINJA_TOKEN')

  if (ninjaUrl && ninjaToken) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Api-Token': ninjaToken,
        'Accept': 'application/json',
      }

      // Check if client already exists (avoid duplicates)
      const existingId = await findNinjaClientId(ninjaUrl, ninjaToken, email)

      if (existingId) {
        console.log(`[on-user-signup] InvoiceNinja: client already exists (${existingId})`)
        results.invoiceNinja = { ok: true, note: 'already exists', clientId: existingId }
      } else {
        const res = await fetch(`${ninjaUrl}/api/v1/clients`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: name || email,
            contacts: [{ email, first_name: firstName, last_name: lastName || firstName, send_email: false }],
            custom_value1: userId,
            public_notes: `PATH App user. Signed up: ${new Date().toISOString()}`,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          results.invoiceNinja = { ok: true, clientId: data?.data?.id }
          console.log(`[on-user-signup] ✓ InvoiceNinja client created: ${data?.data?.id}`)
        } else {
          const body = await res.text()
          results.invoiceNinja = { ok: false, status: res.status, body }
          console.error(`[on-user-signup] InvoiceNinja error ${res.status}: ${body}`)
        }
      }
    } catch (err) {
      results.invoiceNinja = { ok: false, error: String(err) }
      console.error('[on-user-signup] InvoiceNinja exception:', err)
    }
  } else {
    results.invoiceNinja = { ok: false, note: 'not configured' }
  }

  return new Response(JSON.stringify({ userId, email, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
