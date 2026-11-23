/** Description: Testes unitários do SupabaseFeedGateway (feed paginado e consulta espacial PostGIS buscar_sessoes_proximas). */
import { SupabaseFeedGateway } from '../SupabaseFeedGateway';

describe('SupabaseFeedGateway', () => {
  it('deve consultar sessoes_estudo ordenadas por created_at desc e mapear autor, disciplina, tópico e Coordenada', async () => {
    const sessoesChain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [
          {
            id: 's-remota-1',
            usuario_id: 'u-1',
            disciplina_id: 'd-1',
            topico_id: 't-1',
            duracao_minutos: 50,
            latitude: -21.5561,
            longitude: -45.4345,
            accuracy: 12,
            local_aproximado: 'Centro, Varginha',
            created_at: '2026-11-23T12:00:00.000Z',
          },
        ],
        error: null,
      }),
    };

    const lookupChain = (data: any[]) => ({
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data, error: null }),
    });

    const mockClient: any = {
      from: jest.fn((tabela: string) => {
        if (tabela === 'sessoes_estudo') return sessoesChain;
        if (tabela === 'perfis') return lookupChain([{ id: 'u-1', email: 'ana@test.com', nome_exibicao: 'Ana', xp_total: 250 }]);
        if (tabela === 'disciplinas') return lookupChain([{ id: 'd-1', nome: 'Mobile' }]);
        if (tabela === 'topicos') return lookupChain([{ id: 't-1', nome: 'PostGIS' }]);
        return lookupChain([]);
      }),
    };

    const gateway = new SupabaseFeedGateway(mockClient);
    const pagina = await gateway.obterFeed(undefined, 50);

    expect(sessoesChain.range).toHaveBeenCalledWith(0, 49);
    expect(pagina.proximoCursor).toBeUndefined();
    expect(pagina.itens).toHaveLength(1);
    expect(pagina.itens[0].autor.nomeExibicao).toBe('Ana');
    expect(pagina.itens[0].disciplinaNome).toBe('Mobile');
    expect(pagina.itens[0].topicoNome).toBe('PostGIS');
    expect(pagina.itens[0].sessao.coordenada?.localAproximado).toBe('Centro, Varginha');
    expect(pagina.itens[0].sessao.syncStatus.value).toBe('synced');
  });

  it('deve consultar a RPC PostGIS buscar_sessoes_proximas em obterFeedProximo com (p_longitude, p_latitude, p_raio_metros)', async () => {
    const rpcChain = {
      limit: jest.fn().mockResolvedValue({
        data: [
          {
            id: 's-perto',
            usuario_id: 'u-2',
            disciplina_id: 'd-2',
            topico_id: 't-2',
            duracao_minutos: 35,
            latitude: -21.558,
            longitude: -45.4345,
            local_aproximado: 'Centro, Varginha',
            created_at: '2026-11-23T14:00:00.000Z',
          },
        ],
        error: null,
      }),
    };

    const lookupChain = (data: any[]) => ({
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data, error: null }),
    });

    const mockClient: any = {
      rpc: jest.fn().mockReturnValue(rpcChain),
      from: jest.fn((tabela: string) => {
        if (tabela === 'perfis') return lookupChain([{ id: 'u-2', email: 'bia@test.com', nome_exibicao: 'Bia', xp_total: 100 }]);
        if (tabela === 'disciplinas') return lookupChain([{ id: 'd-2', nome: 'BD' }]);
        if (tabela === 'topicos') return lookupChain([{ id: 't-2', nome: 'PostGIS' }]);
        return lookupChain([]);
      }),
    };

    const gateway = new SupabaseFeedGateway(mockClient);
    const pagina = await gateway.obterFeedProximo(-21.5561, -45.4345, 1000, 20);

    expect(mockClient.rpc).toHaveBeenCalledWith('buscar_sessoes_proximas', {
      p_longitude: -45.4345,
      p_latitude: -21.5561,
      p_raio_metros: 1000,
    });
    expect(rpcChain.limit).toHaveBeenCalledWith(20);
    expect(pagina.itens).toHaveLength(1);
    expect(pagina.itens[0].sessao.id).toBe('s-perto');
  });
});

