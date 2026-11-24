/** Description: Declarative SQLite schema (Drizzle-style metadata) and reactive table change bus for useLiveQuery. */

export type TabelaLocal = 'disciplinas' | 'topicos' | 'sessoes_estudo' | 'fotos_sessao' | 'sync_queue';

export interface ColumnDef<T extends string = string> {
  readonly name: T;
  readonly dataType: 'text' | 'integer' | 'real';
  readonly primaryKey?: boolean;
  readonly notNull?: boolean;
  readonly unique?: boolean;
  readonly references?: string;
}

const text = <T extends string>(name: T, opts: Omit<ColumnDef<T>, 'name' | 'dataType'> = {}): ColumnDef<T> => ({
  name,
  dataType: 'text',
  ...opts,
});

const integer = <T extends string>(name: T, opts: Omit<ColumnDef<T>, 'name' | 'dataType'> = {}): ColumnDef<T> => ({
  name,
  dataType: 'integer',
  ...opts,
});

const real = <T extends string>(name: T, opts: Omit<ColumnDef<T>, 'name' | 'dataType'> = {}): ColumnDef<T> => ({
  name,
  dataType: 'real',
  ...opts,
});

function sqliteTable<TName extends TabelaLocal, TCols extends Record<string, ColumnDef<string>>>(
  tableName: TName,
  columns: TCols
) {
  return {
    tableName,
    columns,
    columnNames: Object.values(columns).map((c) => c.name),
  } as const;
}

export const disciplinasTable = sqliteTable('disciplinas', {
  id: text('id', { primaryKey: true, notNull: true }),
  usuarioId: text('usuario_id', { notNull: true }),
  nome: text('nome', { notNull: true }),
  cor: text('cor', { notNull: true }),
  createdAt: text('created_at', { notNull: true }),
  updatedAt: text('updated_at', { notNull: true }),
  deletedAt: text('deleted_at'),
  syncStatus: text('sync_status', { notNull: true }),
});

export const topicosTable = sqliteTable('topicos', {
  id: text('id', { primaryKey: true, notNull: true }),
  disciplinaId: text('disciplina_id', { notNull: true, references: 'disciplinas.id' }),
  nome: text('nome', { notNull: true }),
  createdAt: text('created_at', { notNull: true }),
  updatedAt: text('updated_at', { notNull: true }),
  deletedAt: text('deleted_at'),
  syncStatus: text('sync_status', { notNull: true }),
});

export const sessoesEstudoTable = sqliteTable('sessoes_estudo', {
  id: text('id', { primaryKey: true, notNull: true }),
  usuarioId: text('usuario_id', { notNull: true }),
  disciplinaId: text('disciplina_id', { notNull: true }),
  topicoId: text('topico_id', { notNull: true }),
  duracaoMinutos: integer('duracao_minutos', { notNull: true }),
  createdAt: text('created_at', { notNull: true }),
  syncStatus: text('sync_status', { notNull: true }),
  latitude: real('latitude'),
  longitude: real('longitude'),
  coordenadaTimestamp: text('coordenada_timestamp'),
  accuracy: real('accuracy'),
  localAproximado: text('local_aproximado'),
});

export const fotosSessaoTable = sqliteTable('fotos_sessao', {
  id: text('id', { primaryKey: true, notNull: true }),
  sessaoId: text('sessao_id', { notNull: true, unique: true, references: 'sessoes_estudo.id' }),
  uriLocal: text('uri_local', { notNull: true }),
  urlRemota: text('url_remota'),
  uploadStatus: text('upload_status', { notNull: true }),
});

export const syncQueueTable = sqliteTable('sync_queue', {
  id: text('id', { primaryKey: true, notNull: true }),
  entidade: text('entidade', { notNull: true }),
  operacao: text('operacao', { notNull: true }),
  payloadJson: text('payload_json', { notNull: true }),
  tentativas: integer('tentativas', { notNull: true }),
  erroMsg: text('erro_msg'),
  status: text('status', { notNull: true }),
  createdAt: text('created_at', { notNull: true }),
});

export const localSchema = {
  disciplinas: disciplinasTable,
  topicos: topicosTable,
  sessoes_estudo: sessoesEstudoTable,
  fotos_sessao: fotosSessaoTable,
  sync_queue: syncQueueTable,
} as const;

type TableListener = (tabelas: TabelaLocal[]) => void;
const listeners = new Set<TableListener>();

export function notifyTableChanged(...tabelas: TabelaLocal[]): void {
  if (tabelas.length === 0) return;
  for (const listener of listeners) {
    try {
      listener(tabelas);
    } catch {
      // Listeners reativos não devem quebrar escritas no SQLite
    }
  }
}

export function subscribeTableChanges(
  tabelasObservadas: TabelaLocal[],
  callback: () => void
): () => void {
  const alvo = new Set(tabelasObservadas);
  const listener: TableListener = (alteradas) => {
    if (alteradas.some((t) => alvo.has(t))) {
      callback();
    }
  };
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

