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
//   ADMIN_NOTIFY_EMAIL    = admin@pixmatic.ch   (optional — empty = skip)
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM   (used by send-deadline-reminders — wiederverwendet)

import nodemailer from 'npm:nodemailer@6'

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

  // ── Admin Notification ──────────────────────────────────────
  const adminEmail = Deno.env.get('ADMIN_NOTIFY_EMAIL')?.trim()
  const smtpHost   = Deno.env.get('SMTP_HOST')
  const smtpUser   = Deno.env.get('SMTP_USER')
  const smtpPass   = Deno.env.get('SMTP_PASS')
  const smtpFrom   = Deno.env.get('SMTP_FROM') ?? smtpUser

  if (adminEmail && smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host:   smtpHost,
        port:   parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
        secure: Deno.env.get('SMTP_PORT') === '465',
        auth: { user: smtpUser, pass: smtpPass },
      })

      const createdAt = new Date(payload.record.created_at).toLocaleString('de-CH', {
        timeZone: 'Europe/Zurich', dateStyle: 'medium', timeStyle: 'short',
      })

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1c1c1e;">
          <h2 style="margin: 0 0 8px; font-size: 20px; color: #007AFF;">🎉 Neue PATH-Registrierung</h2>
          <p style="margin: 0 0 20px; color: #6e6e73; font-size: 14px;">Ein neuer Nutzer hat sich gerade angemeldet.</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #6e6e73; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6e6e73;">E-Mail</td><td style="padding: 8px 0; font-weight: 600;"><a href="mailto:${email}" style="color: #007AFF; text-decoration: none;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #6e6e73;">User-ID</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${userId}</td></tr>
            <tr><td style="padding: 8px 0; color: #6e6e73;">Zeitpunkt</td><td style="padding: 8px 0;">${createdAt}</td></tr>
          </table>
        </div>
      `

      await transporter.sendMail({
        from:    smtpFrom,
        to:      adminEmail,
        subject: `Neue PATH-Registrierung: ${email}`,
        html,
      })

      results.adminNotify = { ok: true, to: adminEmail }
      console.log(`[on-user-signup] ✓ Admin notified: ${adminEmail}`)
    } catch (err) {
      results.adminNotify = { ok: false, error: String(err) }
      console.error('[on-user-signup] Admin notify failed:', err)
    }
  } else {
    results.adminNotify = { ok: false, note: 'not configured' }
  }

  return new Response(JSON.stringify({ userId, email, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
