import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  // Next.js request.url behind a proxy (like Heroku) might return the internal network IP/Port.
  // To safely redirect, we extract the actual public host and protocol from the headers.
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth', baseUrl))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth', baseUrl))
  }

  // Redirect admin to /admin, regular users to /
  const role = data.user?.app_metadata?.role
  const redirectTo = role === 'admin' ? '/admin' : '/'
  return NextResponse.redirect(new URL(redirectTo, baseUrl))
}
