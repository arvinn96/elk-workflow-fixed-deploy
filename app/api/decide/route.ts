/**
 * F-02 FIX: This duplicate endpoint has been consolidated.
 * All approval decisions must now go through the canonical route:
 *   POST /api/requests/[id]/decision
 *
 * This stub returns a clear error so any old clients fail loudly
 * rather than silently using divergent logic.
 */
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:
        'This endpoint is deprecated. Use POST /api/requests/[id]/decision instead.',
    },
    { status: 410 }
  )
}