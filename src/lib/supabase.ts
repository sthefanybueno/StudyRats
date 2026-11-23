import 'react-native-url-polyfill/auto';
import { AppState, type AppStateStatus } from 'react-native';
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

const isTestEnv = process.env.NODE_ENV === 'test';

if (!supabaseUrl || !supabaseAnonKey) {
  if (!isTestEnv) {
    console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL/ANON_KEY não configuradas (veja .env.example).');
  }
}

export const supabase: SupabaseClient = createClient(supabaseUrl || 'https://not-configured.supabase.co', supabaseAnonKey || 'not-configured', {
  auth: {
    storage: SecureStoreAuthStorage,
    autoRefreshToken: !isTestEnv,
    persistSession: !isTestEnv,
    detectSessionInUrl: false,
  },
});

// Renovação automática vinculada ao ciclo de vida do app (PDF 03, slide 15)
if (!isTestEnv && typeof AppState?.addEventListener === 'function') {
  AppState.addEventListener('change', (estado: AppStateStatus) => {
    if (estado === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export default supabase;
