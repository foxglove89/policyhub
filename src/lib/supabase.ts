import { createClient } from '@supabase/supabase-js'

// These will be replaced with actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key-for-demo-mode'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
