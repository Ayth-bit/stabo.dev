import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not set')
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
})

// Server-side Supabase client with service role (for admin operations)
// Only create this on the server-side where environment variables are available
let supabaseAdmin: ReturnType<typeof createClient> | null = null

if (typeof window === 'undefined') {
  // Server-side only
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
}

export { supabaseAdmin }