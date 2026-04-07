// Secrets required in Supabase Dashboard → Edge Functions → Secrets:
//   STRIPE_SECRET_KEY   = sk_live_...
//   (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are auto-injected)

import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

const PRICE_ID = 'price_1TJhY4FR6KM5Wltxzkoyt3Uy'
const APP_URL  = 'https://path.pixmatic.ch'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

    // Extract JWT from Authorization header and verify directly
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401, headers: cors })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return new Response('Unauthorized', { status: 401, headers: cors })

    // Service-role client for stripe_customers table
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Find or create Stripe customer
    const { data: existing } = await admin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = existing?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await admin.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer:              customerId,
      line_items:            [{ price: PRICE_ID, quantity: 1 }],
      mode:                  'subscription',
      success_url:           `${APP_URL}/#/account?success=1`,
      cancel_url:            `${APP_URL}/#/account`,
      metadata:              { user_id: user.id },
      allow_promotion_codes: true,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
