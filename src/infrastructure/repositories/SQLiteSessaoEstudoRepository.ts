/** Description: SQLite implementation of ISessaoEstudoRepository using SQLiteExecutor. */
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { FotoSessao } from '../../domain/entities/FotoSessao';
import { Coordenada } from '../../domain/value-objects/Coordenada';
import { StatusSincronizacao, StatusSincronizacaoType } from '../../domain/value-objects/StatusSincronizacao';
import type { SQLiteExecutor } from '../database/SQLiteExecutor';
import { getDatabase } from '../database/database';

interface SessaoRow {
  id: string;
  usuario_id: string;
  disciplina_id: string;
  topico_id: string;
  duracao_minutos: number;
  created_at: string;
  sync_status: StatusSincronizacaoType;
  latitude: number | null;
  longitude: number | null;
  coordenada_timestamp: string | null;
  foto_id: string | null;
  foto_uri_local: string | null;
  foto_url_remota: string | null;
  foto_upload_status: 'pending' | 'uploading' | 'completed' | 'error' | null;
}

export class SQLiteSessaoEstudoRepository implements ISessaoEstudoRepository {
  constructor(private readonly getDb: () => Promise<SQLiteExecutor> = getDatabase) {}

  async salvar(sessao: SessaoEstudo): Promise<void> {
    const db = await this.getDb();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO sessoes_estudo (
          id, usuario_id, disciplina_id, topico_id, duracao_minutos,
          created_at, sync_status, latitude, longitude, coordenada_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          usuario_id = excluded.usuario_id,
          disciplina_id = excluded.disciplina_id,
          topico_id = excluded.topico_id,
          duracao_minutos = excluded.duracao_minutos,
          created_at = excluded.created_at,
          sync_status = excluded.sync_status,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          coordenada_timestamp = excluded.coordenada_timestamp;`,
        [
          sessao.id,
          sessao.usuarioId,
          sessao.disciplinaId,
          sessao.topicoId,
          sessao.duracaoMinutos,
          sessao.createdAt.toISOString(),
          sessao.syncStatus.value,
          sessao.coordenada ? sessao.coordenada.latitude : null,
          sessao.coordenada ? sessao.coordenada.longitude : null,
          sessao.coordenada ? sessao.coordenada.timestamp.toISOString() : null,
        ]
      );

      if (sessao.foto) {
        await db.runAsync(
          `INSERT INTO fotos_sessao (id, sessao_id, uri_local, url_remota, upload_status)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(sessao_id) DO UPDATE SET
             id = excluded.id,
             uri_local = excluded.uri_local,
             url_remota = excluded.url_remota,
             upload_status = excluded.upload_status;`,
          [
            sessao.foto.id,
            sessao.id,
            sessao.foto.uriLocal,
            sessao.foto.urlRemota ?? null,
            sessao.foto.uploadStatus,
          ]
        );
      }
    });
  }

  async buscarPorId(id: string): Promise<SessaoEstudo | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<SessaoRow>(
      `SELECT
        s.id, s.usuario_id, s.disciplina_id, s.topico_id, s.duracao_minutos,
        s.created_at, s.sync_status, s.latitude, s.longitude, s.coordenada_timestamp,
        f.id AS foto_id, f.uri_local AS foto_uri_local, f.url_remota AS foto_url_remota, f.upload_status AS foto_upload_status
      FROM sessoes_estudo s
      LEFT JOIN fotos_sessao f ON f.sessao_id = s.id
      WHERE s.id = ?;`,
      [id]
    );

    if (!row) return null;
    return this.mapToEntity(row);
  }

  async listarPorUsuario(usuarioId: string): Promise<SessaoEstudo[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<SessaoRow>(
      `SELECT
        s.id, s.usuario_id, s.disciplina_id, s.topico_id, s.duracao_minutos,
        s.created_at, s.sync_status, s.latitude, s.longitude, s.coordenada_timestamp,
        f.id AS foto_id, f.uri_local AS foto_uri_local, f.url_remota AS foto_url_remota, f.upload_status AS foto_upload_status
      FROM sessoes_estudo s
      LEFT JOIN fotos_sessao f ON f.sessao_id = s.id
      WHERE s.usuario_id = ?
      ORDER BY s.created_at DESC;`,
      [usuarioId]
    );

    return rows.map((r) => this.mapToEntity(r));
  }

  async listarPorDisciplina(disciplinaId: string): Promise<SessaoEstudo[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<SessaoRow>(
      `SELECT
        s.id, s.usuario_id, s.disciplina_id, s.topico_id, s.duracao_minutos,
        s.created_at, s.sync_status, s.latitude, s.longitude, s.coordenada_timestamp,
        f.id AS foto_id, f.uri_local AS foto_uri_local, f.url_remota AS foto_url_remota, f.upload_status AS foto_upload_status
      FROM sessoes_estudo s
      LEFT JOIN fotos_sessao f ON f.sessao_id = s.id
      WHERE s.disciplina_id = ?
      ORDER BY s.created_at DESC;`,
      [disciplinaId]
    );

    return rows.map((r) => this.mapToEntity(r));
  }

  async listarTodas(): Promise<SessaoEstudo[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<SessaoRow>(
      `SELECT
        s.id, s.usuario_id, s.disciplina_id, s.topico_id, s.duracao_minutos,
        s.created_at, s.sync_status, s.latitude, s.longitude, s.coordenada_timestamp,
        f.id AS foto_id, f.uri_local AS foto_uri_local, f.url_remota AS foto_url_remota, f.upload_status AS foto_upload_status
      FROM sessoes_estudo s
      LEFT JOIN fotos_sessao f ON f.sessao_id = s.id
      ORDER BY s.created_at DESC;`
    );

    return rows.map((r) => this.mapToEntity(r));
  }

  private mapToEntity(row: SessaoRow): SessaoEstudo {
    let coordenada: Coordenada | undefined;
    if (row.latitude !== null && row.longitude !== null && row.latitude !== undefined && row.longitude !== undefined) {
      coordenada = Coordenada.create({
        latitude: row.latitude,
        longitude: row.longitude,
        timestamp: row.coordenada_timestamp ? new Date(row.coordenada_timestamp) : undefined,
      });
    }

    const sessao = SessaoEstudo.create({
      id: row.id,
      usuarioId: row.usuario_id,
      disciplinaId: row.disciplina_id,
      topicoId: row.topico_id,
      duracaoMinutos: row.duracao_minutos,
      createdAt: new Date(row.created_at),
      syncStatus: StatusSincronizacao.create(row.sync_status),
      coordenada,
    });

    if (row.foto_uri_local) {
      const foto = FotoSessao.create({
        id: row.foto_id ?? undefined,
        sessaoId: row.id,
        uriLocal: row.foto_uri_local,
        urlRemota: row.foto_url_remota ?? undefined,
        uploadStatus: row.foto_upload_status ?? 'pending',
      });
      sessao.anexarFoto(foto);
    }

    return sessao;
  }
}

