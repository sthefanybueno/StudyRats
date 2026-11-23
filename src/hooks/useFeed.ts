/** Description: Hook de apresentação do Feed: guarda apenas estado de UI e delega ao caso de uso ListarFeedUseCase. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { DIContainer } from '@/application/di/container';
import type { ItemFeedDTO } from '@/application/dto/ItemFeedDTO';

export function useFeed() {
  const [itens, setItens] = useState<ItemFeedDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [proximoCursor, setProximoCursor] = useState<string | undefined>(undefined);
  const [pertoDeMim, setPertoDeMim] = useState(false);
  const pertoDeMimRef = useRef(false);
  const ocupado = useRef(false);

  const executarBusca = useCallback(async (cursor?: string, usarProximidade?: boolean) => {
    if (usarProximidade) {
      return DIContainer.listarFeed.execute(cursor, { pertoDeMim: true, raioMetros: 1000 });
    }
    return cursor !== undefined ? DIContainer.listarFeed.execute(cursor) : DIContainer.listarFeed.execute();
  }, []);

  /** Recarrega a primeira página (pull-to-refresh ou "tentar novamente"). */
  const recarregar = useCallback(
    async (origem: 'inicial' | 'refresh', forcarProximidade?: boolean) => {
      if (ocupado.current) return;
      ocupado.current = true;
      if (origem === 'refresh') setAtualizando(true);
      else setCarregando(true);
      setErro(null);

      const ativoProximidade = forcarProximidade ?? pertoDeMimRef.current;
      const r = await executarBusca(undefined, ativoProximidade);
      if (r.isSuccess) {
        setItens(r.value.itens);
        setProximoCursor(r.value.proximoCursor);
      } else {
        setErro(r.error);
      }

      setCarregando(false);
      setAtualizando(false);
      ocupado.current = false;
    },
    [executarBusca]
  );

  const carregarMais = useCallback(async () => {
    if (ocupado.current || !proximoCursor) return;
    ocupado.current = true;
    setCarregandoMais(true);

    const r = await executarBusca(proximoCursor, pertoDeMimRef.current);
    if (r.isSuccess) {
      setItens(atual => {
        const ids = new Set(atual.map(i => i.id));
        return [...atual, ...r.value.itens.filter(i => !ids.has(i.id))];
      });
      setProximoCursor(r.value.proximoCursor);
    } else {
      setErro(r.error);
    }

    setCarregandoMais(false);
    ocupado.current = false;
  }, [executarBusca, proximoCursor]);

  const alternarPertoDeMim = useCallback(async () => {
    const novoValor = !pertoDeMimRef.current;
    pertoDeMimRef.current = novoValor;
    setPertoDeMim(novoValor);
    ocupado.current = false;
    await recarregar('inicial', novoValor);
  }, [recarregar]);

  // Carga inicial: o estado "carregando" já começa true, então só atualizamos o estado após a resposta.
  useEffect(() => {
    let ativo = true;
    ocupado.current = true;

    (async () => {
      const r = await DIContainer.listarFeed.execute();
      if (!ativo) return;
      if (r.isSuccess) {
        setItens(r.value.itens);
        setProximoCursor(r.value.proximoCursor);
      } else {
        setErro(r.error);
      }
      setCarregando(false);
      ocupado.current = false;
    })();

    return () => {
      ativo = false;
      ocupado.current = false;
    };
  }, []);

  // Recarrega sempre que a tela ganha foco (ex: após registrar uma nova sessão)
  useFocusEffect(
    useCallback(() => {
      recarregar('inicial');
    }, [recarregar])
  );

  return {
    itens,
    carregando,
    atualizando,
    carregandoMais,
    erro,
    pertoDeMim,
    temMais: !!proximoCursor,
    atualizar: () => recarregar('refresh'),
    tentarNovamente: () => recarregar('inicial'),
    alternarPertoDeMim,
    carregarMais,
  };
}
