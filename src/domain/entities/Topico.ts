import { StatusSincronizacao, StatusSincronizacaoType } from '../value-objects/StatusSincronizacao';

export interface TopicoProps {
  id?: string;
  disciplinaId: string;
  nome: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  syncStatus?: StatusSincronizacao;
}

export class Topico {
  private constructor(private props: TopicoProps) {}

  public get id(): string { return this.props.id as string; }
  public get disciplinaId(): string { return this.props.disciplinaId; }
  public get nome(): string { return this.props.nome; }
  public get createdAt(): Date { return this.props.createdAt as Date; }
  public get updatedAt(): Date { return this.props.updatedAt as Date; }
  public get deletedAt(): Date | undefined { return this.props.deletedAt; }
  public get syncStatus(): StatusSincronizacao { return this.props.syncStatus as StatusSincronizacao; }

  public marcarComoDeletado(): void {
    this.props.deletedAt = new Date();
  }

  public atualizarSyncStatus(status: StatusSincronizacaoType): void {
    this.props.syncStatus = StatusSincronizacao.create(status);
  }

  public static create(props: Omit<TopicoProps, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> & Partial<TopicoProps>): Topico {
    if (!props.nome || props.nome.trim() === '') throw new Error('O nome do tópico não pode ser vazio');
    if (!props.disciplinaId || props.disciplinaId.trim() === '') throw new Error('O ID da disciplina é obrigatório');

    return new Topico({
      ...props,
      id: props.id ?? Math.random().toString(36).substring(2, 15),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      syncStatus: props.syncStatus ?? StatusSincronizacao.pending(),
    });
  }
}
