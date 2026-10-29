/** Description: Testes do hook useFeed (estado de UI sobre o caso de uso ListarFeedUseCase). */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { ItemFeedDTO } from '@/application/dto/ItemFeedDTO';
import { useFeed } from '../useFeed';

const mockExecute = jest.fn();
jest.mock('@/application/di/container', () => ({
  DIContainer: { listarFeed: { execute: (...args: any[]) => mockExecute(...args) } },
}));

const item = (id: string): ItemFeedDTO => ({
  id,
  autor: { id: 'a', nome: 'Alice', nivel: 2 },
  disciplina: 'Cálculo',
  topico: 'Derivadas',
  duracaoMinutos: 30,
  xp: 30,
  createdAt: new Date(),
});

describe('useFeed', () => {
  beforeEach(() => mockExecute.mockReset());

  it('carrega a primeira página ao montar', async () => {
    mockExecute.mockResolvedValueOnce({ isSuccess: true, value: { itens: [item('1'), item('2')], proximoCursor: '50' } });

    const { result } = await renderHook(() => useFeed());

    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.itens.map(i => i.id)).toEqual(['1', '2']);
    expect(result.current.temMais).toBe(true);
  });

  it('carrega a próxima página com o cursor e evita duplicatas', async () => {
    mockExecute
      .mockResolvedValueOnce({ isSuccess: true, value: { itens: [item('1')], proximoCursor: '50' } })
      .mockResolvedValueOnce({ isSuccess: true, value: { itens: [item('1'), item('2')], proximoCursor: undefined } });

    const { result } = await renderHook(() => useFeed());
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.carregarMais();
    });

    expect(mockExecute).toHaveBeenLastCalledWith('50');
    expect(result.current.itens.map(i => i.id)).toEqual(['1', '2']);
    expect(result.current.temMais).toBe(false);
  });

  it('expõe o erro e permite tentar novamente', async () => {
    mockExecute
      .mockResolvedValueOnce({ isSuccess: false, error: 'Sem conexão' })
      .mockResolvedValueOnce({ isSuccess: true, value: { itens: [item('9')] } });

    const { result } = await renderHook(() => useFeed());
    await waitFor(() => expect(result.current.erro).toBe('Sem conexão'));

    await act(async () => {
      await result.current.tentarNovamente();
    });

    expect(result.current.erro).toBeNull();
    expect(result.current.itens.map(i => i.id)).toEqual(['9']);
  });
});

