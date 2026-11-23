/** Description: Implementação Supabase de IFeedGateway usando consultas padrão e RPC PostGIS (buscar_sessoes_proximas / ST_DWithin). */
import type { SupabaseClient } from '@supabase/supabase-js';
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { Usuario } from '../../domain/entities/Usuario';
import { IFeedGateway, PaginaFeed, SessaoComunidade } from '../../domain/gateways/IFeedGateway';
import { Coordenada } from '../../domain/value-objects/Coordenada';
import { StatusSincronizacao } from '../../domain/value-objects/StatusSincronizacao';
import { supabase } from '../../lib/supabase';

interface SessaoRemotaRow {
  id: string;
  usuario_id: string;
  disciplina_id: string;
  topico_id: string;
  duracao_minutos: number;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  local_aproximado?: string | null;
  created_at: string;
}

export class SupabaseFeedGateway implements IFeedGateway {
  constructor(private readonly client: SupabaseClient = supabase) {}

  async obterFeed(cursor?: string, limite = 50): Promise<PaginaFeed> {
    const inicio = cursor ? Math.max(0, parseInt(cursor, 10) || 0) : 0;
    const fim = inicio + limite - 1;

    const { data, error } = await this.client
      .from('sessoes_estudo')
      .select('id, usuario_id, disciplina_id, topico_id, duracao_minutos, latitude, longitude, accuracy, local_aproximado, created_at')
      .order('created_at', { ascending: false })
      .range(inicio, fim);

    if (error) {
      throw new Error(`Falha ao consultar feed remoto: ${error.message}`);
    }

    const linhas = (data ?? []) as SessaoRemotaRow[];
    const itens = await this.mapearLinhasParaComunidade(linhas);
    const proximoCursor = linhas.length === limite ? String(inicio + limite) : undefined;

    return { itens, proximoCursor };
  }

  async obterFeedProximo(
    latitude: number,
    longitude: number,
    raioMetros: number,
    limite = 50
  ): Promise<PaginaFeed> {
    // Chama a função espacial PostGIS (ST_DWithin) definida em docs/supabase/seguranca.sql
    const { data, error } = await this.client
      .rpc('buscar_sessoes_proximas', {
        p_longitude: longitude,
        p_latitude: latitude,
        p_raio_metros: raioMetros,
      })
      .limit(limite);

    if (error) {
      throw new Error(`Falha na consulta espacial PostGIS: ${error.message}`);
    }

    const linhas = (data ?? []) as SessaoRemotaRow[];
    const itens = await this.mapearLinhasParaComunidade(linhas);
    return { itens, proximoCursor: undefined };
  }

  private async mapearLinhasParaComunidade(linhas: SessaoRemotaRow[]): Promise<SessaoComunidade[]> {
    if (linhas.length === 0) return [];

    const usuarioIds = Array.from(new Set(linhas.map((l) => l.usuario_id)));
    const disciplinaIds = Array.from(new Set(linhas.map((l) => l.disciplina_id)));
    const topicoIds = Array.from(new Set(linhas.map((l) => l.topico_id)));

    const [perfisRes, disciplinasRes, topicosRes] = await Promise.all([
      this.client.from('perfis').select('id, email, nome_exibicao, xp_total, xp_semanal, streak_atual').in('id', usuarioIds),
      this.client.from('disciplinas').select('id, nome').in('id', disciplinaIds),
      this.client.from('topicos').select('id, nome').in('id', topicoIds),
    ]);

    const mapaPerfis = new Map<string, any>((perfisRes.data ?? []).map((p: any) => [p.id, p]));
    const mapaDisciplinas = new Map<string, string>((disciplinasRes.data ?? []).map((d: any) => [d.id, d.nome]));
    const mapaTopicos = new Map<string, string>((topicosRes.data ?? []).map((t: any) => [t.id, t.nome]));

    return linhas.map((row) => {
      let coordenada: Coordenada | undefined;
      if (typeof row.latitude === 'number' && typeof row.longitude === 'number') {
        try {
          coordenada = Coordenada.create({
            latitude: row.latitude,
            longitude: row.longitude,
            accuracy: typeof row.accuracy === 'number' ? row.accuracy : undefined,
            localAproximado: row.local_aproximado ?? undefined,
          });
        } catch {
          coordenada = undefined;
        }
      }

      const sessao = SessaoEstudo.create({
        id: row.id,
        usuarioId: row.usuario_id,
        disciplinaId: row.disciplina_id,
        topicoId: row.topico_id,
        duracaoMinutos: row.duracao_minutos,
        createdAt: new Date(row.created_at),
        syncStatus: StatusSincronizacao.synced(),
        coordenada,
      });

      const p = mapaPerfis.get(row.usuario_id);
      const autor = Usuario.create({
        id: row.usuario_id,
        email: p?.email || `${row.usuario_id}@studyrats.app`,
        nomeExibicao: p?.nome_exibicao || 'Estudante',
        xpTotal: p?.xp_total ?? 0,
        xpSemanal: p?.xp_semanal ?? 0,
        streakAtual: p?.streak_atual ?? 0,
      });

      return {
        sessao,
        autor,
        disciplinaNome: mapaDisciplinas.get(row.disciplina_id) || 'Disciplina',
        topicoNome: mapaTopicos.get(row.topico_id) || 'Estudo Livre',
      };
    });
  }
}

