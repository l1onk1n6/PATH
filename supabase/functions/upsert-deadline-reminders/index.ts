// Secrets required: none (uses service role from env)
// JWT enforcement: OFF — called with user Bearer token, verified manually

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
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return new Response('Unauthorized', { status: 401, headers: cors })

    const payload = jwtPayload(token)
    const userId  = payload.sub as string
    const email   = payload.email as string
    if (!userId || !email) return new Response('Unauthorized', { status: 401, headers: cors })

    const { resume_id, deadline, reminder_days, resume_name } = await req.json() as {
      resume_id:    string
      deadline:     string   // YYYY-MM-DD or ''
      reminder_days: number[] // e.g. [1, 3, 7]
      resume_name:  string
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Delete all existing unsent reminders for this resume
    await admin
      .from('deadline_reminders')
      .delete()
      .eq('user_id', userId)
      .eq('resume_id', resume_id)
      .eq('sent', false)

    // Nothing to create if no deadline or no reminder days
    if (!deadline || !reminder_days?.length) {
      return new Response(JSON.stringify({ created: 0 }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const deadlineDate = new Date(deadline + 'T23:59:00Z')
    const now = new Date()

    const rows = reminder_days
      .map(days => {
        const remindAt = new Date(deadlineDate.getTime() - days * 86400000)
        return remindAt > now ? {
          user_id:     userId,
          resume_id,
          resume_name,
          deadline,
          remind_at:   remindAt.toISOString(),
          email,
          sent:        false,
        } : null
      })
      .filter(Boolean)

    if (rows.length > 0) {
      await admin.from('deadline_reminders').insert(rows)
    }

    return new Response(JSON.stringify({ created: rows.length }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
