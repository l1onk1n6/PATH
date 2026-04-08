// Grants or revokes Pro plan for any user — no Stripe required.
//
// Secrets required: ADMIN_SECRET  (any random string you choose)
//
// Usage example:
//   curl -X POST https://<project>.supabase.co/functions/v1/admin-set-plan \
//     -H "Content-Type: application/json" \
//     -H "x-admin-secret: <your-ADMIN_SECRET>" \
//     -d '{"email": "customer@example.com", "plan": "pro"}'
//
// To revoke:
//   -d '{"email": "customer@example.com", "plan": "free"}'

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // Admin authentication via secret header
  const adminSecret = req.headers.get('x-admin-secret') ?? ''
  if (!adminSecret || adminSecret !== Deno.env.get('ADMIN_SECRET')) {
    return new Response('Forbidden', { status: 403, headers: cors })
  }

  try {
    const body = await req.json()
    const { email, plan } = body as { email?: string; plan?: string }

    if (!email || !['free', 'pro'].includes(plan ?? '')) {
      return new Response(
        JSON.stringify({ error: 'Required: { email: string, plan: "free" | "pro" }' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Find user by email
    const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (listErr) throw listErr

    const user = listData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    )
    if (!user) {
      return new Response(
        JSON.stringify({ error: `Kein Benutzer gefunden: ${email}` }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    // Preserve existing metadata, only overwrite plan
    const existing = user.user_metadata ?? {}
    const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...existing,
        plan,
        gift_pro: plan === 'pro',   // flag to distinguish gifted vs paid Pro
      },
    })
    if (updateErr) throw updateErr

    console.log(`admin-set-plan: ${email} → ${plan}`)
    return new Response(
      JSON.stringify({ ok: true, email, plan, userId: user.id }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }
})
