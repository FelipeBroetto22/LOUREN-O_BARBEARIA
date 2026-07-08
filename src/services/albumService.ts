/**
 * Album Service — CRUD de figurinhas/memórias com Supabase
 */
import { supabase } from '../config/supabase';
import type { AlbumSticker, AlbumPageData, AlbumSlot, CreateStickerData } from '../types/album';
import { stickerDimensions } from '../config/theme';

/** Buscar todas as figurinhas do usuário */
export async function getUserStickers(userId: string): Promise<AlbumSticker[]> {
  const { data, error } = await supabase
    .from('album_stickers')
    .select('*')
    .eq('user_id', userId)
    .order('sticker_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Obter o próximo número de figurinha disponível */
export async function getNextStickerNumber(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('album_stickers')
    .select('sticker_number')
    .eq('user_id', userId)
    .order('sticker_number', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return 1;
  return data[0].sticker_number + 1;
}

/** Adicionar nova figurinha ao álbum */
export async function addSticker(
  userId: string,
  stickerData: CreateStickerData
): Promise<AlbumSticker> {
  const nextNumber = await getNextStickerNumber(userId);
  const pageNumber = Math.ceil(nextNumber / stickerDimensions.perPage);

  const { data, error } = await supabase
    .from('album_stickers')
    .insert({
      user_id: userId,
      image_url: stickerData.image_url,
      caption: stickerData.caption || null,
      booking_id: stickerData.booking_id || null,
      sticker_number: nextNumber,
      page_number: pageNumber,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Remover figurinha do álbum */
export async function removeSticker(stickerId: string): Promise<void> {
  const { error } = await supabase
    .from('album_stickers')
    .delete()
    .eq('id', stickerId);

  if (error) throw error;
}

/** Organizar figurinhas em grade de 100 posições do álbum */
export function organizeIntoPages(stickers: AlbumSticker[]): AlbumPageData[] {
  const totalSlots = 100;
  const slots: AlbumSlot[] = [];

  for (let i = 0; i < totalSlots; i++) {
    const stickerNumber = i + 1;
    const sticker = stickers.find((s) => s.sticker_number === stickerNumber) || null;

    slots.push({
      slotIndex: i,
      pageNumber: 1,
      sticker,
    });
  }

  return [{ pageNumber: 1, slots }];
}

/** Contar total de figurinhas do usuário */
export async function getStickerCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('album_stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count || 0;
}
