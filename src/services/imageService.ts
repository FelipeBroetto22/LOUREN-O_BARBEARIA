/**
 * Image Service — Compressão client-side + Upload ao Cloudflare R2
 * Comprime a imagem no dispositivo e faz upload via presigned URL ao R2.
 * Salva apenas a URL pública no banco (nunca Base64).
 */
import * as ImageManipulator from 'expo-image-manipulator';
import { getPresignedUploadUrl, uploadToR2, getPublicUrl } from '../config/r2';

/**
 * Comprime a imagem para JPEG no dispositivo e faz upload ao R2.
 * Retorna a URL pública da imagem no bucket.
 *
 * Usado para figurinhas do álbum de memórias.
 */
export async function compressAndUpload(
  imageUri: string,
  userId: string
): Promise<string> {
  // 1. Comprimir a imagem localmente
  const compressed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 600 } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // 2. Gerar nome único para o arquivo no R2
  const timestamp = Date.now();
  const fileName = `stickers/${userId}-${timestamp}.jpg`;

  // 3. Obter presigned URL via Edge Function
  const presignedUrl = await getPresignedUploadUrl(fileName, 'image/jpeg');

  // 4. Upload do arquivo comprimido ao R2
  await uploadToR2(presignedUrl, compressed.uri, 'image/jpeg');

  // 5. Retornar a URL pública para salvar no banco
  return getPublicUrl(fileName);
}

/**
 * Comprime imagem para avatar do perfil e faz upload ao R2.
 * Retorna a URL pública da imagem no bucket.
 */
export async function uploadAvatar(
  imageUri: string,
  userId: string
): Promise<string> {
  // 1. Comprimir a imagem (menor que figurinha — é só avatar)
  const compressed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 400 } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // 2. Nome fixo por usuário (sobrescreve o avatar anterior)
  const timestamp = Date.now();
  const fileName = `avatars/${userId}-${timestamp}.jpg`;

  // 3. Obter presigned URL via Edge Function
  const presignedUrl = await getPresignedUploadUrl(fileName, 'image/jpeg');

  // 4. Upload ao R2
  await uploadToR2(presignedUrl, compressed.uri, 'image/jpeg');

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
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
}
