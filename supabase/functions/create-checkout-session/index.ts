// JWT enforcement: OFF   (entspricht dem Live-Zustand; am 18.09.2026 gemessen:
// GET ohne Authorization-Header liefert das blanke "Unauthorized" dieser Function,
// nicht den Gateway-Fehler UNAUTHORIZED_NO_AUTH_HEADER — das Gateway laesst den
// Aufruf also durch.) Ungefaehrlich, weil die Function den Token unten selbst
// gegen Supabase prueft (admin.auth.getUser), Signatur eingeschlossen.
//
// Vorher wurde hier nur der Payload base64-dekodiert (jwtPayload()), mit dem
// Kommentar "gateway already verified". Das Gateway laeuft fuer diese Function
// aber mit --no-verify-jwt — der Kommentar war falsch. Ein selbstgebauter Token
// mit fremdem "sub" haette damit eine Checkout-Sitzung fuer ein fremdes Konto
// geoeffnet (Schaden begrenzt: der Angreifer zahlt selbst). Fix wie in
// create-portal-session: admin.auth.getUser(token) statt jwtPayload().

import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

const PRICE_MONTHLY = 'price_1TJhY4FR6KM5Wltxzkoyt3Uy'
const PRICE_YEARLY  = 'price_1TOiqjFR6KM5WltxyL15HA80'
const APP_URL       = 'https://path.pixmatic.ch'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    console.log('[checkout] auth header present:', authHeader.length > 0, '| starts with Bearer:', authHeader.startsWith('Bearer '))

    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      console.log('[checkout] no token → 401')
      return new Response('Unauthorized', { status: 401, headers: cors })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Der Token wird gegen Supabase geprueft, Signatur eingeschlossen.
    const { data: authData, error: authErr } = await admin.auth.getUser(token)
    const userId = authData?.user?.id
    if (authErr || !userId) {
      console.log('[checkout] token invalid → 401')
      return new Response('Unauthorized', { status: 401, headers: cors })
    }
    const userEmail = authData.user.email
    console.log('[checkout] userId:', userId)

    // Optional body: { plan: 'monthly' | 'yearly' }
    let plan: 'monthly' | 'yearly' = 'monthly'
    try {
      const body = await req.json()
      if (body?.plan === 'yearly') plan = 'yearly'
    } catch { /* no body — default monthly */ }

    const priceId = plan === 'yearly' ? PRICE_YEARLY : PRICE_MONTHLY
    console.log('[checkout] plan:', plan, '| priceId:', priceId)

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

    // Find or create Stripe customer
    const { data: existing } = await admin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = existing?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { user_id: userId },
      })
      customerId = customer.id
      await admin.from('stripe_customers').insert({
        user_id: userId,
        stripe_customer_id: customerId,
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer:              customerId,
      line_items:            [{ price: priceId, quantity: 1 }],
      mode:                  'subscription',
      success_url:           `${APP_URL}/#/account?success=1`,
      cancel_url:            `${APP_URL}/#/account`,
      metadata:              { user_id: userId },
      allow_promotion_codes: true,
    })

    console.log('[checkout] session created:', session.id)
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[checkout] error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
