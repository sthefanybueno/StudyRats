import { Topico } from './Topico';
import { StatusSincronizacao, StatusSincronizacaoType } from '../value-objects/StatusSincronizacao';

export interface DisciplinaProps {
  id?: string;
  usuarioId: string;
  nome: string;
  cor: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  syncStatus?: StatusSincronizacao;
}

export class Disciplina {
  private _topicos: Topico[] = [];

  private constructor(private props: DisciplinaProps) {}

  public get id(): string { return this.props.id as string; }
  public get usuarioId(): string { return this.props.usuarioId; }
  public get nome(): string { return this.props.nome; }
  public get cor(): string { return this.props.cor; }
  public get createdAt(): Date { return this.props.createdAt as Date; }
  public get updatedAt(): Date { return this.props.updatedAt as Date; }
  public get deletedAt(): Date | undefined { return this.props.deletedAt; }
  public get syncStatus(): StatusSincronizacao { return this.props.syncStatus as StatusSincronizacao; }
  
  public get topicos(): Topico[] {
    return [...this._topicos].filter(t => !t.deletedAt); // Hide softly deleted topicos
  }

  public adicionarTopico(topico: Topico): void {
    if (topico.disciplinaId !== this.id) {
      throw new Error('O tópico não pertence a esta disciplina');
    }
    this._topicos.push(topico);
  }

  public removerTopico(topicoId: string): void {
    const topico = this._topicos.find(t => t.id === topicoId);
    if (topico) {
      topico.marcarComoDeletado();
      this.props.updatedAt = new Date();
    }
  }

  public atualizarTopico(topicoId: string, novoNome: string): void {
    const topico = this._topicos.find(t => t.id === topicoId && !t.deletedAt);
    if (!topico) {
      throw new Error('Tópico não encontrado');
    }
    topico.atualizarNome(novoNome);
    this.props.updatedAt = new Date();
  }

  public marcarComoDeletada(): void {
    this.props.deletedAt = new Date();
    this._topicos.forEach(t => t.marcarComoDeletado());
  }

  public atualizarSyncStatus(status: StatusSincronizacaoType): void {
    this.props.syncStatus = StatusSincronizacao.create(status);
  }

  public static create(props: Omit<DisciplinaProps, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> & Partial<DisciplinaProps>): Disciplina {
    if (!props.usuarioId || props.usuarioId.trim() === '') throw new Error('O ID do usuário é obrigatório');
    if (!props.nome || props.nome.trim() === '') throw new Error('O nome da disciplina não pode ser vazio');

    return new Disciplina({
      ...props,
      id: props.id ?? Math.random().toString(36).substring(2, 15),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      syncStatus: props.syncStatus ?? StatusSincronizacao.pending(),
    });
  }
}
