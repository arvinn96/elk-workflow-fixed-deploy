import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!authError && authData.session) {
      // Check if user has a department set in their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('department')
        .eq('id', authData.session.user.id)
        .single()

      const targetPath = profile?.department ? next : '/onboarding'
      return NextResponse.redirect(`${origin}${targetPath}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
