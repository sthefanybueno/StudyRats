import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import * as Network from 'expo-network';

const BUCKET = 'study-rats-files';
const PENDING_KEY = 'pendingUploads';

type PendingUpload = {
  userId: string;
  uri: string;
  name: string;
  mimeType?: string;
};

/**
 * Guarda um upload na fila offline.
 */
async function enqueueUpload(item: PendingUpload): Promise<void> {
  const current = await AsyncStorage.getItem(PENDING_KEY);
  const list: PendingUpload[] = current ? JSON.parse(current) : [];
  list.push(item);
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

/**
 * Processa a fila de uploads pendentes. É chamada sempre que a rede fica disponível.
 */
export async function syncPendingUploads(): Promise<void> {
  const net = await Network.getNetworkStateAsync();
  if (!net.isConnected) return; // ainda offline, nada a fazer

  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return;
  const pending: PendingUpload[] = JSON.parse(raw);
  const remaining: PendingUpload[] = [];

  for (const item of pending) {
    try {
      await uploadFileInternal(item);
    } catch {
      // Keep the item in the queue if upload fails
      remaining.push(item);
    }
  }

  if (remaining.length) {
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
  } else {
    await AsyncStorage.removeItem(PENDING_KEY);
  }
}

/**
 * Função interna que realiza o upload real usando Supabase.
 */
async function uploadFileInternal({ userId, uri, name, mimeType }: PendingUpload): Promise<void> {
  const remotePath = `${userId}/${uuidv4()}-${name}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(remotePath, { uri, type: mimeType ?? 'application/octet-stream' }, { upsert: false });

  if (uploadError) throw uploadError;

  const info = await FileSystem.getInfoAsync(uri) as any;
  const size = (info as any).size ?? 0;

  const { error: dbError } = await supabase.from('files').insert({
    user_id: userId,
    file_path: remotePath,
    file_name: name,
    content_type: mimeType ?? 'application/octet-stream',
    size,
  });

  if (dbError) throw dbError;
}

/**
 * API pública para escolher e enviar um arquivo.
 * Se estiver offline, o upload será enfileirado.
 */
export async function pickAndUploadFileAsync(userId: string) {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false, type: '*/*' });
  if (result.canceled) throw new Error('Seleção de arquivo cancelada');
  const { uri, name, mimeType } = result.assets[0];

  const net = await Network.getNetworkStateAsync();
  const pending: PendingUpload = { userId, uri, name, mimeType };

  if (!net.isConnected) {
    await enqueueUpload(pending);
    return { status: 'queued', details: pending };
  }

  // Online – tenta subir imediatamente
  await uploadFileInternal(pending);
  return { status: 'uploaded', details: pending };
}

/**
 * Baixa um arquivo já armazenado, devolvendo o URI local temporário.
 */
export async function downloadFileAsync(remotePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).download(remotePath);
  if (error) throw error;

  const baseDir = ((FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '');
  const cacheUri = `${baseDir}${remotePath.split('/').pop()}`;
  // Cast data to string for Base64 write (expo-file-system expects a string)
  await FileSystem.writeAsStringAsync(cacheUri, data as unknown as string, { encoding: FileSystem.EncodingType.Base64 });
  return cacheUri;
}

/**
 * Remove arquivo tanto do storage quanto da tabela.
 */
export async function deleteFileAsync(userId: string, remotePath: string) {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([remotePath]);
  if (storageError) throw storageError;

  const { error: dbError } = await supabase.from('files').delete().eq('user_id', userId).eq('file_path', remotePath);
  if (dbError) throw dbError;
}
