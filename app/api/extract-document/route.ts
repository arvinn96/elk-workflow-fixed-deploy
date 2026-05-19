import { NextResponse } from 'next/server'
import { extractFromDocument } from '@/lib/ai/openrouter'

const SUPPORTED = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx', 'doc'])

const MIME_MAP: Record<string, string> = {
  pdf:  'application/pdf',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
}

export async function POST(req: Request) {
  try {
    const { base64, fileName } = await req.json() as {
      base64?: string
      fileName?: string
    }

    if (!base64 || !fileName) {
      return NextResponse.json({ error: 'Document data is required.' }, { status: 400 })
    }

    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

    if (!SUPPORTED.has(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type ".${ext}". Please upload PDF, Word, PNG, JPG, or WebP.` },
        { status: 400 },
      )
    }

    const mimeType = MIME_MAP[ext]

    if (ext === 'docx' || ext === 'doc') {
      // Extract raw text from Word document using mammoth
      const mammoth = await import('mammoth')
      const buffer = Buffer.from(
        base64.includes(',') ? base64.split(',')[1] : base64,
        'base64',
      )
      const { value: text } = await mammoth.extractRawText({ buffer })
      if (!text.trim()) {
        return NextResponse.json({ error: 'Could not extract text from the Word document.' }, { status: 422 })
      }
      // Pass the raw text directly — no base64 encoding needed for text content
      const result = await extractFromDocument(text, mimeType, true)
      return NextResponse.json({ success: true, extraction: result })
    }

    // PDF or image — send base64 directly to Gemini
    const result = await extractFromDocument(base64, mimeType, false)
    return NextResponse.json({ success: true, extraction: result })

  } catch (error) {
    console.error('[extract-document]', error)
    const message = error instanceof Error ? error.message : 'Failed to extract data from document.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
