/** Description: Testes unitários do hook useLocation (watchPositionAsync e limpeza sub.remove() ao desmontar). */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useLocation } from '../useLocation';

const mockMonitorarPosicao = jest.fn();
const mockObterLocalizacaoAtual = jest.fn();

jest.mock('@/application/di/container', () => ({
  DIContainer: {
    diagnosticarLocalizacao: {
      monitorarPosicao: (...args: any[]) => mockMonitorarPosicao(...args),
      obterLocalizacaoAtual: (...args: any[]) => mockObterLocalizacaoAtual(...args),
    },
  },
}));

describe('useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve iniciar o monitoramento, atualizar coords e chamar sub.remove() ao desmontar (PDF 02, slides 15-16)', async () => {
    const mockRemove = jest.fn();
    let callbackCapturado: ((c: any) => void) | undefined;

    mockMonitorarPosicao.mockImplementation(async (cb: (c: any) => void) => {
      callbackCapturado = cb;
      return { remove: mockRemove };
    });

    const { result, unmount } = await renderHook(() => useLocation({ distanceInterval: 10 }));

    await waitFor(() => expect(mockMonitorarPosicao).toHaveBeenCalled());

    await act(async () => {
      callbackCapturado?.({ latitude: -21.5561, longitude: -45.4345, accuracy: 8 });
    });

    expect(result.current.coords).toEqual({ latitude: -21.5561, longitude: -45.4345, accuracy: 8 });
    expect(result.current.erro).toBe('');

    await unmount();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('deve expor mensagem de erro quando a permissão for negada', async () => {
    mockMonitorarPosicao.mockRejectedValue(new Error('Permissão negada'));

    const { result } = await renderHook(() => useLocation());

    await waitFor(() => expect(result.current.erro).toBe('Permissão negada'));
    expect(result.current.coords).toBeNull();
  });

  it('não deve iniciar monitoramento quando ativo = false', async () => {
    await renderHook(() => useLocation({ ativo: false }));
    expect(mockMonitorarPosicao).not.toHaveBeenCalled();
  });
});
