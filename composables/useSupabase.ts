import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const useSupabase = (): SupabaseClient => {
  const config = useRuntimeConfig()
  return useState('supabase-client', () =>
    createClient(config.public.supabaseUrl, config.public.supabaseAnonKey),
  ).value
}
