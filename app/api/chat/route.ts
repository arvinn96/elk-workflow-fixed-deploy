import { NextResponse } from 'next/server'
import { OPENROUTER_URL, MODEL, SYSTEM_PROMPT } from '@/lib/ai/ai-config'
import { createClient } from '@/lib/supabase/server'
import { createRequestInternal } from '@/lib/supabase/requests'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'AI API Key not configured.' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call OpenRouter
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.replace(/[^\x00-\x7F]/g, '-')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        ],
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`OpenRouter error: ${errorText}`)
    }

    const data = await res.json()
    let aiResponse = data.choices?.[0]?.message?.content ?? ''
    let toolResult = null

    // 1. Check for [CREATE_REQUEST:...] trigger
    const requestMatch = aiResponse.match(/\[CREATE_REQUEST:(\{.*?\})\]/)
    if (requestMatch) {
      try {
        const params = JSON.parse(requestMatch[1])
        const request = await createRequestInternal(user.id, params)
        toolResult = { success: true, request }
        aiResponse = aiResponse.replace(/\[CREATE_REQUEST:\{.*?\}\]/, '').trim()
        if (!aiResponse) aiResponse = `I've successfully created the request for you: "${request.title}".`
      } catch (err: any) {
        toolResult = { error: err.message }
        aiResponse = aiResponse.replace(/\[CREATE_REQUEST:\{.*?\}\]/, `(Error: ${err.message})`).trim()
      }
    }

    // 2. Check for [GET_REQUESTS] trigger
    if (aiResponse.includes('[GET_REQUESTS]')) {
      try {
        const { getRequestsInternal } = await import('@/lib/supabase/requests')
        const requests = await getRequestsInternal({ userId: user.id })
        toolResult = { success: true, type: 'list', data: requests }
        aiResponse = aiResponse.replace('[GET_REQUESTS]', '').trim()
        if (!aiResponse) aiResponse = "Here are the latest requests you have access to:"
      } catch (err: any) {
        aiResponse = aiResponse.replace('[GET_REQUESTS]', `(Error retrieving requests: ${err.message})`).trim()
      }
    }

    // 3. Check for [GET_STATS] trigger
    if (aiResponse.includes('[GET_STATS]')) {
      try {
        const { getStatsInternal } = await import('@/lib/supabase/requests')
        const stats = await getStatsInternal(user.id)
        toolResult = { success: true, type: 'stats', data: stats }
        aiResponse = aiResponse.replace('[GET_STATS]', '').trim()
        if (!aiResponse) aiResponse = "Here is the current dashboard summary:"
      } catch (err: any) {
        aiResponse = aiResponse.replace('[GET_STATS]', `(Error retrieving stats: ${err.message})`).trim()
      }
    }

    return NextResponse.json({ 
      content: aiResponse,
      toolResult 
    })

  } catch (error) {
    console.error('[chat] error:', error)
    const message = error instanceof Error ? error.message : 'AI processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
