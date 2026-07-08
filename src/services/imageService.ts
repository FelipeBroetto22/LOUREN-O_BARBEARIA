/**
 * Image Service — Compressão WebP client-side + Base64
 * (Modificado para usar Base64 para garantir funcionamento sem setup de infraestrutura externa)
 */
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Comprime a imagem para WebP no dispositivo e retorna como string Base64.
 * Ideal para um MVP sem configurar buckets externos.
 */
export async function compressAndUpload(
  imageUri: string,
  userId: string
): Promise<string> {
  const compressed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 600 } }], // Tamanho reduzido para n pesar o banco
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!compressed.base64) {
    throw new Error('Falha ao gerar Base64 da imagem');
  }

  return `data:image/jpeg;base64,${compressed.base64}`;
}

/**
 * Comprime imagem para avatar do perfil e retorna Base64.
 */
export async function uploadAvatar(
  imageUri: string,
  userId: string
): Promise<string> {
  const compressed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 400 } }],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!compressed.base64) {
    throw new Error('Falha ao gerar Base64 do avatar');
  }

  return `data:image/jpeg;base64,${compressed.base64}`;
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
