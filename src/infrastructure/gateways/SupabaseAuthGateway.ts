/** Description: Supabase implementation of IAuthGateway. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { IAuthGateway } from '../../domain/gateways/IAuthGateway';
import { Usuario } from '../../domain/entities/Usuario';
import { supabase } from '../../lib/supabase';

export class SupabaseAuthGateway implements IAuthGateway {
  constructor(private readonly client: SupabaseClient = supabase) {}

  async obterUsuarioLogado(): Promise<Usuario | null> {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error || !user) return null;

      const { data: perfil } = await this.client
        .from('perfis')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      return Usuario.create({
        id: user.id,
        email: user.email ?? '',
        nomeExibicao: perfil?.nome_exibicao ?? user.user_metadata?.nome_exibicao ?? user.email?.split('@')[0] ?? 'Estudante',
        xpTotal: perfil?.xp_total ?? 0,
        xpSemanal: perfil?.xp_semanal ?? 0,
        streakAtual: perfil?.streak_atual ?? 0,
      });
    } catch {
      return null;
    }
  }

  async login(email: string, senha: string): Promise<Usuario> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Falha ao autenticar usuário');
    }

    const user = data.user;
    const { data: perfil } = await this.client
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return Usuario.create({
      id: user.id,
      email: user.email ?? email.trim(),
      nomeExibicao: perfil?.nome_exibicao ?? user.user_metadata?.nome_exibicao ?? 'Estudante',
      xpTotal: perfil?.xp_total ?? 0,
      xpSemanal: perfil?.xp_semanal ?? 0,
      streakAtual: perfil?.streak_atual ?? 0,
    });
  }

  async cadastrar(email: string, senha: string, nomeExibicao: string): Promise<Usuario> {
    const { data, error } = await this.client.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha,
      options: {
        data: {
          nome_exibicao: nomeExibicao.trim(),
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Falha ao cadastrar usuário');
    }

    const user = data.user;
    return Usuario.create({
      id: user.id,
      email: user.email ?? email.trim(),
      nomeExibicao: nomeExibicao.trim(),
      xpTotal: 0,
      xpSemanal: 0,
      streakAtual: 0,
    });
  }

  async logout(): Promise<void> {
    await this.client.auth.signOut();
  }
}

