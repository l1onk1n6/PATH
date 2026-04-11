// Edge Function: contact-form
// JWT enforcement: OFF — anonymous submissions allowed (protected by Turnstile)
//
// Required Supabase secrets:
//   TURNSTILE_SECRET_KEY   Cloudflare Turnstile secret key
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM  (already set)

import nodemailer from 'npm:nodemailer@6'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
}

const RECIPIENT = 'info@pixmatic.ch'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  let body: { name?: string; email?: string; subject?: string; message?: string; token?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { name, email, subject, message, token } = body

  // ── Validate inputs ──────────────────────────────────────────────────────────
  if (!name?.trim() || !message?.trim() || !token) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── Verify Cloudflare Turnstile token ────────────────────────────────────────
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!turnstileSecret) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: turnstileSecret, response: token }),
  })
  const verifyData = await verifyRes.json() as { success: boolean; 'error-codes'?: string[] }

  if (!verifyData.success) {
    return new Response(JSON.stringify({ error: 'Turnstile-Verifizierung fehlgeschlagen' }), {
      status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── Send email via SMTP ──────────────────────────────────────────────────────
  const transporter = nodemailer.createTransport({
    host:   Deno.env.get('SMTP_HOST')!,
    port:   parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
    secure: Deno.env.get('SMTP_PORT') === '465',
    auth: {
      user: Deno.env.get('SMTP_USER')!,
      pass: Deno.env.get('SMTP_PASS')!,
    },
  })

  const replyTo = email?.trim() ? email.trim() : undefined

  await transporter.sendMail({
    from:    Deno.env.get('SMTP_FROM')!,
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

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
