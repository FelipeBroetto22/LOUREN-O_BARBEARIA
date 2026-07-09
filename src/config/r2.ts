/**
 * Cloudflare R2 Upload Configuration
 * Upload seguro via presigned URLs (sem expor tokens no client).
 */
import { supabase } from './supabase';

// URL pública do bucket R2 (para leitura das imagens)
const R2_PUBLIC_URL = process.env.EXPO_PUBLIC_R2_URL || 'https://pub-43781c11b3234c378a0c6e332649b4df.r2.dev';

/**
 * Solicita uma presigned URL ao Supabase Edge Function
 * para fazer upload seguro ao Cloudflare R2.
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string
): Promise<string> {
  console.log('[R2] Solicitando presigned URL para:', fileName);

  const { data, error } = await supabase.functions.invoke('r2-presign', {
    body: { fileName, contentType },
  });

  if (error) {
    console.error('[R2] Erro ao obter presigned URL:', error);
    throw new Error(
      `Falha ao obter URL de upload: ${error.message || JSON.stringify(error)}`
    );
  }

  if (!data?.uploadUrl) {
    console.error('[R2] Resposta inválida da Edge Function:', data);
    throw new Error('Edge Function retornou resposta sem uploadUrl. Verifique se a função r2-presign está deployada.');
  }

  console.log('[R2] Presigned URL obtida com sucesso');
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
  console.log('[R2] Iniciando upload do arquivo...');

  // Converter URI local em blob
  const response = await fetch(fileUri);
  if (!response.ok) {
    throw new Error(`Falha ao ler arquivo local: ${response.status}`);
  }
  const blob = await response.blob();

  console.log('[R2] Blob criado, tamanho:', blob.size, 'bytes');

  // Fazer PUT na presigned URL do R2
  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => '');
    console.error('[R2] Upload falhou:', uploadResponse.status, errorText);
    throw new Error(
      `Upload falhou: ${uploadResponse.status} ${uploadResponse.statusText}`
    );
  }

  console.log('[R2] Upload concluído com sucesso!');
}

/**
 * Retorna a URL pública da imagem no R2.
 */
export function getPublicUrl(fileName: string): string {
  const url = `${R2_PUBLIC_URL}/${fileName}`;
  console.log('[R2] URL pública gerada:', url);
  return url;
}
