// ─── BRD Types ───────────────────────────────────────────────────────────────
export interface BRDDocument {
  title: string
  version: string
  status: string
  date: string
  prepared_by: string
  department: string
  priority: string
  sections: {
    executive_summary: string
    background: string
    problem_statement: string
    proposed_solution: {
      overview: string
      key_features: string[]
      scope_includes: string[]
      scope_excludes: string[]
    }
    business_impact: {
      overview: string
      kpis: Array<{ kpi: string; description: string; target: string; frequency: string; owner: string }>
    }
    timeline: {
      overview: string
      milestones: Array<{ phase: string; duration: string; deliverable: string }>
    }
    stakeholders: Array<{ role: string; responsibility: string }>
    functional_requirements: string[]
    risks: Array<{ risk: string; impact: string; mitigation: string }>
    success_criteria: string[]
  }
}

// ─── BRD HTML export generator ───────────────────────────────────────────────
export function generateBrdHtml(brd: BRDDocument, requestId: string, autoPrint = false): string {
  const docId = `BRD-${requestId.slice(0, 8).toUpperCase()}`
  const s = brd.sections

  const li = (items: string[]) =>
    items.map(i => `<li>${i}</li>`).join('')

  const kpiRows = s.business_impact.kpis.map(k =>
    `<tr><td><strong>${k.kpi}</strong></td><td>${k.description}</td><td>${k.target}</td><td>${k.frequency}</td><td>${k.owner}</td></tr>`
  ).join('')

  const milestoneRows = s.timeline.milestones.map(m =>
    `<tr><td><strong>${m.phase}</strong></td><td>${m.duration}</td><td>${m.deliverable}</td></tr>`
  ).join('')

  const stakeholderRows = s.stakeholders.map(st =>
    `<tr><td><strong>${st.role}</strong></td><td>${st.responsibility}</td></tr>`
  ).join('')

  const riskRows = s.risks.map(r =>
    `<tr><td>${r.risk}</td><td><span class="impact-${r.impact.toLowerCase()}">${r.impact}</span></td><td>${r.mitigation}</td></tr>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${brd.title} — BRD</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #1e293b; background: #fff; max-width: 820px; margin: 40px auto; padding: 0 48px 60px; }
  .doc-header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 28px; }
  .company { font-size: 8pt; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #4f46e5; margin-bottom: 10px; }
  .doc-title { font-size: 18pt; font-weight: 900; color: #0f172a; line-height: 1.2; margin-bottom: 16px; }
  .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 24px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  .meta-label { font-size: 7pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; }
  .meta-value { font-size: 9pt; font-weight: 700; color: #1e293b; margin-top: 3px; }
  .section { margin-bottom: 30px; }
  .section-header { display: flex; align-items: baseline; gap: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 7px; margin-bottom: 14px; }
  .section-num { font-size: 8pt; font-weight: 900; color: #4f46e5; }
  .section-title { font-size: 9pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; color: #0f172a; }
  p { font-size: 10pt; color: #334155; line-height: 1.7; margin-bottom: 10px; }
  ul { padding-left: 20px; margin-bottom: 10px; }
  li { font-size: 10pt; color: #334155; line-height: 1.7; margin-bottom: 5px; }
  li strong { color: #0f172a; }
  .sub-label { font-size: 7.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin: 14px 0 6px; }
  .scope-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; }
  .scope-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; }
  .scope-box-title { font-size: 7pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px; }
  .scope-box.includes .scope-box-title { color: #16a34a; }
  .scope-box.excludes .scope-box-title { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5pt; }
  th { background: #f1f5f9; padding: 9px 11px; text-align: left; font-size: 7pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; border: 1px solid #e2e8f0; }
  td { padding: 9px 11px; border: 1px solid #e2e8f0; color: #334155; vertical-align: top; line-height: 1.5; }
  tr:nth-child(even) td { background: #f8fafc; }
  .impact-high { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: 700; }
  .impact-medium { background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: 700; }
  .impact-low { background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: 700; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { body { margin: 0; padding: 20px 40px; } }
</style>
</head>
<body>
<div class="doc-header">
  <div class="company">ELK-DESA — Business Requirements Document</div>
  <div class="doc-title">${brd.title}</div>
  <div class="meta-grid">
    <div><div class="meta-label">Document ID</div><div class="meta-value">${docId}</div></div>
    <div><div class="meta-label">Version</div><div class="meta-value">${brd.version}</div></div>
    <div><div class="meta-label">Status</div><div class="meta-value">${brd.status}</div></div>
    <div><div class="meta-label">Date</div><div class="meta-value">${brd.date}</div></div>
    <div><div class="meta-label">Prepared By</div><div class="meta-value">${brd.prepared_by}</div></div>
    <div><div class="meta-label">Department</div><div class="meta-value">${brd.department}</div></div>
    <div><div class="meta-label">Priority</div><div class="meta-value">${brd.priority}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">1.</span><span class="section-title">Executive Summary</span></div>
  <p>${s.executive_summary}</p>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">2.</span><span class="section-title">Background &amp; Business Context</span></div>
  <p>${s.background}</p>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">3.</span><span class="section-title">Problem Statement</span></div>
  <p>${s.problem_statement}</p>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">4.</span><span class="section-title">Proposed Solution &amp; Scope</span></div>
  <p>${s.proposed_solution.overview}</p>
  <div class="sub-label">Key Features</div>
  <ul>${li(s.proposed_solution.key_features.map(f => {
    const [name, ...rest] = f.split(':')
    return rest.length ? `<strong>${name}:</strong> ${rest.join(':').trim()}` : f
  }))}</ul>
  <div class="scope-grid">
    <div class="scope-box includes">
      <div class="scope-box-title">Scope Includes</div>
      <ul>${li(s.proposed_solution.scope_includes)}</ul>
    </div>
    <div class="scope-box excludes">
      <div class="scope-box-title">Scope Excludes</div>
      <ul>${li(s.proposed_solution.scope_excludes)}</ul>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">5.</span><span class="section-title">Business Impact &amp; Measurement (KPIs)</span></div>
  <p>${s.business_impact.overview}</p>
  <table>
    <thead><tr><th>KPI</th><th>Description</th><th>Target</th><th>Frequency</th><th>Owner</th></tr></thead>
    <tbody>${kpiRows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">6.</span><span class="section-title">Implementation Timeline</span></div>
  <p>${s.timeline.overview}</p>
  <table>
    <thead><tr><th>Phase</th><th>Duration</th><th>Deliverable</th></tr></thead>
    <tbody>${milestoneRows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">7.</span><span class="section-title">Stakeholders &amp; Responsibilities</span></div>
  <table>
    <thead><tr><th>Role</th><th>Responsibility</th></tr></thead>
    <tbody>${stakeholderRows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">8.</span><span class="section-title">Functional Requirements</span></div>
  <ul>${li(s.functional_requirements)}</ul>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">9.</span><span class="section-title">Risks &amp; Mitigation Strategy</span></div>
  <table>
    <thead><tr><th>Risk</th><th>Impact</th><th>Mitigation</th></tr></thead>
    <tbody>${riskRows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-header"><span class="section-num">10.</span><span class="section-title">Success Criteria</span></div>
  <ul>${li(s.success_criteria)}</ul>
</div>

<div class="footer">
  <span>${docId} — Confidential — ELK-DESA</span>
  <span>Generated ${brd.date}</span>
</div>
<script>
  if (${autoPrint}) {
    window.onload = function() {
      setTimeout(function() { window.print() }, 600)
    }
  }
</script>
</body>
</html>`
}
