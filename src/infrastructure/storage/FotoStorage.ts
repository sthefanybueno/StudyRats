/** Description: Compresses/resizes camera photos with expo-image-manipulator and moves them out of volatile cache into permanent app storage. */
import * as FileSystem from 'expo-file-system';

export async function comprimirFoto(uriTemp: string, larguraMaxima: number = 1080): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImageManipulator = require('expo-image-manipulator');
    if (typeof ImageManipulator?.manipulateAsync === 'function') {
      const resultado = await ImageManipulator.manipulateAsync(
        uriTemp,
        [{ resize: { width: larguraMaxima } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat?.JPEG ?? 'jpeg',
        }
      );
      if (resultado?.uri) {
        return resultado.uri;
      }
    }
  } catch {
    // Fallback seguro caso o módulo nativo não esteja disponível
  }
  return uriTemp;
}

export async function persistirFotoLocal(uriTemp: string): Promise<string> {
  if (!uriTemp || uriTemp.trim() === '') {
    throw new Error('URI da foto inválida');
  }

  const uriOtimizada = await comprimirFoto(uriTemp);

  const dir = new (FileSystem as any).Directory((FileSystem as any).Paths.document, 'fotos_sessao');
  if (!dir.exists) {
    await dir.create({ idempotent: true });
  }

  const arquivoOrigem = new (FileSystem as any).File(uriOtimizada);
  const extensao = arquivoOrigem.extension || '.jpg';
  const nomeUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const arquivoDestino = new (FileSystem as any).File(dir, `${nomeUnico}${extensao}`);

  await arquivoOrigem.copy(arquivoDestino);

  return arquivoDestino.uri;
}

