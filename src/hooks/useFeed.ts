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
  const ocupado = useRef(false);

  /** Recarrega a primeira página (pull-to-refresh ou "tentar novamente"). */
  const recarregar = useCallback(async (origem: 'inicial' | 'refresh') => {
    if (ocupado.current) return;
    ocupado.current = true;
    if (origem === 'refresh') setAtualizando(true);
    else setCarregando(true);
    setErro(null);

    const r = await DIContainer.listarFeed.execute();
    if (r.isSuccess) {
      setItens(r.value.itens);
      setProximoCursor(r.value.proximoCursor);
    } else {
      setErro(r.error);
    }

    setCarregando(false);
    setAtualizando(false);
    ocupado.current = false;
  }, []);

  const carregarMais = useCallback(async () => {
    if (ocupado.current || !proximoCursor) return;
    ocupado.current = true;
    setCarregandoMais(true);

    const r = await DIContainer.listarFeed.execute(proximoCursor);
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
  }, [proximoCursor]);

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
    temMais: !!proximoCursor,
    atualizar: () => recarregar('refresh'),
    tentarNovamente: () => recarregar('inicial'),
    carregarMais,
  };
}
