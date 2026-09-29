import { StatusSincronizacao, StatusSincronizacaoType } from '../value-objects/StatusSincronizacao';

export interface ResumoIAProps {
  id?: string;
  topicoId: string;
  conteudo: string;
  geradoEm?: Date;
  syncStatus?: StatusSincronizacao;
}

export class ResumoIA {
  private constructor(private props: ResumoIAProps) {}

  public get id(): string { return this.props.id as string; }
  public get topicoId(): string { return this.props.topicoId; }
  public get conteudo(): string { return this.props.conteudo; }
  public get geradoEm(): Date { return this.props.geradoEm as Date; }
  public get syncStatus(): StatusSincronizacao { return this.props.syncStatus as StatusSincronizacao; }

  public atualizarSyncStatus(status: StatusSincronizacaoType): void {
    this.props.syncStatus = StatusSincronizacao.create(status);
  }

  public static create(props: Omit<ResumoIAProps, 'id' | 'geradoEm' | 'syncStatus'> & Partial<ResumoIAProps>): ResumoIA {
    if (!props.topicoId || props.topicoId.trim() === '') throw new Error('O ID do tópico é obrigatório para gerar um resumo');
    if (!props.conteudo || props.conteudo.trim() === '') throw new Error('O conteúdo do resumo não pode ser vazio');

    return new ResumoIA({
      ...props,
      id: props.id ?? Math.random().toString(36).substring(2, 15),
      geradoEm: props.geradoEm ?? new Date(),
      syncStatus: props.syncStatus ?? StatusSincronizacao.pending(),
    });
  }
}
