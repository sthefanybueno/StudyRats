import { SessionStorageSecureStore } from '../SessionStorageSecureStore';
import { InMemorySessionStorage } from '../InMemorySessionStorage';

describe('SessionStorage Adapters (SecureStore & InMemory)', () => {
  describe('SessionStorageSecureStore', () => {
    it('deve salvar, obter e remover token de sessão com segurança', async () => {
      const storage = new SessionStorageSecureStore();

      expect(await storage.obterSessionToken()).toBeNull();

      await storage.salvarSessionToken('token-secreto-123');
      expect(await storage.obterSessionToken()).toBe('token-secreto-123');

      await storage.removerSessionToken();
      expect(await storage.obterSessionToken()).toBeNull();
    });
  });

  describe('InMemorySessionStorage', () => {
    it('deve armazenar e remover token de sessão em memória', async () => {
      const storage = new InMemorySessionStorage();

      expect(await storage.obterSessionToken()).toBeNull();

      await storage.salvarSessionToken('token-in-memory');
      expect(await storage.obterSessionToken()).toBe('token-in-memory');

      await storage.removerSessionToken();
      expect(await storage.obterSessionToken()).toBeNull();
    });
  });
});
