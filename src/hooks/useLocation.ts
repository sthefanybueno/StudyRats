/** Description: Hook useLocation (PDF 02, slides 15-16): monitora coordenadas via watchPositionAsync com limpeza segura (sub.remove()). */
import { useEffect, useState } from 'react';
import { DIContainer } from '@/application/di/container';
import type { Coordenadas, SubscricaoLocalizacao } from '@/domain/gateways/ILocationGateway';

export interface UseLocationOptions {
  /** Quando falso, pausa o monitoramento para economizar bateria. Padrão: true. */
  ativo?: boolean;
  /** Distância mínima em metros para notificar nova posição (padrão: 10m - PDF 02, slides 14-16). */
  distanceInterval?: number;
  /** Intervalo mínimo em ms no Android (padrão: 5000ms - PDF 02, slide 14). */
  timeInterval?: number;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { ativo = true, distanceInterval = 10, timeInterval = 5000 } = options;
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [erro, setErro] = useState<string>('');
  const [monitorando, setMonitorando] = useState<boolean>(false);

  useEffect(() => {
    if (!ativo) {
      setMonitorando(false);
      return;
    }

    let desmontado = false;
    let sub: SubscricaoLocalizacao | undefined;

    (async () => {
      try {
        setErro('');
        setMonitorando(true);
        const gateway = DIContainer.diagnosticarLocalizacao;

        if (gateway?.monitorarPosicao) {
          const novaSub = await gateway.monitorarPosicao(
            (novasCoords) => {
              if (!desmontado) {
                setCoords(novasCoords);
              }
            },
            { distanceInterval, timeInterval }
          );

          if (desmontado) {
            novaSub?.remove();
            return;
          }
          sub = novaSub ?? undefined;
        } else {
          const inicial = await DIContainer.diagnosticarLocalizacao.obterLocalizacaoAtual();
          if (!desmontado) {
            setCoords(inicial);
          }
        }
      } catch (e: any) {
        if (!desmontado) {
          setErro(e?.message || 'Permissão negada');
          setMonitorando(false);
        }
      }
    })();

    return () => {
      desmontado = true;
      sub?.remove();
    };
  }, [ativo, distanceInterval, timeInterval]);

  return { coords, erro, monitorando };
}

