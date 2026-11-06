import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Serviço de Armazenamento Criptografado (Hardware Keystore / Keychain)
 * Protege tokens de autenticação, senhas e chaves contra leitura indevida.
 */
export const SecureStorageService = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(`@sec_${key}`, value);
      } else {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      }
    } catch (err) {
      console.warn(`[SecureStorage] Erro ao gravar chave segura (${key}):`, err);
      // No ambiente web ou simulador com falha no keystore
      await AsyncStorage.setItem(`@sec_${key}`, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(`@sec_${key}`);
      }
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
      // Fallback para ler dados legados caso existam
      return await AsyncStorage.getItem(`@sec_${key}`);
    } catch (err) {
      console.warn(`[SecureStorage] Erro ao ler chave segura (${key}):`, err);
      return await AsyncStorage.getItem(`@sec_${key}`);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(`@sec_${key}`);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
      await AsyncStorage.removeItem(`@sec_${key}`);
    } catch (err) {
      console.warn(`[SecureStorage] Erro ao deletar chave segura (${key}):`, err);
      await AsyncStorage.removeItem(`@sec_${key}`);
    }
  },
};

/**
 * Adaptador compatível com o cliente do Supabase (@supabase/supabase-js)
 * para persistência segura de tokens JWT no Keystore/Keychain.
 */
export const SupabaseSecureStorageAdapter = {
  getItem: (key: string): Promise<string | null> => {
    return SecureStorageService.getItem(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    return SecureStorageService.setItem(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    return SecureStorageService.deleteItem(key);
  },
};
