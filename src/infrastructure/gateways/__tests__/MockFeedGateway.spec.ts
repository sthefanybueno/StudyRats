/** Description: Testes do MockFeedGateway (contrato de IFeedGateway). */
import { MockFeedGateway } from '../MockFeedGateway';

describe('MockFeedGateway', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const obter = async (g: MockFeedGateway, cursor?: string, limite?: number) => {
    const p = g.obterFeed(cursor, limite);
    await jest.advanceTimersByTimeAsync(500);
    return p;
  };

  it('pagina por cursor até acabar', async () => {
    const g = new MockFeedGateway(120);

    const p1 = await obter(g, undefined, 50);
    const p2 = await obter(g, p1.proximoCursor, 50);
    const p3 = await obter(g, p2.proximoCursor, 50);

    expect(p1.itens).toHaveLength(50);
    expect(p1.proximoCursor).toBe('50');
    expect(p2.itens).toHaveLength(50);
    expect(p2.proximoCursor).toBe('100');
    expect(p3.itens).toHaveLength(20);
    expect(p3.proximoCursor).toBeUndefined();
  });

  it('entrega da mais recente para a mais antiga, sem repetir ids entre páginas', async () => {
    const g = new MockFeedGateway(120);

    const p1 = await obter(g, undefined, 50);
    const p2 = await obter(g, p1.proximoCursor, 50);
    const todos = [...p1.itens, ...p2.itens];

    const datas = todos.map(i => i.sessao.createdAt.getTime());
    expect(datas).toEqual([...datas].sort((a, b) => b - a));
    expect(new Set(todos.map(i => i.sessao.id)).size).toBe(todos.length);
  });
});

