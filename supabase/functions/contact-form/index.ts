// Edge Function: contact-form
// JWT enforcement: handled in code via admin.auth.getUser() — gateway runs with --no-verify-jwt
//
// Security layers:
//   1. JWT authentication  — anonymous calls rejected (401)
//   2. Honeypot field      — bots filling hidden field rejected silently (200)
//   3. Cloudflare Turnstile — token verified against Cloudflare API (403)
//   4. Rate limiting       — max 3 messages per user per 24 h (429)
//
// Required Supabase secrets:
//   ZAMMAD_URL             Base URL of your Zammad instance (e.g. https://support.example.com)
//   ZAMMAD_TOKEN           Zammad API token (Profile → Token Access → ticket.agent permission)
//   TURNSTILE_SECRET_KEY   Cloudflare Turnstile secret key
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM  for auto-reply to sender

import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
}

const ZAMMAD_GROUP  = 'Users'   // Change to your Zammad agent group if different
const RATE_LIMIT    = 3         // max submissions
const RATE_WINDOW_H = 24        // per N hours

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')   return json({ error: 'Method not allowed' }, 405)

  try {

  // Admin client — used for JWT verification and rate limiting
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── 1. JWT authentication ────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? ''
  const token      = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return json({ error: 'Nicht angemeldet.', step: 'auth' }, 401)
  }

  const { data: { user: authUser }, error: authError } = await admin.auth.getUser(token)
  if (authError || !authUser) {
    console.error('JWT verification failed:', authError?.message)
    return json({ error: 'Ungültige Sitzung. Bitte neu anmelden.', step: 'auth' }, 401)
  }
  const userId = authUser.id

  // ── Parse body ───────────────────────────────────────────────────────────────
  let body: {
    name?: string; email?: string; subject?: string; message?: string
    token?: string; _hp?: string
  }
  try { body = await req.json() }
  catch { return json({ error: 'Ungültige Anfrage.', step: 'parse' }, 400) }

  const { name, email, subject, message, token: turnstileToken, _hp } = body

  // ── 2. Honeypot ──────────────────────────────────────────────────────────────
  if (_hp) return json({ ok: true })

  // ── Basic input validation ───────────────────────────────────────────────────
  if (!name?.trim() || !message?.trim()) {
    return json({ error: 'Name und Nachricht sind erforderlich.', step: 'validation' }, 400)
  }

  // ── 3. Cloudflare Turnstile verification ─────────────────────────────────────
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!turnstileSecret) {
    console.warn('TURNSTILE_SECRET_KEY not set — skipping verification')
  } else {
    if (!turnstileToken) {
      return json({ error: 'Sicherheitsprüfung nicht abgeschlossen.', step: 'turnstile' }, 403)
    }
    const verifyRes  = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({ secret: turnstileSecret, response: turnstileToken }),
    })
    const verifyData = await verifyRes.json() as { success: boolean; 'error-codes'?: string[] }
    if (!verifyData.success) {
      return json({ error: 'Sicherheitsprüfung fehlgeschlagen. Bitte Seite neu laden und erneut versuchen.', step: 'turnstile' }, 403)
    }
  }

  // ── 4. Rate limiting ─────────────────────────────────────────────────────────
  const since = new Date(Date.now() - RATE_WINDOW_H * 60 * 60 * 1000).toISOString()
  const { count, error: countErr } = await admin
    .from('contact_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', since)

  if (countErr) {
    console.error('rate-limit check failed:', countErr)
    return json({ error: 'Interner Fehler. Bitte später erneut versuchen.', step: 'ratelimit' }, 500)
  }

  if ((count ?? 0) >= RATE_LIMIT) {
    return json({
      error: `Du hast in den letzten ${RATE_WINDOW_H} Stunden bereits ${RATE_LIMIT} Nachrichten gesendet. Bitte warte etwas.`,
      step: 'ratelimit',
    }, 429)
  }

  // ── 5. Create Zammad ticket via API ──────────────────────────────────────────
  const zammadUrl   = Deno.env.get('ZAMMAD_URL')?.replace(/\/$/, '')
  const zammadToken = Deno.env.get('ZAMMAD_TOKEN')

  if (!zammadUrl || !zammadToken) {
    console.error('Zammad secrets not configured')
    return json({ error: 'Ticket-System nicht konfiguriert. Bitte direkt an info@pixmatic.ch schreiben.', step: 'sending' }, 500)
  }

  const customerEmail = email?.trim() || authUser.email || ''
  const ticketTitle   = `${subject?.trim() || 'Kontaktanfrage'} – ${name.trim()}`

  const articleBody = [
    `<b>Name:</b> ${name.trim()}`,
    customerEmail ? `<b>E-Mail:</b> ${customerEmail}` : '',
    `<b>Betreff:</b> ${subject?.trim() || '—'}`,
    '<br>',
    message.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'),
  ].filter(Boolean).join('<br>')

  const zammadRes = await fetch(`${zammadUrl}/api/v1/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Token token=${zammadToken}`,
    },
    body: JSON.stringify({
      title:    ticketTitle,
      group:    ZAMMAD_GROUP,
      customer: customerEmail || 'unknown',
      article: {
        subject:      ticketTitle,
        body:         articleBody,
        type:         'note',
        internal:     false,
        content_type: 'text/html',
        sender:       'Customer',
      },
      tags: 'PATH,Kontaktformular',
    }),
  })

  if (!zammadRes.ok) {
    const errText = await zammadRes.text().catch(() => '')
    console.error('Zammad API error:', zammadRes.status, errText)
    return json({ error: 'Ticket konnte nicht erstellt werden. Bitte direkt an info@pixmatic.ch schreiben.', step: 'sending' }, 500)
  }

  // ── 6. Auto-reply to sender via SMTP (best-effort) ───────────────────────────
  // Note: if Zammad is configured with a "ticket created" trigger that also emails
  // the customer, disable either this or the Zammad trigger to avoid duplicates.
  if (customerEmail) {
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    const smtpFrom = Deno.env.get('SMTP_FROM')

    if (smtpHost && smtpUser && smtpPass && smtpFrom) {
      const transporter = nodemailer.createTransport({
        host:   smtpHost,
        port:   parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
        secure: Deno.env.get('SMTP_PORT') === '465',
        auth: { user: smtpUser, pass: smtpPass },
      })

      transporter.sendMail({
        from:    smtpFrom,
        to:      customerEmail,
        subject: 'Wir haben deine Nachricht erhalten – PATH',
        text: [
          `Hallo ${name.trim()},`,
          '',
          'vielen Dank für deine Nachricht! Wir haben sie erhalten und melden uns in der Regel innerhalb von 24 Stunden.',
          '',
          `Deine Nachricht:`,
          `"${message.trim()}"`,
          '',
          'Liebe Grüsse',
          'Das PATH-Team',
          'info@pixmatic.ch',
        ].join('\n'),
        html: `
          <div style="font-family:sans-serif;max-width:560px;color:#1a1a1a">
            <h2 style="margin-bottom:4px;color:#0f1923">Wir haben deine Nachricht erhalten</h2>
            <p style="color:#555;margin:0 0 16px">Hallo ${name.trim()},</p>
            <p style="color:#555;margin:0 0 16px">vielen Dank für deine Nachricht! Wir haben sie erhalten und melden uns in der Regel innerhalb von <strong>24 Stunden</strong>.</p>
            <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin-bottom:20px;color:#555;white-space:pre-wrap;font-size:14px">${message.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <p style="color:#555;margin:0 0 4px">Liebe Grüsse</p>
            <p style="color:#555;margin:0"><strong>Das PATH-Team</strong><br><a href="mailto:info@pixmatic.ch" style="color:#007aff">info@pixmatic.ch</a></p>
          </div>
        `,
      }).catch((e: unknown) => {
        console.error('auto-reply failed:', e)
      })
    }
  }

  // ── 7. Log submission for rate limiting ──────────────────────────────────────
  await admin.from('contact_log').insert({ user_id: userId }).catch((e: unknown) => {
    console.error('contact_log insert failed:', e)
  })

  return json({ ok: true })

  } catch (err) {
    console.error('Unhandled error in contact-form:', err)
    return json({ error: 'Interner Fehler. Bitte direkt an info@pixmatic.ch schreiben.' }, 500)
  }
})
