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

/** Organizar figurinhas por ano (cresce dinamicamente de 10 em 10) */
export function organizeIntoPages(stickers: AlbumSticker[]): AlbumPageData[] {
  // Extrair anos (garantir pelo menos o ano atual)
  const years = Array.from(new Set(stickers.map(s => {
    const date = new Date(s.taken_at || s.created_at);
    return date.getFullYear();
  }))).sort((a, b) => a - b);
  
  if (years.length === 0) {
    years.push(new Date().getFullYear());
  }
  
  const pages: AlbumPageData[] = [];
  
  years.forEach(year => {
    const yearStickers = stickers.filter(s => {
      const date = new Date(s.taken_at || s.created_at);
      return date.getFullYear() === year;
    });
    
    // Começa com 10 slots. Se encher, cresce para 20, 30, etc.
    // O +1 garante que, ao chegar em 10 figurinhas, ele já pule para 20 slots para ter espaço vazio.
    const totalSlotsForThisYear = Math.max(10, Math.ceil((yearStickers.length + 1) / 10) * 10);
    
    const slots: AlbumSlot[] = [];
    
    for (let i = 0; i < totalSlotsForThisYear; i++) {
      const sticker = yearStickers[i] || null;
      slots.push({
        slotIndex: i,
        pageNumber: year, // Usamos o ano como número da página
        sticker,
      });
    }
    
    pages.push({ pageNumber: year, slots });
  });

  return pages;
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
