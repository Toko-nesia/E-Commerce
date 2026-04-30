import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth', request.url))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth', request.url))
  }

  // Redirect admin to /admin, regular users to /
  const role = data.user?.app_metadata?.role
  const redirectTo = role === 'admin' ? '/admin' : '/'
  return NextResponse.redirect(new URL(redirectTo, request.url))
}
