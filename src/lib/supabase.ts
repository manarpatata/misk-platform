import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xdfkcqgwppvobzcfwprf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ukkzFVwXO-foLUoGtRH5eg_u0Un1ip6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

