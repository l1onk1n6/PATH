// Cron Edge Function — called daily via pg_cron (see SQL migration)
// JWT enforcement: OFF
//
// Required Supabase secrets:
//   SMTP_HOST     e.g. smtp.hostinger.com
//   SMTP_PORT     e.g. 587
//   SMTP_USER     e.g. noreply@pixmatic.ch
//   SMTP_PASS     SMTP password
//   SMTP_FROM     e.g. "PATH by pixmatic <noreply@pixmatic.ch>"

import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const APP_URL = 'https://path.pixmatic.ch'

Deno.serve(async (_req) => {
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Fetch all unsent reminders that are due
    const { data: reminders, error } = await admin
      .from('deadline_reminders')
      .select('*')
      .lte('remind_at', new Date().toISOString())
      .eq('sent', false)

    if (error) throw error
    if (!reminders?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    // Setup SMTP transporter
    const transporter = nodemailer.createTransport({
      host:   Deno.env.get('SMTP_HOST')!,
      port:   parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
      secure: Deno.env.get('SMTP_PORT') === '465',
      auth: {
        user: Deno.env.get('SMTP_USER')!,
        pass: Deno.env.get('SMTP_PASS')!,
      },
    })

    let sent = 0
    const ids: string[] = []

    for (const r of reminders) {
      const deadlineDate = new Date(r.deadline + 'T00:00:00')
      const daysDiff = Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000)
      const daysText = daysDiff <= 0 ? 'heute' : daysDiff === 1 ? 'morgen' : `in ${daysDiff} Tagen`

      const subject = `⏰ Bewerbungsfrist ${daysText}: ${r.resume_name}`
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0e0e16; color: #fff; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #34C759, #007AFF); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 12px;">⏰</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Bewerbungsfrist naht</h1>
          </div>

          <div style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 6px;">Bewerbungsmappe</div>
            <div style="font-size: 18px; font-weight: 700; margin-bottom: 14px;">${r.resume_name}</div>
            <div style="font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Frist läuft ab</div>
            <div style="font-size: 16px; font-weight: 600; color: ${daysDiff <= 1 ? '#FF3B30' : daysDiff <= 3 ? '#FF9F0A' : '#34C759'};">
              ${new Date(r.deadline).toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              — <strong>${daysText}</strong>
            </div>
          </div>

          <a href="${APP_URL}" style="display: block; text-align: center; background: linear-gradient(135deg, #007AFF, #5856D6); color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 20px;">
            Jetzt in PATH öffnen →
          </a>

          <p style="text-align: center; font-size: 12px; color: rgba(255,255,255,0.25); margin: 0;">
            PATH by pixmatic · Du erhältst diese E-Mail weil du einen Deadline-Reminder gesetzt hast.
          </p>
        </div>
      `

      try {
        await transporter.sendMail({
          from:    Deno.env.get('SMTP_FROM') ?? Deno.env.get('SMTP_USER'),
          to:      r.email,
          subject,
          html,
        })
        ids.push(r.id)
        sent++
      } catch (mailErr) {
        console.error(`Failed to send reminder ${r.id}:`, mailErr)
      }
    }

    // Mark sent reminders
    if (ids.length > 0) {
      await admin.from('deadline_reminders').update({ sent: true }).in('id', ids)
    }

    return new Response(JSON.stringify({ sent }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
