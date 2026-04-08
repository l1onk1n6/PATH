// Parses LinkedIn profile text using Claude AI
// Required Secret: ANTHROPIC_API_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS })

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'not_configured' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  const { text } = await req.json().catch(() => ({ text: '' }))
  if (!text?.trim()) {
    return new Response(JSON.stringify({ error: 'no_text' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  const prompt = `Extract LinkedIn profile data from the following text and return ONLY a valid JSON object with this exact structure (no explanation, no markdown, just JSON):

{
  "firstName": "",
  "lastName": "",
  "title": "",
  "summary": "",
  "workExperiences": [
    { "position": "", "company": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "current": false, "description": "" }
  ],
  "educations": [
    { "degree": "", "field": "", "institution": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM" }
  ],
  "skills": [
    { "name": "" }
  ]
}

Rules:
- Dates must be in YYYY-MM format, use empty string "" if unknown
- Set current=true if the person is still working there (end date = "Heute"/"Present")
- endDate should be "" when current=true
- Include all jobs, education entries and skills you can find
- Return ONLY the JSON, nothing else

LinkedIn profile text:
${text.slice(0, 12000)}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const content = data.content?.[0]?.text ?? ''

    // Strip potential markdown code fences
    const json = content.replace(/^```json?\n?/i, '').replace(/```$/m, '').trim()
    const parsed = JSON.parse(json)

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[parse-linkedin] error:', e)
    return new Response(JSON.stringify({ error: 'parse_failed' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
