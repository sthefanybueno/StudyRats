/** Description: Adaptador de storage do Supabase Auth sobre expo-secure-store (Keychain/Keystore), com chunking para o limite de ~2KB por item. */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CHUNK_SIZE = 1800;

/** Migra sessões antigas (AsyncStorage) para o SecureStore no primeiro acesso, sem deslogar o usuário. */
async function migrarSessaoLegada(key: string): Promise<string | null> {
  const legado = await AsyncStorage.getItem(key);
  if (!legado) return null;
  await SecureStoreAuthStorage.setItem(key, legado);
  await AsyncStorage.removeItem(key);
  return legado;
}

export const SecureStoreAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    const count = await SecureStore.getItemAsync(`${key}.count`);
    if (!count) return migrarSessaoLegada(key);
    const parts: string[] = [];
    for (let i = 0; i < Number(count); i++) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    await SecureStoreAuthStorage.removeItem(key);
    const total = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
    for (let i = 0; i < total; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}.count`, String(total));
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    const count = Number((await SecureStore.getItemAsync(`${key}.count`)) ?? 0);
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
    await SecureStore.deleteItemAsync(`${key}.count`);
  },
};
