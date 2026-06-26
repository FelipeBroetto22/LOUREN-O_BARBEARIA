/**
 * Tipos do Álbum de Memórias (Figurinhas)
 */
export interface AlbumSticker {
  id: string;
  user_id: string;
  booking_id: string | null;
  image_url: string;
  caption: string | null;
  sticker_number: number;
  page_number: number;
  taken_at: string;
  created_at: string;
}

export interface CreateStickerData {
  image_url: string;
  caption?: string;
  booking_id?: string;
}

/** Representação de um slot no álbum (preenchido ou vazio) */
export interface AlbumSlot {
  slotIndex: number;
  pageNumber: number;
  sticker: AlbumSticker | null;
}

/** Página completa do álbum com 6 slots */
export interface AlbumPageData {
  pageNumber: number;
  slots: AlbumSlot[];
}
