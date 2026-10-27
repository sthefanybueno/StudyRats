/** Description: This file (src/domain/gateways/ISessionStorage.ts) contains the implementation for its respective feature. */
export interface ISessionStorage {
  obterSessionToken(): Promise<string | null>;
  salvarSessionToken(token: string): Promise<void>;
  removerSessionToken(): Promise<void>;
}
