// Secrets required: STRIPE_SECRET_KEY

import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

const APP_URL = 'https://path.pixmatic.ch'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** Decode JWT payload (with base64url padding fix) */
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
    if (!token) return new Response('Unauthorized', { status: 401, headers: cors })

    // Extract user info from JWT claims (already verified by gateway)
    const payload = jwtPayload(token)
    const userId = payload.sub as string
    if (!userId) return new Response('Unauthorized', { status: 401, headers: cors })

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data } = await admin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (!data?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'Kein Stripe-Konto gefunden.' }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   data.stripe_customer_id,
      return_url: `${APP_URL}/#/account`,
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
