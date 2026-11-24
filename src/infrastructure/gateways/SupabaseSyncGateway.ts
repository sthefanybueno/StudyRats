/** Description: Supabase implementation of ISyncGateway for outbox synchronization, storage upload and ranking queries. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { Usuario } from '../../domain/entities/Usuario';
import { supabase } from '../../lib/supabase';

export class SupabaseSyncGateway implements ISyncGateway {
  constructor(private readonly client: SupabaseClient = supabase) {}

  private async lerBytesFoto(uriLocal: string): Promise<ArrayBuffer | Blob> {
    // Em React Native (Android/iOS), ler direto via expo-file-system evita falhas de fetch('file://...') / Blob vazio.
    if (/^file:\/\//i.test(uriLocal)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { File } = require('expo-file-system');
        if (typeof File === 'function') {
          const arquivo = new File(uriLocal);
          if (typeof arquivo.arrayBuffer === 'function') {
            const buffer = await arquivo.arrayBuffer();
            if (buffer.byteLength > 0) {
              return buffer;
            }
          }
        }
      } catch {
        // Segue para fallback via fetch abaixo (ex.: ambiente de testes ou URIs content://)
      }
    }

    const response = await fetch(uriLocal);
    if (typeof (response as any).arrayBuffer === 'function') {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 0) {
        return buffer;
      }
    }
    if (typeof (response as any).blob === 'function') {
      return await response.blob();
    }

    throw new Error('Não foi possível ler os bytes da foto local');
  }

  async fazerUploadFoto(uriLocal: string, caminhoRemoto: string): Promise<string> {
    try {
      let caminhoFinal = caminhoRemoto;
      if (typeof this.client.auth?.getSession === 'function') {
        const { data: sessaoData } = await this.client.auth.getSession();
        const uidAutenticado = sessaoData?.session?.user?.id;
        if (!uidAutenticado) {
          throw new Error('Sessão do Supabase Auth ausente para upload de foto');
        }
        const partes = caminhoRemoto.split('/');
        if (partes.length > 1) {
          partes[0] = uidAutenticado;
          caminhoFinal = partes.join('/');
        } else {
          caminhoFinal = `${uidAutenticado}/${caminhoRemoto}`;
        }
      }

      const corpoArquivo = await this.lerBytesFoto(uriLocal);
      const isPng = /\.png$/i.test(caminhoFinal) || /\.png$/i.test(uriLocal);
      const contentType = isPng ? 'image/png' : 'image/jpeg';

      const { error } = await this.client.storage
        .from('fotos_sessao')
        .upload(caminhoFinal, corpoArquivo, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw new Error(`Falha no upload da foto: ${error.message}`);
      }

      // Bucket privado (ver docs/supabase/seguranca.sql): guardamos o caminho e geramos URL assinada sob demanda.
      return caminhoFinal;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao fazer upload da evidência fotográfica');
    }
  }

  /**
   * Faz upload do avatar do perfil no bucket público 'avatares' e devolve a URL pública para Ranking/Feed.
   */
  async fazerUploadAvatar(uriLocal: string, caminhoRemoto: string): Promise<string> {
    let caminhoFinal = caminhoRemoto;
    if (typeof this.client.auth?.getSession === 'function') {
      const { data: sessaoData } = await this.client.auth.getSession();
      const uidAutenticado = sessaoData?.session?.user?.id;
      if (!uidAutenticado) {
        throw new Error('Sessão do Supabase Auth ausente para upload do avatar');
      }
      const partes = caminhoRemoto.split('/');
      caminhoFinal = partes.length > 1 ? `${uidAutenticado}/${partes.slice(1).join('/')}` : `${uidAutenticado}/${caminhoRemoto}`;
    }

    const corpoArquivo = await this.lerBytesFoto(uriLocal);
    const isPng = /\.png$/i.test(caminhoFinal) || /\.png$/i.test(uriLocal);
    const contentType = isPng ? 'image/png' : 'image/jpeg';

    const bucket = this.client.storage.from('avatares');
    const { error } = await bucket.upload(caminhoFinal, corpoArquivo, {
      contentType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Falha no upload do avatar: ${error.message}`);
    }

    const { data } = bucket.getPublicUrl(caminhoFinal);
    const base = data?.publicUrl || caminhoFinal;
    return base.includes('?') ? `${base}&t=${Date.now()}` : `${base}?t=${Date.now()}`;
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

    let uidAutenticado: string | undefined;
    if (typeof this.client.auth?.getSession === 'function') {
      const { data: sessaoData } = await this.client.auth.getSession();
      uidAutenticado = sessaoData?.session?.user?.id;
      if (!uidAutenticado) {
        throw new Error('Sessão do Supabase Auth ausente (saia da conta em Perfil e faça login novamente)');
      }
    }

    const usuarioIdEfetivo = uidAutenticado ?? dados.usuarioId;

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
              .eq('usuario_id', usuarioIdEfetivo),
            'sessoes_estudo'
          );
        } else {
          this.verificar(
            await this.client.from('sessoes_estudo').upsert({
              id: dados.id,
              usuario_id: usuarioIdEfetivo,
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

          if (dados.fotoRemota) {
            try {
              const resFoto = await this.client.from('fotos_sessao').upsert({
                id: `${dados.id}-foto`,
                sessao_id: dados.id,
                storage_path: dados.fotoRemota,
              });
              if (resFoto?.error) {
                console.warn('[SupabaseSyncGateway] Aviso ao gravar tabela fotos_sessao:', resFoto.error.message);
              }
            } catch (err: any) {
              console.warn('[SupabaseSyncGateway] Erro ao gravar tabela fotos_sessao:', err?.message ?? err);
            }
          }
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
            usuario_id: usuarioIdEfetivo,
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
            ...(dados.createdAt ? { created_at: dados.createdAt } : {}),
            updated_at: dados.updatedAt ?? new Date().toISOString(),
            deleted_at: dados.deletedAt ?? null,
            }),
            'topicos'
          );
        }
        break;
      }

      case 'perfis': {
        const perfilIdEfetivo = uidAutenticado ?? dados.id;
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
        if (dados.nomeUsuario !== undefined) {
          registroPerfil.nome_usuario = dados.nomeUsuario || null;
        }
        if (dados.fotoUrl !== undefined) {
          registroPerfil.foto_url = dados.fotoUrl || null;
        }
        if (typeof dados.metaDiariaMinutos === 'number') {
          registroPerfil.meta_diaria_minutos = dados.metaDiariaMinutos;
        }

        if (operacao === 'INSERT') {
          this.verificar(
            await this.client.from('perfis').upsert({
              id: perfilIdEfetivo,
              ...registroPerfil,
            }),
            'perfis'
          );
        } else {
          this.verificar(
            await this.client
              .from('perfis')
              .update(registroPerfil)
              .eq('id', perfilIdEfetivo),
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
        nomeUsuario: p.nome_usuario ?? undefined,
        fotoUrl: p.foto_url ?? undefined,
        metaDiariaMinutos: p.meta_diaria_minutos ?? undefined,
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

  async limparCoordenadasRemotas(): Promise<number> {
    const { data: rpcData, error: rpcError } = await this.client.rpc('limpar_minhas_coordenadas');
    if (!rpcError && typeof rpcData === 'number') {
      return rpcData;
    }

    // Fallback direto via UPDATE na tabela caso a RPC ainda não esteja liberada
    let uidAutenticado: string | undefined;
    if (typeof this.client.auth?.getSession === 'function') {
      const { data: sessaoData } = await this.client.auth.getSession();
      uidAutenticado = sessaoData?.session?.user?.id;
    }
    if (!uidAutenticado) {
      throw new Error('Sessão do Supabase Auth ausente');
    }

    const { data, error } = await this.client
      .from('sessoes_estudo')
      .update({
        latitude: null,
        longitude: null,
        accuracy: null,
        local_aproximado: null,
      })
      .eq('usuario_id', uidAutenticado)
      .or('latitude.not.is.null,longitude.not.is.null')
      .select('id');

    if (error) {
      throw new Error(`Falha ao limpar coordenadas no Supabase: ${error.message}`);
    }

    return Array.isArray(data) ? data.length : 0;
  }

  async obterEstatisticasUsuarioRemoto(): Promise<{
    sessoesCount: number;
    sessoesComGpsCount: number;
    minutosTotais: number;
    sessoesResumo?: Array<{
      id: string;
      duracaoMinutos: number;
      comGps: boolean;
      comFoto: boolean;
    }>;
    xpTotal?: number;
    xpSemanal?: number;
    streakAtual?: number;
  } | null> {
    try {
      if (typeof this.client.auth?.getSession !== 'function') return null;
      const { data: sessaoData } = await this.client.auth.getSession();
      const uid = sessaoData?.session?.user?.id;
      if (!uid) return null;

      const [sessoesRes, perfilRes] = await Promise.all([
        this.client
          .from('sessoes_estudo')
          .select('id, duracao_minutos, latitude, longitude')
          .eq('usuario_id', uid),
        this.client
          .from('perfis')
          .select('xp_total, xp_semanal, streak_atual')
          .eq('id', uid)
          .maybeSingle(),
      ]);

      if (sessoesRes.error) return null;
      const linhas = (sessoesRes.data ?? []) as Array<{
        id: string;
        duracao_minutos?: number | null;
        latitude?: number | null;
        longitude?: number | null;
      }>;

      const ids = linhas.map((s) => s.id);
      const idsComFoto = new Set<string>();
      if (ids.length > 0) {
        try {
          const fotosRes = await this.client
            .from('fotos_sessao')
            .select('sessao_id')
            .in('sessao_id', ids);
          for (const f of (fotosRes?.data ?? []) as Array<{ sessao_id?: string }>) {
            if (f.sessao_id) idsComFoto.add(f.sessao_id);
          }
        } catch {
          // fotos_sessao pode ainda não estar liberada por policy; o app mescla com o SQLite local
        }
      }

      const sessoesResumo = linhas.map((s) => ({
        id: s.id,
        duracaoMinutos: s.duracao_minutos ?? 1,
        comGps: s.latitude !== null && s.latitude !== undefined && s.longitude !== null && s.longitude !== undefined,
        comFoto: idsComFoto.has(s.id),
      }));

      return {
        sessoesCount: linhas.length,
        sessoesComGpsCount: sessoesResumo.filter((s) => s.comGps).length,
        minutosTotais: linhas.reduce((acc, s) => acc + (s.duracao_minutos ?? 0), 0),
        sessoesResumo,
        xpTotal: perfilRes.data?.xp_total ?? undefined,
        xpSemanal: perfilRes.data?.xp_semanal ?? undefined,
        streakAtual: perfilRes.data?.streak_atual ?? undefined,
      };
    } catch {
      return null;
    }
  }
}

