import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from './env'
import type { Database } from '@/types/supabase'

export function createServiceClient() {
  return createClient<Database>(
    getSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
