import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials are missing. Please check your .env file or environment variables.');
} else {
    console.log('Supabase client initialized successfully.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
