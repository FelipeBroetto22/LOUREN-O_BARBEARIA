/**
 * Tipos gerados do Supabase (simplificados).
 * Para tipos completos, gere com: npx supabase gen types typescript
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          duration_minutes: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          duration_minutes?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          duration_minutes?: number;
          is_active?: boolean;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          service_id: string;
          scheduled_at: string;
          status: 'confirmed' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_id: string;
          scheduled_at: string;
          status?: 'confirmed' | 'completed' | 'cancelled';
          notes?: string | null;
        };
        Update: {
          service_id?: string;
          scheduled_at?: string;
          status?: 'confirmed' | 'completed' | 'cancelled';
          notes?: string | null;
        };
      };
      album_stickers: {
        Row: {
          id: string;
          user_id: string;
          booking_id: string | null;
          image_url: string;
          caption: string | null;
          sticker_number: number;
          page_number: number;
          taken_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          booking_id?: string | null;
          image_url: string;
          caption?: string | null;
          sticker_number: number;
          page_number?: number;
        };
        Update: {
          image_url?: string;
          caption?: string | null;
          sticker_number?: number;
          page_number?: number;
        };
      };
    };
  };
}
