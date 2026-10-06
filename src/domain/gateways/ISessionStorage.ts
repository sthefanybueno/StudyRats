export interface ISessionStorage {
  obterSessionToken(): Promise<string | null>;
  salvarSessionToken(token: string): Promise<void>;
  removerSessionToken(): Promise<void>;
}
