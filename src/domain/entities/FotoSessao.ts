export interface FotoSessaoProps {
  id?: string;
  sessaoId: string;
  uriLocal: string;
  urlRemota?: string;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
}

export class FotoSessao {
  private constructor(private props: FotoSessaoProps) {}

  public get id(): string {
    return this.props.id as string;
  }

  public get sessaoId(): string {
    return this.props.sessaoId;
  }

  public get uriLocal(): string {
    return this.props.uriLocal;
  }

  public get urlRemota(): string | undefined {
    return this.props.urlRemota;
  }

  public get uploadStatus(): string {
    return this.props.uploadStatus || 'pending';
  }

  public marcarComoUploadConcluido(urlRemota: string): void {
    if (!urlRemota || urlRemota.trim() === '') {
      throw new Error('A URL remota é obrigatória para concluir o upload');
    }
    this.props.urlRemota = urlRemota;
    this.props.uploadStatus = 'completed';
  }

  public static create(props: Omit<FotoSessaoProps, 'id' | 'uploadStatus'> & Partial<FotoSessaoProps>): FotoSessao {
    if (!props.sessaoId || props.sessaoId.trim() === '') {
      throw new Error('O ID da sessão é obrigatório');
    }

    if (!props.uriLocal || props.uriLocal.trim() === '') {
      throw new Error('A URI local da foto é obrigatória');
    }

    return new FotoSessao({
      ...props,
      id: props.id ?? Math.random().toString(36).substring(2, 15),
      uploadStatus: props.uploadStatus ?? 'pending',
    });
  }
}
