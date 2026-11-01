/** Description: Moves camera photos out of volatile cache into permanent app storage. */
import * as FileSystem from 'expo-file-system';

export async function persistirFotoLocal(uriTemp: string): Promise<string> {
  const dir = new (FileSystem as any).Directory((FileSystem as any).Paths.document, 'fotos_sessao');
  if (!dir.exists) {
    await dir.create();
  }

  const arquivoOrigem = new (FileSystem as any).File(uriTemp);
  const extensao = arquivoOrigem.extension || '.jpg';
  const nomeUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const arquivoDestino = new (FileSystem as any).File(dir, `${nomeUnico}${extensao}`);

  await arquivoOrigem.copy(arquivoDestino);

  return arquivoDestino.uri;
}

