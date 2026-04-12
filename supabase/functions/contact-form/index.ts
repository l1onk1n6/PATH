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
//   TURNSTILE_SECRET_KEY   Cloudflare Turnstile secret key
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM  (already set)

import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const RECIPIENT     = 'info@pixmatic.ch'
const RATE_LIMIT    = 3          // max submissions
const RATE_WINDOW_H = 24         // per N hours

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')   return json({ error: 'Method not allowed' }, 405)

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

  // Use Supabase admin client to verify the token — authoritative and handles all JWT formats
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

  // ── 2. Honeypot — bots fill hidden fields, humans don't ─────────────────────
  if (_hp) {
    // Silently succeed so bots don't know they were caught
    return json({ ok: true })
  }

  // ── Basic input validation ───────────────────────────────────────────────────
  if (!name?.trim() || !message?.trim()) {
    return json({ error: 'Name und Nachricht sind erforderlich.', step: 'validation' }, 400)
  }

  // ── 3. Cloudflare Turnstile verification ─────────────────────────────────────
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!turnstileSecret) {
    // Secret not yet configured — allow in dev, log warning
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

  // ── Send email via SMTP ──────────────────────────────────────────────────────
  const smtpHost = Deno.env.get('SMTP_HOST')
  const smtpUser = Deno.env.get('SMTP_USER')
  const smtpPass = Deno.env.get('SMTP_PASS')
  const smtpFrom = Deno.env.get('SMTP_FROM')

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    console.error('SMTP not configured:', { smtpHost: !!smtpHost, smtpUser: !!smtpUser, smtpPass: !!smtpPass, smtpFrom: !!smtpFrom })
    return json({ error: 'E-Mail-Versand nicht konfiguriert. Bitte direkt an info@pixmatic.ch schreiben.', step: 'sending' }, 500)
  }

  const transporter = nodemailer.createTransport({
    host:   smtpHost,
    port:   parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
    secure: Deno.env.get('SMTP_PORT') === '465',
    auth: { user: smtpUser, pass: smtpPass },
  })

  const replyTo = email?.trim() || undefined

  try {
    await transporter.sendMail({
      from:    smtpFrom,
      to:      RECIPIENT,
      replyTo,
      subject: `[PATH Kontakt] ${subject?.trim() || 'Neue Nachricht'} – ${name.trim()}`,
      text: [
        `Name:    ${name.trim()}`,
        replyTo ? `E-Mail:  ${replyTo}` : '',
        `Betreff: ${subject?.trim() || '—'}`,
        '',
        message.trim(),
      ].filter(Boolean).join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="margin-bottom:4px">Neue Kontaktanfrage – PATH</h2>
          <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
            <tr><td style="padding:6px 12px 6px 0;color:#666;width:80px">Name</td><td style="padding:6px 0"><strong>${name.trim()}</strong></td></tr>
            ${replyTo ? `<tr><td style="padding:6px 12px 6px 0;color:#666">E-Mail</td><td style="padding:6px 0"><a href="mailto:${replyTo}">${replyTo}</a></td></tr>` : ''}
            <tr><td style="padding:6px 12px 6px 0;color:#666">Betreff</td><td style="padding:6px 0">${subject?.trim() || '—'}</td></tr>
          </table>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px;white-space:pre-wrap">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      `,
    })
  } catch (smtpErr) {
    console.error('SMTP send failed:', smtpErr)
    return json({ error: 'E-Mail konnte nicht gesendet werden. Bitte direkt an info@pixmatic.ch schreiben.', step: 'sending' }, 500)
  }

  // ── Log submission for rate limiting ─────────────────────────────────────────
  // Best-effort — don't fail the request if the log insert fails
  await admin.from('contact_log').insert({ user_id: userId }).catch((e: unknown) => {
    console.error('contact_log insert failed:', e)
  })

  return json({ ok: true })
})
