// Edge Function: get-shared-docs
// Returns documents for a shared resume token (no auth required).
// Uses service role to bypass RLS and generate signed storage URLs.
//
// GET ?token=<share_token> → { documents: UploadedDocument[] }

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Content-Type': 'application/json',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'GET') return json({ error: 'method not allowed' }, 405)

  const token = new URL(req.url).searchParams.get('token')
  if (!token) return json({ error: 'token required' }, 400)

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // Resolve token → resume_id via new share_links table
    const { data: link } = await sb
      .from('share_links')
      .select('resume_id')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle()

    // Fallback: legacy resumes.share_token
    let resumeId: string | null = (link as { resume_id: string } | null)?.resume_id ?? null
    if (!resumeId) {
      const { data: resume } = await sb
        .from('resumes')
        .select('id')
        .eq('share_token', token)
        .not('share_token', 'is', null)
        .maybeSingle()
      resumeId = (resume as { id: string } | null)?.id ?? null
    }

    if (!resumeId) return json({ documents: [] })

    // Fetch document metadata
    const { data: docs, error } = await sb
      .from('documents')
      .select('id, name, type, size, category, data_url, storage_path, uploaded_at')
      .eq('resume_id', resumeId)
      .order('uploaded_at')

    if (error) throw error

    // Generate signed URLs for Supabase Storage files
    const result = await Promise.all(
      (docs ?? []).map(async (doc: Record<string, unknown>) => {
        let dataUrl = (doc.data_url as string) ?? ''
        const storagePath = (doc.storage_path as string) ?? null
        if (storagePath) {
          const { data: signed } = await sb.storage
            .from('documents')
            .createSignedUrl(storagePath, 3600)
          if (signed?.signedUrl) dataUrl = signed.signedUrl
        }
        return {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          category: doc.category,
          dataUrl,
          storagePath: storagePath ?? undefined,
          uploadedAt: doc.uploaded_at,
        }
      }),
    )

    return json({ documents: result })
  } catch (e) {
    console.error('[get-shared-docs]', e)
    return json({ error: String(e) }, 500)
  }
})
