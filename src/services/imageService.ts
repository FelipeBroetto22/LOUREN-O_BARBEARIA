/**
 * Image Service — Compressão WebP client-side + upload para Cloudflare R2
 */
import * as ImageManipulator from 'expo-image-manipulator';
import { getPresignedUploadUrl, uploadToR2, getPublicUrl } from '../config/r2';

/**
 * Comprime a imagem para WebP no dispositivo (max 800px largura, quality 0.7)
 * e faz upload ao Cloudflare R2.
 * 
 * @param imageUri - URI local da imagem (do image picker)
 * @param userId - ID do usuário para organizar pastas no R2
 * @returns URL pública final da imagem no R2
 */
export async function compressAndUpload(
  imageUri: string,
  userId: string
): Promise<string> {
  // 1. Comprimir para WebP (ou JPEG como fallback em iOS)
  const compressed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 800 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.WEBP,
    }
  );

  // 2. Gerar nome único do arquivo
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `albums/${userId}/${timestamp}_${randomSuffix}.webp`;

  // 3. Obter presigned URL do Supabase Edge Function
  const presignedUrl = await getPresignedUploadUrl(fileName, 'image/webp');

  // 4. Fazer upload direto ao R2
  await uploadToR2(presignedUrl, compressed.uri, 'image/webp');

  // 5. Retornar URL pública
  return getPublicUrl(fileName);
}

/**
 * Comprimir imagem apenas (sem upload) — útil para preview.
 */
export async function compressImage(
  imageUri: string,
  maxWidth: number = 400
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: maxWidth } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.WEBP,
    }
  );

  return result.uri;
}
