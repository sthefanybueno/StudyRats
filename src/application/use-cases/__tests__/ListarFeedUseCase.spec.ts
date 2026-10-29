/** Description: This file (src/application/use-cases/__tests__/ListarFeedUseCase.spec.ts) contains the implementation for its respective feature. */
import { ListarFeedUseCase, LIMITE_FEED } from '../ListarFeedUseCase';
import { IFeedGateway, PaginaFeed, SessaoComunidade } from '../../../domain/gateways/IFeedGateway';
import { SessaoEstudo } from '../../../domain/entities/SessaoEstudo';
import { Usuario } from '../../../domain/entities/Usuario';
import { FotoSessao } from '../../../domain/entities/FotoSessao';
import { Coordenada } from '../../../domain/value-objects/Coordenada';

function itemComunidade(
  id: string,
  createdAt: Date,
  extra: { foto?: boolean; coord?: boolean; duracao?: number } = {}
): SessaoComunidade {
  const sessao = SessaoEstudo.create({
    id,
    usuarioId: 'u-' + id,
    disciplinaId: 'd1',
    topicoId: 't1',
    duracaoMinutos: extra.duracao ?? 30,
    createdAt,
    coordenada: extra.coord ? Coordenada.create({ latitude: -19.9191, longitude: -43.9386 }) : undefined,
  });
  if (extra.foto) {
    sessao.anexarFoto(FotoSessao.create({ sessaoId: id, uriLocal: 'file://x.jpg', urlRemota: 'https://img/' + id + '.jpg' }));
  }
  const autor = Usuario.create({ id: 'u-' + id, email: `${id}@t.com`, nomeExibicao: 'Autor ' + id, xpTotal: 250 });
  return { sessao, autor, disciplinaNome: 'Cálculo', topicoNome: 'Derivadas' };
}

class FakeFeedGateway implements IFeedGateway {
  public chamadas: { cursor?: string; limite?: number }[] = [];
  constructor(private pagina: PaginaFeed | Error) {}
  async obterFeed(cursor?: string, limite?: number): Promise<PaginaFeed> {
    this.chamadas.push({ cursor, limite });
    if (this.pagina instanceof Error) throw this.pagina;
    return this.pagina;
  }
}

describe('ListarFeedUseCase', () => {
  it('limita a página a 50 sessões e pede 50 ao gateway', async () => {
    expect(LIMITE_FEED).toBe(50);
    const itens = Array.from({ length: 60 }, (_, i) => itemComunidade('s' + i, new Date(2026, 0, 1, 0, i)));
    const gateway = new FakeFeedGateway({ itens, proximoCursor: '60' });

    const r = await new ListarFeedUseCase(gateway).execute();

    expect(gateway.chamadas[0].limite).toBe(50);
    expect(r.isSuccess).toBe(true);
    if (r.isSuccess) expect(r.value.itens).toHaveLength(50);
  });

  it('ordena da mais recente para a mais antiga', async () => {
    const gateway = new FakeFeedGateway({
      itens: [
        itemComunidade('antiga', new Date('2026-01-01T10:00:00Z')),
        itemComunidade('nova', new Date('2026-01-03T10:00:00Z')),
        itemComunidade('meio', new Date('2026-01-02T10:00:00Z')),
      ],
    });

    const r = await new ListarFeedUseCase(gateway).execute();

    expect(r.isSuccess).toBe(true);
    if (r.isSuccess) expect(r.value.itens.map(i => i.id)).toEqual(['nova', 'meio', 'antiga']);
  });

  it('repassa o cursor ao gateway e devolve o próximo cursor', async () => {
    const gateway = new FakeFeedGateway({ itens: [itemComunidade('a', new Date())], proximoCursor: '50' });

    const r = await new ListarFeedUseCase(gateway).execute('50');

    expect(gateway.chamadas[0].cursor).toBe('50');
    expect(r.isSuccess).toBe(true);
    if (r.isSuccess) expect(r.value.proximoCursor).toBe('50');
  });

  it('remove sessões duplicadas pelo id', async () => {
    const d = new Date();
    const gateway = new FakeFeedGateway({ itens: [itemComunidade('x', d), itemComunidade('x', d)] });

    const r = await new ListarFeedUseCase(gateway).execute();

    expect(r.isSuccess).toBe(true);
    if (r.isSuccess) expect(r.value.itens).toHaveLength(1);
  });

  it('mapeia entidades para o DTO de tela (autor, nível, xp, foto e coordenadas)', async () => {
    const gateway = new FakeFeedGateway({
      itens: [itemComunidade('s1', new Date('2026-02-01T12:00:00Z'), { foto: true, coord: true, duracao: 50 })],
    });

    const r = await new ListarFeedUseCase(gateway).execute();

    expect(r.isSuccess).toBe(true);
    if (!r.isSuccess) return;
    const item = r.value.itens[0];
    expect(item.autor).toEqual({ id: 'u-s1', nome: 'Autor s1', fotoUrl: undefined, nivel: 3 });
    expect(item.disciplina).toBe('Cálculo');
    expect(item.topico).toBe('Derivadas');
    expect(item.duracaoMinutos).toBe(50);
    // 50 min + 10 (foto) + 5 (gps) + 15 (foco estendido) = 80
    expect(item.xp).toBe(80);
    expect(item.fotoUri).toBe('https://img/s1.jpg');
    expect(item.latitude).toBeCloseTo(-19.9191);
    expect(item.longitude).toBeCloseTo(-43.9386);
  });

  it('sessão sem foto e sem coordenadas gera DTO válido sem esses campos', async () => {
    const gateway = new FakeFeedGateway({ itens: [itemComunidade('s2', new Date(), { duracao: 10 })] });

    const r = await new ListarFeedUseCase(gateway).execute();

    expect(r.isSuccess).toBe(true);
    if (!r.isSuccess) return;
    const item = r.value.itens[0];
    expect(item.fotoUri).toBeUndefined();
    expect(item.latitude).toBeUndefined();
    expect(item.longitude).toBeUndefined();
    expect(item.xp).toBe(10);
  });

  it('retorna falha (sem lançar exceção) quando o gateway erra', async () => {
    const gateway = new FakeFeedGateway(new Error('Sem conexão'));

    const r = await new ListarFeedUseCase(gateway).execute();

    expect(r).toEqual({ isSuccess: false, error: 'Sem conexão' });
  });
});

