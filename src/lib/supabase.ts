import 'react-native-url-polyfill/auto';
import { SecureStoreAuthStorage } from '../infrastructure/storage/SecureStoreAuthStorage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  '';

const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL/ANON_KEY não configuradas (veja .env.example).');
}

export const supabase: SupabaseClient = createClient(supabaseUrl || 'https://not-configured.supabase.co', supabaseAnonKey || 'not-configured', {
  auth: {
    storage: SecureStoreAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
