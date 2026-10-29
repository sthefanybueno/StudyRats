import { useEffect } from 'react';
import * as Network from 'expo-network';
import { syncPendingUploads } from '@/services/offlineFileService';

/**
 * Hook que verifica a conectividade e dispara a sincronização de uploads pendentes.
 * Deve ser usado em um nível alto da árvore (ex.: na raiz da aplicação ou dentro do Provider).
 */
export function useNetworkSync() {
  useEffect(() => {
    const checkAndSync = async () => {
      const net = await Network.getNetworkStateAsync();
      if (net.isConnected) {
        await syncPendingUploads();
      }
    };
    // Verifica imediatamente ao montar
    checkAndSync();
    // Também escuta mudanças de estado (expo-network não tem listener nativo, então usamos polling simples)
    const interval = setInterval(checkAndSync, 30_000); // a cada 30s
    return () => clearInterval(interval);
  }, []);
}
