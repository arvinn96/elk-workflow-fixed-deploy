import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, AI_RATE_LIMIT } from '@/lib/rate-limit'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function buildPrompt(data: Record<string, unknown>): string {
  return `You are a senior business analyst at ELK-DESA enterprise. Generate a comprehensive, professional Business Requirements Document (BRD) from the following approved request data.

REQUEST DATA:
- Title: ${data.title ?? 'Untitled'}
- Sponsored By: ${data.sponsored_by ?? 'Not specified'}
- Department: ${data.department ?? 'General Operations'}
- Priority Level: ${data.priority_level ?? 'medium'}
- Problem Statement: ${data.problem_statement ?? 'Not provided'}
- Proposed Change / Solution: ${data.proposed_change ?? 'Not provided'}
- Expected Impact: ${data.expected_impact ?? 'Not specified'}
- Measurement / KPI: ${data.measurement ?? 'Not specified'}
- Key Teams Required: ${data.key_teams ?? 'Not specified'}
- Cross-Department Impact: ${data.cross_dept_impact ?? 'Not specified'}
- Dependencies: ${data.dependencies ?? 'Not specified'}
- Desired Timeline: ${data.desired_timeline ?? 'Not specified'}
- Submitted By: ${data.submitted_by_name ?? 'Unknown'}
- Submission Date: ${data.created_at ? new Date(data.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown'}

Produce a realistic, detailed BRD. Expand on the provided information professionally. Respond ONLY with valid JSON matching this exact structure — no markdown, no explanation:

{
  "title": "full initiative title",
  "version": "1.0",
  "status": "Draft",
  "date": "current date as DD Month YYYY",
  "prepared_by": "value from sponsored_by field",
  "department": "department value",
  "priority": "priority level capitalized",
  "sections": {
    "executive_summary": "2-3 professional sentences summarising the initiative, its purpose, and expected outcome",
    "background": "2-3 sentences of business context explaining why this initiative is needed now",
    "problem_statement": "detailed description of the current problem and its business impact",
    "proposed_solution": {
      "overview": "1-2 sentences describing the solution approach",
      "key_features": [
        "Feature Name: description of feature 1",
        "Feature Name: description of feature 2",
        "Feature Name: description of feature 3",
        "Feature Name: description of feature 4",
        "Feature Name: description of feature 5"
      ],
      "scope_includes": [
        "Scope item 1",
        "Scope item 2",
        "Scope item 3",
        "Scope item 4",
        "Scope item 5"
      ],
      "scope_excludes": [
        "Exclusion item 1",
        "Exclusion item 2",
        "Exclusion item 3"
      ]
    },
    "business_impact": {
      "overview": "1-2 sentences on expected positive business impact",
      "kpis": [
        { "kpi": "KPI Name 1", "description": "What this measures", "target": "Measurable target value", "frequency": "Weekly", "owner": "Team or Person" },
        { "kpi": "KPI Name 2", "description": "What this measures", "target": "Measurable target value", "frequency": "Monthly", "owner": "Team or Person" },
        { "kpi": "KPI Name 3", "description": "What this measures", "target": "Measurable target value", "frequency": "Quarterly", "owner": "Team or Person" }
      ]
    },
    "timeline": {
      "overview": "1 sentence summarising the overall timeline",
      "milestones": [
        { "phase": "Phase 1: Requirements & Design", "duration": "2 weeks", "deliverable": "Approved requirements document and system design" },
        { "phase": "Phase 2: Development", "duration": "4 weeks", "deliverable": "Working implementation with unit tests" },
        { "phase": "Phase 3: Testing & UAT", "duration": "2 weeks", "deliverable": "Test results and UAT sign-off" },
        { "phase": "Phase 4: Deployment", "duration": "1 week", "deliverable": "Production deployment and handover documentation" }
      ]
    },
    "stakeholders": [
      { "role": "Project Sponsor", "responsibility": "Provides strategic direction, secures budget, and approves key deliverables" },
      { "role": "Business Analyst", "responsibility": "Gathers requirements, documents processes, and ensures alignment with business goals" },
      { "role": "IT / Development Lead", "responsibility": "Oversees technical design, development, and system integration" },
      { "role": "End Users / Operations Team", "responsibility": "Participates in UAT, provides feedback, and adopts the new system" },
      { "role": "QA / Testing Team", "responsibility": "Validates functional and non-functional requirements during testing phase" }
    ],
    "functional_requirements": [
      "Functional requirement statement 1",
      "Functional requirement statement 2",
      "Functional requirement statement 3",
      "Functional requirement statement 4",
      "Functional requirement statement 5",
      "Functional requirement statement 6"
    ],
    "risks": [
      { "risk": "Risk description 1", "impact": "High", "mitigation": "Mitigation strategy for risk 1" },
      { "risk": "Risk description 2", "impact": "Medium", "mitigation": "Mitigation strategy for risk 2" },
      { "risk": "Risk description 3", "impact": "Low", "mitigation": "Mitigation strategy for risk 3" }
    ],
    "success_criteria": [
      "Success criterion 1",
      "Success criterion 2",
      "Success criterion 3",
      "Success criterion 4"
    ]
  }
}`
}

// F-05 FIX: Whitelist and sanitise all fields before prompt interpolation
const ALLOWED_FIELDS = [
  'title', 'sponsored_by', 'department', 'priority_level',
  'problem_statement', 'proposed_change', 'expected_impact',
  'measurement', 'key_teams', 'cross_dept_impact', 'dependencies',
  'desired_timeline', 'submitted_by_name', 'created_at',
] as const

function sanitiseField(value: unknown): string {
  if (value === null || value === undefined) return ''
  // Strip characters that could break prompt structure
  return String(value).replace(/[\[\]`]/g, '').slice(0, 2000)
}

function validateAndSanitiseBody(raw: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    safe[key] = sanitiseField(raw[key])
  }
  return safe
}

export async function POST(req: NextRequest) {
  // F-08: Rate limit AI endpoint to 10 requests/minute per IP
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = checkRateLimit(`brd:${ip}`, AI_RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before generating another BRD.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const allowedRoles = ['hod', 'approval', 'admin', 'super_admin']
  if (!profile || !allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — insufficient role to generate BRD' }, { status: 403 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OpenRouter API key is not configured' }, { status: 500 })

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: buildPrompt(validateAndSanitiseBody(await req.json())) }]
      })
    })

    if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`)
    const json = await response.json()
    const content = json.choices[0].message.content
    // Ensure content parses as JSON
    const parsed = JSON.parse(content)
    return NextResponse.json({ brd: parsed })
  } catch (error: any) {
    console.error('BRD generation error:', error)
    return NextResponse.json({ error: 'Failed to generate BRD' }, { status: 500 })
  }
}