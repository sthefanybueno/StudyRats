/** Description: Hook to monitor network status and trigger automatic background sync for the outbox queue. */
import { useEffect, useState, useCallback, useRef } from 'react';
import * as Network from 'expo-network';
import { DIContainer } from '../application/di/container';

export function useNetworkSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [ultimoSync, setUltimoSync] = useState<Date | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  const sincronizar = useCallback(async () => {
    if (isSyncingRef.current) return;
    try {
      isSyncingRef.current = true;
      setIsSyncing(true);
      await DIContainer.sincronizarFila.execute();
      setUltimoSync(new Date());
    } catch (e) {
      console.warn('[useNetworkSync] Falha na sincronização:', e);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    let montado = true;

    async function checarRedeESincronizar() {
      try {
        const state = await Network.getNetworkStateAsync();
        const online = Boolean(state.isConnected && (state.isInternetReachable ?? true));
        if (montado) {
          setIsOnline(online);
          if (online) {
            await sincronizar();
          }
        }
      } catch {
        if (montado) setIsOnline(false);
      }
    }

    checarRedeESincronizar();
    const intervalo = setInterval(checarRedeESincronizar, 15000);

    return () => {
      montado = false;
      clearInterval(intervalo);
    };
  }, [sincronizar]);

  return {
    isOnline,
    isSyncing,
    ultimoSync,
    sincronizarManualmente: sincronizar,
  };
}
