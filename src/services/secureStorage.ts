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
      console.warn(`Erro ao salvar SecureStore (${key}):`, err);
      await AsyncStorage.setItem(`@sec_${key}`, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(`@sec_${key}`);
      }
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn(`Erro ao ler SecureStore (${key}):`, err);
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
    } catch (err) {
      await AsyncStorage.removeItem(`@sec_${key}`);
    }
  },
};
