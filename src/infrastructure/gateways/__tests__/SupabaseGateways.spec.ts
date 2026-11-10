/** Description: Tests for SupabaseAuthGateway and SupabaseSyncGateway with mocked SupabaseClient. */
import { SupabaseAuthGateway } from '../SupabaseAuthGateway';
import { SupabaseSyncGateway } from '../SupabaseSyncGateway';

describe('SupabaseAuthGateway', () => {
  let mockClient: any;
  let authGateway: SupabaseAuthGateway;

  beforeEach(() => {
    mockClient = {
      auth: {
        getUser: jest.fn(),
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { nome_exibicao: 'Maria Clara', xp_total: 100, xp_semanal: 50, streak_atual: 3 },
          error: null,
        }),
      }),
    };
    authGateway = new SupabaseAuthGateway(mockClient);
  });

  it('deve realizar login com sucesso e retornar Usuario de domínio', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'usr-1', email: 'maria@test.com' } },
      error: null,
    });

    const usuario = await authGateway.login('maria@test.com', 'senha123');

    expect(usuario.id).toBe('usr-1');
    expect(usuario.email.value).toBe('maria@test.com');
    expect(usuario.nomeExibicao).toBe('Maria Clara');
    expect(usuario.xpTotal).toBe(100);
  });

  it('deve lançar erro quando o login falhar', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Credenciais inválidas' },
    });

    await expect(authGateway.login('erro@test.com', '123')).rejects.toThrow('Credenciais inválidas');
  });

  it('deve cadastrar um novo usuário', async () => {
    mockClient.auth.signUp.mockResolvedValue({
      data: { user: { id: 'usr-novo', email: 'novo@test.com' } },
      error: null,
    });

    const usuario = await authGateway.cadastrar('novo@test.com', 'senha123', 'Novo Aluno');
    expect(usuario.id).toBe('usr-novo');
    expect(usuario.email.value).toBe('novo@test.com');
    expect(usuario.nomeExibicao).toBe('Novo Aluno');
    expect(usuario.xpTotal).toBe(0);
  });

  it('deve deslogar chamando auth.signOut', async () => {
    mockClient.auth.signOut.mockResolvedValue({ error: null });
    await authGateway.logout();
    expect(mockClient.auth.signOut).toHaveBeenCalled();
  });
});

describe('SupabaseSyncGateway', () => {
  let mockClient: any;
  let syncGateway: SupabaseSyncGateway;
  let mockFrom: any;

  beforeEach(() => {
    mockFrom = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [
          { id: 'u1', email: 'a@a.com', nome_exibicao: 'Aluno 1', xp_total: 500, xp_semanal: 200, streak_atual: 5 },
        ],
        error: null,
      }),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    mockClient = {
      from: jest.fn().mockReturnValue(mockFrom),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.supabase.co/foto.jpg' } }),
        }),
      },
    };

    syncGateway = new SupabaseSyncGateway(mockClient);
  });

  it('deve sincronizar INSERT de sessão no Supabase', async () => {
    await syncGateway.enviarParaNuvem('sessoes_estudo', 'INSERT', {
      id: 'sess-1',
      usuarioId: 'usr-1',
      disciplinaId: 'd1',
      topicoId: 't1',
      duracaoMinutos: 45,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(mockClient.from).toHaveBeenCalledWith('sessoes_estudo');
    expect(mockFrom.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'sess-1',
        usuario_id: 'usr-1',
        duracao_minutos: 45,
      })
    );
  });

  it('deve sincronizar INSERT de disciplina no Supabase', async () => {
    await syncGateway.enviarParaNuvem('disciplinas', 'INSERT', {
      id: 'd1',
      usuarioId: 'usr-1',
      nome: 'Física',
      cor: '#FF0000',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(mockClient.from).toHaveBeenCalledWith('disciplinas');
    expect(mockFrom.upsert).toHaveBeenCalled();
  });

  it('deve obter ranking semanal com limite de 50 estudantes', async () => {
    const ranking = await syncGateway.obterRanking();

    expect(mockClient.from).toHaveBeenCalledWith('perfis');
    expect(mockFrom.order).toHaveBeenCalledWith('xp_semanal', { ascending: false });
    expect(mockFrom.limit).toHaveBeenCalledWith(50);
    expect(ranking).toHaveLength(1);
    expect(ranking[0].nomeExibicao).toBe('Aluno 1');
    expect(ranking[0].xpSemanal).toBe(200);
  });
});
