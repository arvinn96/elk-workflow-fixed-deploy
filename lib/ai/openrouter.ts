/**
 * OpenRouter AI Utility — Gemini Flash (free tier)
 * Uses OpenRouter's OpenAI-compatible API to extract form fields
 * from PDFs, images, and Word documents.
 */

export interface ExtractionResult {
  title?: string
  sponsored_by?: string
  problem_statement?: string
  proposed_change?: string
  priority_level?: 'critical' | 'high' | 'medium' | 'low'
  expected_impact?: string
  measurement_kpi?: string
  measurement_unit?: string
  effort_estimate?: string
  key_teams?: string
  cross_dept_impact?: string
  dependencies?: string
  desired_timeline?: string
}

const EXTRACTION_PROMPT = `
You are an expert business analyst for ELK-DESA, an enterprise approval system.
Extract specific information from the provided document to fill out a "Phase 2 Request Form".

Extract the following fields:
1. title: A clear, descriptive title for the initiative.
2. sponsored_by: Who is the HOD or sponsoring department? (Format: "Name, Department")
3. problem_statement: What is broken? Who is impacted? Why is this urgent?
4. proposed_change: Briefly describe the solution and what will be different (2-3 lines).
5. priority_level: One of "critical", "high", "medium", or "low".
6. expected_impact: One of [Cost Saving, Revenue Improvement, Time].
7. measurement_kpi: One of [Financial KPI, Performance KPI].
8. measurement_unit: The specific amount or unit (e.g., RM 50,000).
9. key_teams: List required departments.
10. cross_dept_impact: Who else is affected and what changes for them?
11. dependencies: Systems, data, approvals, vendors, or materials needed.
12. desired_timeline: Target date range in format "15 Aug 2025 - 22 Aug 2025".

IMPORTANT:
- Respond ONLY with a valid JSON object using these exact keys.
- If a field is not found, use an empty string "".
- Be professional and concise.

Respond with JSON only — no markdown, no explanation:
{
  "title": "",
  "sponsored_by": "",
  "problem_statement": "",
  "proposed_change": "",
  "priority_level": "medium",
  "expected_impact": "Cost Saving",
  "measurement_kpi": "Financial KPI",
  "measurement_unit": "",
  "effort_estimate": "",
  "key_teams": "",
  "cross_dept_impact": "",
  "dependencies": "",
  "desired_timeline": ""
}
`

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
// Automatic model selection - OpenRouter will pick the best available (free/cheap)
const MODEL = 'openrouter/auto'

export async function extractFromDocument(
  base64File: string,
  mimeType: string,
  isTextContent = false,
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured.')
  }

  // Build the message content
  let content: unknown[]

  if (isTextContent) {
    // Word documents: base64File is already plain text - send directly
    content = [
      {
        type: 'text',
        text: `${EXTRACTION_PROMPT}\n\nDocument content:\n${base64File}`,
      },
    ]
  } else {
    // PDF or image: strip data URL prefix and send as base64 inline
    const base64Data = base64File.includes(',') ? base64File.split(',')[1] : base64File
    content = [
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      },
      {
        type: 'text',
        text: EXTRACTION_PROMPT,
      },
    ]
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.replace(/[^\x00-\x7F]/g, '-')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content }],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter error ${response.status}: ${err}`)
  }

  const json = await response.json()
  const text: string = json.choices?.[0]?.message?.content ?? ''

  if (!text) throw new Error('Empty response from AI model.')

  // Strip markdown code fences if model wrapped the JSON
  const clean = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI did not return valid JSON.')

  return JSON.parse(jsonMatch[0]) as ExtractionResult
}
