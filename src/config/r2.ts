/**
 * Cloudflare R2 Upload Configuration
 * Upload seguro via presigned URLs (sem expor tokens no client).
 */
import { supabase } from './supabase';

// ⚠️ Substituir pela URL pública real do bucket R2
const R2_PUBLIC_URL = process.env.EXPO_PUBLIC_R2_URL || 'YOUR_R2_PUBLIC_URL';

/**
 * Solicita uma presigned URL ao Supabase Edge Function
 * para fazer upload seguro ao Cloudflare R2.
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('r2-presign', {
    body: { fileName, contentType },
  });

  if (error) {
    throw new Error(`Falha ao obter URL de upload: ${error.message}`);
  }

  return data.uploadUrl as string;
}

/**
 * Faz upload de um arquivo diretamente para o R2
 * usando a presigned URL.
 */
export async function uploadToR2(
  presignedUrl: string,
  fileUri: string,
  contentType: string
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload falhou: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }
}

/**
 * Retorna a URL pública da imagem no R2.
 */
export function getPublicUrl(fileName: string): string {
  return `${R2_PUBLIC_URL}/${fileName}`;
}
