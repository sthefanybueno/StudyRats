/** Description: Tests for useNetworkSync hook. */
import { act, renderHook } from '@testing-library/react-native';
import * as Network from 'expo-network';
import { useNetworkSync } from '../useNetworkSync';

const mockSincronizarExecute = jest.fn();
jest.mock('../../application/di/container', () => ({
  DIContainer: {
    sincronizarFila: { execute: () => mockSincronizarExecute() },
  },
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

describe('useNetworkSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSincronizarExecute.mockResolvedValue({ isSuccess: true, itensProcessados: 0, falhas: 0 });
  });

  it('permite sincronização manual através do retorno do hook', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { result, unmount } = await renderHook(() => useNetworkSync());

    await act(async () => {
      await result.current.sincronizarManualmente();
    });

    expect(mockSincronizarExecute).toHaveBeenCalled();
    expect(result.current.ultimoSync).not.toBeNull();
    unmount();
  });

  it('detecta estado offline quando rede não estiver conectada', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { result, unmount } = await renderHook(() => useNetworkSync());

    await act(async () => {
      // aguarda tick
    });

    expect(result.current.isOnline).toBe(false);
    unmount();
  });
});
