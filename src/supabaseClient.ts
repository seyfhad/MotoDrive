import { createClient } from '@supabase/supabase-js';

// Read configuration from Vite environment variables (VITE_ prefix required for client-side access)
const supabaseUrl: string =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://uvevnwjjcprsykikaweb.supabase.co';

const supabaseAnonKey: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZXZud2pqY3Byc3lraWthd2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTc2NDcsImV4cCI6MjEwNTY3MzY0N30.mOOcezseKuN6Ww-Rs29yIzvL9AJNoNATfbU7zEq2rU4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

