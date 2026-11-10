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

      const { data: publicUrlData } = this.client.storage
        .from('fotos_sessao')
        .getPublicUrl(caminhoRemoto);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao fazer upload da evidência fotográfica');
    }
  }

  async enviarParaNuvem(tabela: string, operacao: 'INSERT' | 'UPDATE' | 'DELETE', payload: any): Promise<void> {
    const dados = typeof payload === 'string' ? JSON.parse(payload) : payload;

    switch (tabela) {
      case 'sessoes_estudo': {
        if (operacao === 'DELETE') {
          await this.client.from('sessoes_estudo').delete().eq('id', dados.id);
        } else {
          await this.client.from('sessoes_estudo').upsert({
            id: dados.id,
            usuario_id: dados.usuarioId,
            disciplina_id: dados.disciplinaId,
            topico_id: dados.topicoId,
            duracao_minutos: dados.duracaoMinutos,
            latitude: dados.latitude ?? null,
            longitude: dados.longitude ?? null,
            created_at: dados.createdAt,
          });
        }
        break;
      }

      case 'disciplinas': {
        if (operacao === 'DELETE') {
          await this.client.from('disciplinas').delete().eq('id', dados.id);
        } else {
          await this.client.from('disciplinas').upsert({
            id: dados.id,
            usuario_id: dados.usuarioId,
            nome: dados.nome,
            cor: dados.cor,
            created_at: dados.createdAt,
            updated_at: dados.updatedAt ?? new Date().toISOString(),
            deleted_at: dados.deletedAt ?? null,
          });
        }
        break;
      }

      case 'topicos': {
        if (operacao === 'DELETE') {
          await this.client.from('topicos').delete().eq('id', dados.id);
        } else {
          await this.client.from('topicos').upsert({
            id: dados.id,
            disciplina_id: dados.disciplinaId,
            nome: dados.nome,
            created_at: dados.createdAt,
            updated_at: dados.updatedAt ?? new Date().toISOString(),
            deleted_at: dados.deletedAt ?? null,
          });
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
}

