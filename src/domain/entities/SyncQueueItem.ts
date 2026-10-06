export interface SyncQueueItemProps {
  id?: string;
  entidade: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  payloadJson: string;
  tentativas?: number;
  erroMsg?: string;
  status?: 'pending' | 'error';
  createdAt?: Date;
}

export class SyncQueueItem {
  private constructor(private props: SyncQueueItemProps) {}

  public get id(): string { return this.props.id as string; }
  public get entidade(): string { return this.props.entidade; }
  public get operacao(): 'INSERT' | 'UPDATE' | 'DELETE' { return this.props.operacao; }
  public get payloadJson(): string { return this.props.payloadJson; }
  public get tentativas(): number { return this.props.tentativas || 0; }
  public get erroMsg(): string | undefined { return this.props.erroMsg; }
  public get status(): string { return this.props.status || 'pending'; }
  public get createdAt(): Date { return this.props.createdAt as Date; }

  public registrarFalha(mensagem: string): void {
    this.props.tentativas = this.tentativas + 1;
    this.props.erroMsg = mensagem;
    this.props.status = 'error';
  }

  public static create(props: Omit<SyncQueueItemProps, 'id' | 'createdAt' | 'tentativas' | 'status'> & Partial<SyncQueueItemProps>): SyncQueueItem {
    if (!props.entidade || props.entidade.trim() === '') throw new Error('Entidade é obrigatória');
    if (!props.payloadJson || props.payloadJson.trim() === '') throw new Error('Payload é obrigatório');

    return new SyncQueueItem({
      ...props,
      id: props.id ?? Math.random().toString(36).substring(2, 15),
      createdAt: props.createdAt ?? new Date(),
      status: props.status ?? 'pending',
      tentativas: props.tentativas ?? 0,
    });
  }
}
