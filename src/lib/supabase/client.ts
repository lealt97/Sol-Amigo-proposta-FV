/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Remove /rest/v1 or /rest/v1/ if the user accidentally included it in their environment variable
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
