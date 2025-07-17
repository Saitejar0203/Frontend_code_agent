import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types for our database
export interface User {
  id: string
  email: string
  name: string
  google_id: string
  created_at: string
  updated_at: string
}

export interface UserThreadMapping {
  user_id: string
  basic_perplexity_thread_id: string | null
  multiagent_thread_id: string | null
  created_at: string
  updated_at: string
}