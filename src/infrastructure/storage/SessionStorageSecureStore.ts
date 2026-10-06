import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ISessionStorage } from '../../domain/gateways/ISessionStorage';

const SESSION_KEY = 'studyrats_session_token';

/**
 * Adaptador de Sessão Segura encapsulando o expo-secure-store (Keychain iOS / Keystore Android).
 */
export class SessionStorageSecureStore implements ISessionStorage {
  async obterSessionToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(SESSION_KEY);
      }
      return await SecureStore.getItemAsync(SESSION_KEY);
    } catch {
      return null;
    }
  }

  async salvarSessionToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(SESSION_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(SESSION_KEY, token);
  }

  async removerSessionToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(SESSION_KEY);
        return;
      }
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch {
      // noop
    }
  }
}
