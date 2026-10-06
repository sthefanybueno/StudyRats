import { Email } from '../value-objects/Email';

export interface UsuarioProps {
  id: string; // ID will come from Supabase Auth in this case
  email: Email;
  nomeExibicao: string;
  nomeUsuario?: string;
  fotoUrl?: string;
  xpTotal?: number;
  xpSemanal?: number;
  streakAtual?: number;
}

export class Usuario {
  private constructor(private props: UsuarioProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get nomeExibicao(): string {
    return this.props.nomeExibicao;
  }

  public get nomeUsuario(): string | undefined {
    return this.props.nomeUsuario;
  }

  public get fotoUrl(): string | undefined {
    return this.props.fotoUrl;
  }

  public get xpTotal(): number {
    return this.props.xpTotal || 0;
  }

  public get xpSemanal(): number {
    return this.props.xpSemanal || 0;
  }

  public get streakAtual(): number {
    return this.props.streakAtual || 0;
  }

  public adicionarXP(xp: number): void {
    if (xp < 0) {
      throw new Error('Não é possível adicionar XP negativo');
    }
    this.props.xpTotal = this.xpTotal + xp;
    this.props.xpSemanal = this.xpSemanal + xp;
  }

  public incrementarStreak(): void {
    this.props.streakAtual = this.streakAtual + 1;
  }

  public resetarStreak(): void {
    this.props.streakAtual = 0;
  }

  public atualizarNomeExibicao(novoNome: string): void {
    if (!novoNome || novoNome.trim() === '') {
      throw new Error('O nome de exibição é obrigatório');
    }
    this.props.nomeExibicao = novoNome.trim();
  }

  public atualizarNomeUsuario(novoUsername?: string): void {
    if (!novoUsername || novoUsername.trim() === '') {
      this.props.nomeUsuario = undefined;
      return;
    }
    let limpo = novoUsername.trim();
    if (limpo.startsWith('@')) {
      limpo = limpo.substring(1).trim();
    }
    const regex = /^[a-zA-Z0-9._]{3,30}$/;
    if (!regex.test(limpo)) {
      throw new Error('O username deve ter de 3 a 30 caracteres (letras, números, . ou _)');
    }
    this.props.nomeUsuario = `@${limpo}`;
  }

  public atualizarFotoUrl(novaFotoUrl?: string): void {
    this.props.fotoUrl = novaFotoUrl && novaFotoUrl.trim() !== '' ? novaFotoUrl.trim() : undefined;
  }

  public static create(props: Omit<UsuarioProps, 'email'> & { email: string | Email }): Usuario {
    if (!props.id || props.id.trim() === '') {
      throw new Error('O ID do usuário (Auth) é obrigatório');
    }

    if (!props.nomeExibicao || props.nomeExibicao.trim() === '') {
      throw new Error('O nome de exibição é obrigatório');
    }

    const email = props.email instanceof Email ? props.email : Email.create(props.email);

    let nomeUsuarioFormatado = props.nomeUsuario;
    if (nomeUsuarioFormatado && nomeUsuarioFormatado.trim()) {
      let limpo = nomeUsuarioFormatado.trim();
      if (!limpo.startsWith('@')) {
        limpo = `@${limpo}`;
      }
      nomeUsuarioFormatado = limpo;
    }

    return new Usuario({
      ...props,
      email,
      nomeUsuario: nomeUsuarioFormatado,
      fotoUrl: props.fotoUrl,
      xpTotal: props.xpTotal ?? 0,
      xpSemanal: props.xpSemanal ?? 0,
      streakAtual: props.streakAtual ?? 0,
    });
  }
}

