import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Attention: Les variables d'environnement Supabase ne sont pas définies ! Le client ne fonctionnera pas.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
