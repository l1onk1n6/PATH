// sync-subscription — stellt user_metadata.plan mit dem aktuellen Stripe-
// Abo-Stand gleich. Wird vom Client beim Login aufgerufen, damit Pro-User
// ihren Status sofort auf allen Geraeten sehen — auch wenn der Stripe-
// Webhook mal verpasst wurde oder RevenueCat vorher das Plan-Metadata
// ueberschrieben hat.
//
// Logik:
//   1. User-JWT → user_id
//   2. stripe_customer_id lookup
//   3. Liste aktiver Stripe-Subscriptions
//   4. Hat Active/Trialing → plan=pro, source=stripe (falls Source nicht
//      'revenuecat' ist — RC hat Vorrang wenn es selbst schreibt)
//   5. Keine → bei source=stripe auf free downgraden, sonst unveraendert
//
// Secrets: STRIPE_SECRET_KEY (bereits fuer stripe-webhook vorhanden)

import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jwtPayload(token: string): Record<string, unknown> {
  try {
    let part = token.split('.')[1] ?? ''
    part = part.replace(/-/g, '+').replace(/_/g, '/')
    while (part.length % 4 !== 0) part += '='
    return JSON.parse(atob(part))
  } catch { return {} }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const payload = jwtPayload(token)
    const userId = payload.sub as string
    if (!userId) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: u } = await admin.auth.admin.getUserById(userId)
    const existing = u?.user?.user_metadata ?? {}
    const currentPlan   = (existing.plan as string | undefined) ?? 'free'
    const currentSource = existing.subscription_source as string | undefined

    // RevenueCat hat Vorrang, wenn es selbst geschrieben hat — nicht ueberschreiben.
    if (currentSource === 'revenuecat') {
      return json({ plan: currentPlan, source: 'revenuecat', changed: false })
    }

    // Stripe-Customer zum User finden
    const { data: cust } = await admin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!cust?.stripe_customer_id) {
      // Keine Stripe-Kundenbeziehung — wenn Plan lokal 'pro' ist, nichts anfassen
      // (kann RC-Pro sein das aber keinen Source-Tag gesetzt hatte).
      return json({ plan: currentPlan, source: currentSource, changed: false, reason: 'no_stripe_customer' })
    }

    // Aktive / Trialing Subs finden
    const subs = await stripe.subscriptions.list({
      customer: cust.stripe_customer_id,
      status:   'all',
      limit:    10,
    })
    const active = subs.data.find(s => s.status === 'active' || s.status === 'trialing')

    let nextPlan: 'pro' | 'free'
    let nextSource: string | undefined
    let nextPeriodEnd: number | null | undefined

    if (active) {
      nextPlan       = 'pro'
      nextSource     = 'stripe'
      nextPeriodEnd  = active.current_period_end ?? null
    } else {
      // Nur downgraden wenn wir vorher selbst gesetzt haben (oder nichts anderes).
      if (currentSource && currentSource !== 'stripe') {
        return json({ plan: currentPlan, source: currentSource, changed: false, reason: 'source_not_stripe' })
      }
      nextPlan       = 'free'
      nextSource     = undefined
      nextPeriodEnd  = null
    }

    // Keine Aenderung noetig?
    const changed = currentPlan !== nextPlan
      || (existing.subscription_source as string | undefined) !== nextSource

    if (!changed) {
      return json({ plan: nextPlan, source: nextSource, changed: false })
    }

    const { error } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existing,
        plan: nextPlan,
        subscription_source: nextSource,
        subscription_period_end: nextPeriodEnd,
      },
    })
    if (error) throw error

    return json({ plan: nextPlan, source: nextSource, changed: true })
  } catch (err) {
    console.error('sync-subscription error', err)
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
