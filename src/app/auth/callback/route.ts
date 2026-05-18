import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { notifyWelcomeEmail } from '@/infrastructure/notifications/notify-welcome-email'

function safeRelativeRedirect(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  return value
}

function isFreshOAuthUser(createdAt: string | undefined): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt).getTime()
  if (!Number.isFinite(created)) return false
  return Date.now() - created < 10 * 60 * 1000
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRelativeRedirect(searchParams.get('next'))

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

  if (next === '/reset-password') {
    return NextResponse.redirect(new URL('/reset-password', baseUrl))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, created_at')
    .eq('id', data.user.id)
    .maybeSingle()

  const role = data.user?.app_metadata?.role
    || profile?.role
  if (role !== 'admin' && isFreshOAuthUser(profile?.created_at ?? data.user.created_at)) {
    await notifyWelcomeEmail({
      userId: data.user.id,
      email: profile?.email || data.user.email || '',
      name: profile?.full_name || data.user.user_metadata?.full_name || null,
    })
  }

  const redirectTo = role === 'admin' ? '/admin' : next || '/'
  return NextResponse.redirect(new URL(redirectTo, baseUrl))
}
