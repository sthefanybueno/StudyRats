/** Description: Supabase implementation of ISyncGateway for outbox synchronization, storage upload and ranking queries. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { Usuario } from '../../domain/entities/Usuario';
import { supabase } from '../../lib/supabase';

export class SupabaseSyncGateway implements ISyncGateway {
  constructor(private readonly client: SupabaseClient = supabase) {}

  async fazerUploadFoto(uriLocal: string, caminhoRemoto: string): Promise<string> {
    try {
      const response = await fetch(uriLocal);
      const blob = await response.blob();

      const { error } = await this.client.storage
        .from('fotos_sessao')
        .upload(caminhoRemoto, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        throw new Error(`Falha no upload da foto: ${error.message}`);
      }

      // Bucket privado (ver docs/supabase/seguranca.sql): guardamos o caminho e geramos URL assinada sob demanda.
      return caminhoRemoto;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao fazer upload da evidência fotográfica');
    }
  }

  /**
   * Gera uma URL temporária assinada (padrão 60s) para leitura em bucket privado (PDF 03, slide 28).
   */
  async criarUrlAssinadaFoto(caminhoRemoto: string, expiraEmSegundos: number = 60): Promise<string | null> {
    const { data, error } = await this.client.storage
      .from('fotos_sessao')
      .createSignedUrl(caminhoRemoto, expiraEmSegundos);

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  }

  /** Lança erro quando o Supabase rejeita a operação (RLS, rede, constraint), evitando perda silenciosa na outbox. */
  private verificar(resultado: { error?: { message: string } | null } | undefined, tabela: string): void {
    if (resultado?.error) {
      throw new Error(`Falha ao sincronizar '${tabela}': ${resultado.error.message}`);
    }
  }

  async enviarParaNuvem(tabela: string, operacao: 'INSERT' | 'UPDATE' | 'DELETE', payload: any): Promise<void> {
    const dados = typeof payload === 'string' ? JSON.parse(payload) : payload;

    switch (tabela) {
      case 'sessoes_estudo': {
        if (operacao === 'DELETE') {
          this.verificar(await this.client.from('sessoes_estudo').delete().eq('id', dados.id), 'sessoes_estudo');
        } else if (operacao === 'UPDATE' && dados.acao === 'LIMPAR_COORDENADAS') {
          this.verificar(
            await this.client
              .from('sessoes_estudo')
              .update({
                latitude: null,
                longitude: null,
                accuracy: null,
                local_aproximado: null,
              })
              .eq('usuario_id', dados.usuarioId),
            'sessoes_estudo'
          );
        } else {
          this.verificar(
            await this.client.from('sessoes_estudo').upsert({
              id: dados.id,
              usuario_id: dados.usuarioId,
              disciplina_id: dados.disciplinaId,
              topico_id: dados.topicoId,
              duracao_minutos: dados.duracaoMinutos,
              latitude: dados.latitude ?? null,
              longitude: dados.longitude ?? null,
              accuracy: dados.accuracy ?? null,
              local_aproximado: dados.localAproximado ?? null,
              created_at: dados.createdAt,
            }),
            'sessoes_estudo'
          );
        }
        break;
      }

      case 'disciplinas': {
        if (operacao === 'DELETE') {
          this.verificar(await this.client.from('disciplinas').delete().eq('id', dados.id), 'disciplinas');
        } else {
          this.verificar(
            await this.client.from('disciplinas').upsert({
            id: dados.id,
            usuario_id: dados.usuarioId,
            nome: dados.nome,
            cor: dados.cor,
            created_at: dados.createdAt,
            updated_at: dados.updatedAt ?? new Date().toISOString(),
            deleted_at: dados.deletedAt ?? null,
            }),
            'disciplinas'
          );
        }
        break;
      }

      case 'topicos': {
        if (operacao === 'DELETE') {
          this.verificar(await this.client.from('topicos').delete().eq('id', dados.id), 'topicos');
        } else {
          this.verificar(
            await this.client.from('topicos').upsert({
            id: dados.id,
            disciplina_id: dados.disciplinaId,
            nome: dados.nome,
            created_at: dados.createdAt,
            updated_at: dados.updatedAt ?? new Date().toISOString(),
            deleted_at: dados.deletedAt ?? null,
            }),
            'topicos'
          );
        }
        break;
      }

      case 'perfis': {
        const registroPerfil: Record<string, any> = {
          xp_total: dados.xpTotal ?? 0,
          xp_semanal: dados.xpSemanal ?? 0,
          streak_atual: dados.streakAtual ?? 0,
        };
        if (dados.nomeExibicao !== undefined) {
          registroPerfil.nome_exibicao = dados.nomeExibicao;
        }
        if (dados.email !== undefined) {
          registroPerfil.email = dados.email;
        }

        if (operacao === 'INSERT') {
          this.verificar(
            await this.client.from('perfis').upsert({
              id: dados.id,
              ...registroPerfil,
            }),
            'perfis'
          );
        } else {
          this.verificar(
            await this.client
              .from('perfis')
              .update(registroPerfil)
              .eq('id', dados.id),
            'perfis'
          );
        }
        break;
      }

      default: {
        console.warn(`[SupabaseSyncGateway] Tabela desconhecida para sincronização: ${tabela}`);
        break;
      }
    }
  }

  async obterRanking(): Promise<Usuario[]> {
    const { data, error } = await this.client
      .from('perfis')
      .select('*')
      .order('xp_semanal', { ascending: false })
      .limit(50);

    if (error || !data) {
      return [];
    }

    return data.map((p) =>
      Usuario.create({
        id: p.id,
        email: p.email,
        nomeExibicao: p.nome_exibicao,
        xpTotal: p.xp_total ?? 0,
        xpSemanal: p.xp_semanal ?? 0,
        streakAtual: p.streak_atual ?? 0,
      })
    );
  }

  async expurgarCoordenadasAntigas(diasRetencao: number): Promise<number> {
    const { data, error } = await this.client.rpc('expurgar_coordenadas_antigas', {
      p_dias: diasRetencao,
    });

    if (error) {
      throw new Error(`Falha ao expurgar coordenadas antigas no Supabase: ${error.message}`);
    }

    return typeof data === 'number' ? data : 0;
  }
}

