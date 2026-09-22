import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * `null` means Folio is intentionally in local-workspace mode. This lets us
 * prepare and test the interface before a Supabase project or credentials exist.
 */
export const supabase: SupabaseClient | null = url && publishableKey
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { headers: { 'x-client-info': 'folio-web' } },
    })
  : null

export const supabaseIsConfigured = supabase !== null
