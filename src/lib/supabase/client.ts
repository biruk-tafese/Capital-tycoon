import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(' URL or Anon Key is missing in environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);