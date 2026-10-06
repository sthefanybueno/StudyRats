import { ISessionStorage } from '../../domain/gateways/ISessionStorage';

export class InMemorySessionStorage implements ISessionStorage {
  private token: string | null = null;

  async obterSessionToken(): Promise<string | null> {
    return this.token;
  }

  async salvarSessionToken(token: string): Promise<void> {
    this.token = token;
  }

  async removerSessionToken(): Promise<void> {
    this.token = null;
  }
}
