import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

const PRICE_ID = 'price_1TJhY4FR6KM5Wltxzkoyt3Uy'
const APP_URL  = 'https://path.pixmatic.ch'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** Decode JWT payload without re-verifying (gateway already verified) */
function jwtPayload(token: string): Record<string, unknown> {
  const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(part))
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

    let payload: Record<string, unknown>
    try {
      payload = jwtPayload(token)
    } catch (e) {
      console.log('[checkout] JWT decode failed:', e)
      return new Response('Unauthorized', { status: 401, headers: cors })
    }

    const userId = payload.sub as string
    const userEmail = payload.email as string | undefined
    console.log('[checkout] userId:', userId ?? 'MISSING', '| role:', payload.role)

    if (!userId) {
      console.log('[checkout] no sub in JWT → 401')
      return new Response('Unauthorized', { status: 401, headers: cors })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

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
      line_items:            [{ price: PRICE_ID, quantity: 1 }],
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
