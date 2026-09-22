import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvevnwjjcprsykikaweb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZXZud2pqY3Byc3lraWthd2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTc2NDcsImV4cCI6MjEwNTY3MzY0N30.mOOcezseKuN6Ww-Rs29yIzvL9AJNoNATfbU7zEq2rU4';

export const supabase = createClient(supabaseUrl, supabaseKey);
