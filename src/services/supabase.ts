import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configurações do Supabase (lê das variáveis de ambiente Expo ou usa fallback seguro para desenvolvimento)
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  'https://sua-igreja-metodista.supabase.co';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-anon-key-metodista-aliado';

export const isSupabaseConfigured = () => {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_URL !== undefined &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== undefined &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('sua-igreja-metodista')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
