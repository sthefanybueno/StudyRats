/** Description: Contrato de domínio para geolocalização, reverse geocoding e diagnóstico de permissões/serviços. */
export interface Coordenadas {
  latitude: number;
  longitude: number;
  /** Raio de confiança em metros (CEP). */
  accuracy?: number;
  /** Bairro/Cidade aproximados via reverse geocoding (sem rua/número para proteção LGPD). */
  localAproximado?: string;
}

export interface DiagnosticoLocalizacao {
  servicosAtivos: boolean;
  permissaoConcedida: boolean;
  canAskAgain: boolean;
}

export interface OpcoesMonitoramentoLocalizacao {
  /** Distância mínima em metros entre atualizações (padrão: 10m - PDF 02, slide 14). */
  distanceInterval?: number;
  /** Intervalo mínimo em ms no Android (padrão: 5000ms - PDF 02, slide 14). */
  timeInterval?: number;
}

export interface SubscricaoLocalizacao {
  remove(): void;
}

export interface ILocationGateway {
  /**
   * Solicita a localização atual do dispositivo em foreground, validando serviços ativos,
   * permissão, precisão (accuracy), detecção de mock location (Android) e reverse geocoding aproximado.
   * Lança erro descritivo caso não seja possível obter leitura confiável.
   */
  obterLocalizacaoAtual(): Promise<Coordenadas>;

  /**
   * Monitora mudanças de posição em foreground (watchPositionAsync) com limpeza via sub.remove() (PDF 02, slides 14-16).
   */
  monitorarPosicao?(
    callback: (coords: Coordenadas) => void,
    opcoes?: OpcoesMonitoramentoLocalizacao
  ): Promise<SubscricaoLocalizacao>;

  /**
   * Converte coordenadas em uma descrição aproximada (Bairro, Cidade) sem expor endereço exato.
   * Retorna undefined quando offline ou indisponível.
   */
  obterLocalAproximado?(latitude: number, longitude: number): Promise<string | undefined>;

  /**
   * Forward Geocoding (PDF 01, slide 33; PDF 02, slide 17): converte endereço/local em coordenadas (geocodeAsync).
   * Retorna null caso nenhum resultado seja encontrado.
   */
  obterCoordenadasPorEndereco?(endereco: string): Promise<Coordenadas | null>;

  /**
   * Verifica se o GPS do dispositivo está ativo e o estado da permissão (incluindo canAskAgain).
   */
  diagnosticarPermissao?(): Promise<DiagnosticoLocalizacao>;
}
