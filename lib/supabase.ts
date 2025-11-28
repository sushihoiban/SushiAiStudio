import { createClient } from '@supabase/supabase-js';

// Note: In a real scenario, these would come from import.meta.env
// For the purpose of this generated code, we'll try to use them if available.

// Cast import.meta to any to avoid TypeScript errors with 'env' if types are missing
const env = (import.meta as any).env || {};

// Supabase client requires a non-empty URL and Key to initialize.
// We provide placeholder values if environment variables are missing to prevent the app from crashing immediately.
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://zdpzkmkqbdvybyzzzlwl.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkcHprbWtxYmR2eWJ5enp6bHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTYzNTAsImV4cCI6MjA3OTA5MjM1MH0.WyZb4aCSPTuVcQrGXIQMVL-KkQyVxAkfwB0hBpncrpY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return !!env.VITE_SUPABASE_URL && !!env.VITE_SUPABASE_PUBLISHABLE_KEY;
};