/** Description: Hook reativo useLiveQuery inspirado no Drizzle/Expo-SQLite para re-executar consultas automaticamente quando tabelas mudam. */
import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { DIContainer } from '@/application/di/container';

export type TabelaLocal = 'disciplinas' | 'topicos' | 'sessoes_estudo' | 'fotos_sessao' | 'sync_queue';

export function useLiveQuery<T>(
  queryFn: () => Promise<T>,
  tables: TabelaLocal[],
  deps: DependencyList = [],
  initialData: T
) {
  const [data, setData] = useState<T>(initialData);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resultado = await queryFn();
      setData(resultado);
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void recarregar();
    const unsubscribe = DIContainer.inscreverMudancasTabela(tables, () => {
      void recarregar();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarregar, tables.join(',')]);

  return { data, carregando, recarregar };
}
