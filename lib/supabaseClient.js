import { createClient } from '@supabase/supabase-js';

// Lê as credenciais do arquivo .env.local (nunca coloque a chave direto no código)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
