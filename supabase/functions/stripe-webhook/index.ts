// Secrets required in Supabase Dashboard → Edge Functions → Secrets:
//   STRIPE_SECRET_KEY      = sk_live_...
//   STRIPE_WEBHOOK_SECRET  = whsec_...

import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  const stripe        = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch (err) {
    console.error('Signature verification failed:', err)
    return new Response(`Webhook Error: ${err}`, { status: 400 })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  /** Look up our user_id from a Stripe customer_id */
  async function getUserId(customerId: string): Promise<string | null> {
    const { data } = await admin
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    return data?.user_id ?? null
  }

  /** Update user_metadata.plan (and optional extra fields) without overwriting other metadata */
  async function setPlan(userId: string, plan: 'free' | 'pro', extra: Record<string, unknown> = {}) {
    const { data: u } = await admin.auth.admin.getUserById(userId)
    const existing = u?.user?.user_metadata ?? {}

    const { error } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...existing, plan, ...extra },
    })
    if (error) console.error(`setPlan error for ${userId}:`, error)
    else       console.log(`✓ ${userId} → ${plan}`, extra)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const userId  = session.metadata?.user_id
      if (userId) {
        if (session.customer) {
          await admin.from('stripe_customers').upsert({
            user_id:            userId,
            stripe_customer_id: session.customer as string,
          })
        }
        // Fetch subscription to get period end
        let periodEnd: number | null = null
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          periodEnd = sub.current_period_end ?? null
        }
        await setPlan(userId, 'pro', periodEnd ? { subscription_period_end: periodEnd } : {})

        // ── Referral reward ──────────────────────────────────
        // If this user was referred and hasn't been rewarded yet, credit the referrer 1 month
        if (session.mode === 'subscription') {
          try {
            const { data: referral } = await admin
              .from('referrals')
              .select('id, referrer_id')
              .eq('referee_id', userId)
              .eq('subscribed', false)
              .maybeSingle()

            if (referral) {
              await admin.from('referrals')
                .update({ subscribed: true, rewarded: true })
                .eq('id', referral.id)

              const { data: referrerStripe } = await admin
                .from('stripe_customers')
                .select('stripe_customer_id')
                .eq('user_id', referral.referrer_id)
                .maybeSingle()

              if (referrerStripe?.stripe_customer_id) {
                await stripe.customers.createBalanceTransaction(
                  referrerStripe.stripe_customer_id,
                  { amount: -500, currency: 'chf', description: 'Referral reward: CHF 5.00 credit' },
                )
                console.log(`✓ Referral reward (−CHF 5.00) credited to ${referral.referrer_id}`)
              }
            }
          } catch (e) {
            console.error('Referral reward error:', e)
          }
        }
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = await getUserId(sub.customer as string)
      if (userId) {
        const plan: 'pro' | 'free' =
          ['active', 'trialing'].includes(sub.status) ? 'pro' : 'free'
        await setPlan(userId, plan, { subscription_period_end: sub.current_period_end ?? null })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = await getUserId(sub.customer as string)
      if (userId) await setPlan(userId, 'free', { subscription_period_end: null })
      break
    }
  }

  return new Response('ok', { status: 200 })
})
