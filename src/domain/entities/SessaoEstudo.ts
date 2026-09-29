import { StatusSincronizacao, StatusSincronizacaoType } from '../value-objects/StatusSincronizacao';
import { Coordenada } from '../value-objects/Coordenada';
import { FotoSessao } from './FotoSessao';

export interface SessaoEstudoProps {
  id?: string;
  usuarioId: string;
  disciplinaId: string;
  topicoId: string;
  duracaoMinutos: number;
  coordenada?: Coordenada;
  createdAt?: Date;
  syncStatus?: StatusSincronizacao;
}

export class SessaoEstudo {
  private _foto?: FotoSessao;

  private constructor(private props: SessaoEstudoProps) {}

  public get id(): string { return this.props.id as string; }
  public get usuarioId(): string { return this.props.usuarioId; }
  public get disciplinaId(): string { return this.props.disciplinaId; }
  public get topicoId(): string { return this.props.topicoId; }
  public get duracaoMinutos(): number { return this.props.duracaoMinutos; }
  public get createdAt(): Date { return this.props.createdAt as Date; }
  public get syncStatus(): StatusSincronizacao { return this.props.syncStatus as StatusSincronizacao; }
  public get coordenada(): Coordenada | undefined { return this.props.coordenada; }
  public get foto(): FotoSessao | undefined { return this._foto; }

  public anexarFoto(foto: FotoSessao): void {
    if (foto.sessaoId !== this.id) {
      throw new Error('A foto não pertence a esta sessão de estudo');
    }
    this._foto = foto;
  }
  
  public atualizarSyncStatus(status: StatusSincronizacaoType): void {
    this.props.syncStatus = StatusSincronizacao.create(status);
  }

  public static create(props: Omit<SessaoEstudoProps, 'id' | 'createdAt' | 'syncStatus'> & Partial<SessaoEstudoProps>): SessaoEstudo {
    if (!props.usuarioId || props.usuarioId.trim() === '') throw new Error('O ID do usuário é obrigatório');
    if (!props.disciplinaId || props.disciplinaId.trim() === '') throw new Error('O ID da disciplina é obrigatório');
    if (!props.topicoId || props.topicoId.trim() === '') throw new Error('O ID do tópico é obrigatório');
    if (props.duracaoMinutos < 0) throw new Error('A duração da sessão não pode ser negativa');

    return new SessaoEstudo({
      ...props,
      id: props.id ?? Math.random().toString(36).substring(2, 15),
      createdAt: props.createdAt ?? new Date(),
      syncStatus: props.syncStatus ?? StatusSincronizacao.pending(),
    });
  }
}
