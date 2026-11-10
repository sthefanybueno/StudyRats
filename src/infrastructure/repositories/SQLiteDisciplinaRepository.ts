/** Description: SQLite implementation of IDisciplinaRepository using SQLiteExecutor. */
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';
import { Disciplina } from '../../domain/entities/Disciplina';
import { Topico } from '../../domain/entities/Topico';
import { StatusSincronizacao, StatusSincronizacaoType } from '../../domain/value-objects/StatusSincronizacao';
import type { SQLiteExecutor } from '../database/SQLiteExecutor';
import { getDatabase } from '../database/database';

interface DisciplinaRow {
  id: string;
  usuario_id: string;
  nome: string;
  cor: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: StatusSincronizacaoType;
}

interface TopicoRow {
  id: string;
  disciplina_id: string;
  nome: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: StatusSincronizacaoType;
}

export class SQLiteDisciplinaRepository implements IDisciplinaRepository {
  constructor(private readonly getDb: () => Promise<SQLiteExecutor> = getDatabase) {}

  async salvar(disciplina: Disciplina): Promise<void> {
    const db = await this.getDb();

    await db.withTransactionAsync(async () => {
      // 1. Salvar / atualizar a Disciplina
      await db.runAsync(
        `INSERT INTO disciplinas (
          id, usuario_id, nome, cor, created_at, updated_at, deleted_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          usuario_id = excluded.usuario_id,
          nome = excluded.nome,
          cor = excluded.cor,
          updated_at = excluded.updated_at,
          deleted_at = excluded.deleted_at,
          sync_status = excluded.sync_status;`,
        [
          disciplina.id,
          disciplina.usuarioId,
          disciplina.nome,
          disciplina.cor,
          disciplina.createdAt.toISOString(),
          disciplina.updatedAt.toISOString(),
          disciplina.deletedAt ? disciplina.deletedAt.toISOString() : null,
          disciplina.syncStatus.value,
        ]
      );

      // 2. Se a disciplina foi marcada como deletada, refletir em cascata nos tópicos
      if (disciplina.deletedAt) {
        await db.runAsync(
          `UPDATE topicos SET deleted_at = ? WHERE disciplina_id = ?;`,
          [disciplina.deletedAt.toISOString(), disciplina.id]
        );
        return;
      }

      // 3. Salvar tópicos ativos
      const topicosAtivos = disciplina.topicos;
      const idsAtivos = topicosAtivos.map(t => t.id);

      // Marca tópicos que foram removidos da entidade como deletados
      if (idsAtivos.length > 0) {
        const placeholders = idsAtivos.map(() => '?').join(',');
        await db.runAsync(
          `UPDATE topicos SET deleted_at = ? WHERE disciplina_id = ? AND id NOT IN (${placeholders});`,
          [new Date().toISOString(), disciplina.id, ...idsAtivos]
        );
      } else {
        await db.runAsync(
          `UPDATE topicos SET deleted_at = ? WHERE disciplina_id = ?;`,
          [new Date().toISOString(), disciplina.id]
        );
      }

      for (const topico of topicosAtivos) {
        await db.runAsync(
          `INSERT INTO topicos (
            id, disciplina_id, nome, created_at, updated_at, deleted_at, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            nome = excluded.nome,
            updated_at = excluded.updated_at,
            deleted_at = excluded.deleted_at,
            sync_status = excluded.sync_status;`,
          [
            topico.id,
            topico.disciplinaId,
            topico.nome,
            topico.createdAt.toISOString(),
            topico.updatedAt.toISOString(),
            topico.deletedAt ? topico.deletedAt.toISOString() : null,
            topico.syncStatus.value,
          ]
        );
      }
    });
  }

  async buscarPorId(id: string): Promise<Disciplina | null> {
    const db = await this.getDb();
    const dRow = await db.getFirstAsync<DisciplinaRow>(
      `SELECT * FROM disciplinas WHERE id = ? AND deleted_at IS NULL;`,
      [id]
    );

    if (!dRow) return null;

    const topicosRows = await db.getAllAsync<TopicoRow>(
      `SELECT * FROM topicos WHERE disciplina_id = ? AND deleted_at IS NULL ORDER BY created_at ASC;`,
      [id]
    );

    return this.mapToEntity(dRow, topicosRows);
  }

  async listarPorUsuario(usuarioId: string): Promise<Disciplina[]> {
    const db = await this.getDb();
    const dRows = await db.getAllAsync<DisciplinaRow>(
      `SELECT * FROM disciplinas WHERE usuario_id = ? AND deleted_at IS NULL ORDER BY created_at ASC, id ASC;`,
      [usuarioId]
    );

    if (dRows.length === 0) return [];

    const topicosRows = await db.getAllAsync<TopicoRow>(
      `SELECT t.* FROM topicos t
       JOIN disciplinas d ON d.id = t.disciplina_id
       WHERE d.usuario_id = ? AND t.deleted_at IS NULL AND d.deleted_at IS NULL
       ORDER BY t.created_at ASC, t.id ASC;`,
      [usuarioId]
    );

    const topicosPorDisciplina = new Map<string, TopicoRow[]>();
    for (const t of topicosRows) {
      const list = topicosPorDisciplina.get(t.disciplina_id) ?? [];
      list.push(t);
      topicosPorDisciplina.set(t.disciplina_id, list);
    }

    return dRows.map((d) => this.mapToEntity(d, topicosPorDisciplina.get(d.id) ?? []));
  }

  async deletar(id: string): Promise<void> {
    const db = await this.getDb();
    const nowIso = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      await db.runAsync(`UPDATE disciplinas SET deleted_at = ? WHERE id = ?;`, [nowIso, id]);
      await db.runAsync(`UPDATE topicos SET deleted_at = ? WHERE disciplina_id = ?;`, [nowIso, id]);
    });
  }

  private mapToEntity(dRow: DisciplinaRow, topicosRows: TopicoRow[]): Disciplina {
    const disciplina = Disciplina.create({
      id: dRow.id,
      usuarioId: dRow.usuario_id,
      nome: dRow.nome,
      cor: dRow.cor,
      createdAt: new Date(dRow.created_at),
      updatedAt: new Date(dRow.updated_at),
      deletedAt: dRow.deleted_at ? new Date(dRow.deleted_at) : undefined,
      syncStatus: StatusSincronizacao.create(dRow.sync_status),
    });

    for (const tRow of topicosRows) {
      if (!tRow.deleted_at) {
        disciplina.adicionarTopico(
          Topico.create({
            id: tRow.id,
            disciplinaId: tRow.disciplina_id,
            nome: tRow.nome,
            createdAt: new Date(tRow.created_at),
            updatedAt: new Date(tRow.updated_at),
            deletedAt: tRow.deleted_at ? new Date(tRow.deleted_at) : undefined,
            syncStatus: StatusSincronizacao.create(tRow.sync_status),
          })
        );
      }
    }

    return disciplina;
  }
}
