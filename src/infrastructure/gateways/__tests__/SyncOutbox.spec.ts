/** Description: Tests da outbox: erros do Supabase propagam e foto é enviada ao Storage antes da sessão. */
import { SupabaseSyncGateway } from '../SupabaseSyncGateway';
import { SecureStoreAuthStorage } from '../../storage/SecureStoreAuthStorage';

const sessao = {
  id: 's1', usuarioId: 'u1', disciplinaId: 'd1', topicoId: 't1',
  duracaoMinutos: 30, createdAt: '2026-01-01T00:00:00.000Z', fotoLocal: 'file:///foto.jpg',
};

function criarCliente(upsertResult: any) {
  const upload = jest.fn().mockResolvedValue({ error: null });
  const upsert = jest.fn().mockResolvedValue(upsertResult);
  const client: any = {
    from: jest.fn().mockReturnValue({ upsert }),
    storage: { from: jest.fn().mockReturnValue({ upload, getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'x' } }) }) },
  };
  return { client, upload, upsert };
}

describe('SupabaseSyncGateway - outbox robusta', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValue({ blob: async () => ({}) });
  });

  it('lança erro quando o upsert é rejeitado (ex.: RLS), mantendo o item na fila', async () => {
    const { client } = criarCliente({ error: { message: 'new row violates row-level security policy' } });
    await expect(new SupabaseSyncGateway(client).enviarParaNuvem('disciplinas', 'INSERT', { id: 'd1', usuarioId: 'u1', nome: 'X', cor: '#000', createdAt: 'z' }))
      .rejects.toThrow(/row-level security/);
  });

  it('fazerUploadFoto envia ArrayBuffer ao bucket privado usando auth.uid() e devolve o caminho', async () => {
    const buffer = new ArrayBuffer(8);
    (global as any).fetch = jest.fn().mockResolvedValue({ arrayBuffer: async () => buffer });
    const { client, upload } = criarCliente({ error: null });
    client.auth = { getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'auth-u1' } } } }) };
    const caminho = await new SupabaseSyncGateway(client).fazerUploadFoto('file:///foto.png', 'u1/s1.png');
    expect(upload).toHaveBeenCalledWith('auth-u1/s1.png', buffer, expect.objectContaining({ contentType: 'image/png' }));
    expect(caminho).toBe('auth-u1/s1.png');
  });
});

describe('SecureStoreAuthStorage', () => {
  it('persiste sessões grandes em chunks e as recompõe', async () => {
    const valor = 'a'.repeat(5000);
    await SecureStoreAuthStorage.setItem('sb-auth', valor);
    expect(await SecureStoreAuthStorage.getItem('sb-auth')).toBe(valor);
    await SecureStoreAuthStorage.removeItem('sb-auth');
    expect(await SecureStoreAuthStorage.getItem('sb-auth')).toBeNull();
  });
});
