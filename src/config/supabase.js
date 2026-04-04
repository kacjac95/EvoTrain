import { createClient } from '@supabase/supabase-js';

// Pobieranie zmiennych środowiskowych zdefiniowanych w pliku .env (lub zdefiniowanych bezpośrednio)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uobayrzvtvebwjchuafe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_i0AwEIIUyNz-Jg8WwCKeOw_VPHBChsd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);