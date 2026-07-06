/**
 * Tipos do Barbeiro
 */
export interface Barber {
  id: string;
  display_name: string;
  specialty: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  /** Populated via join with profiles */
  avatar_url?: string | null;
}

export interface BlockedSlot {
  id: string;
  barber_id: string;
  blocked_at: string;
  reason: string | null;
  created_at: string;
}

export interface CreateBlockedSlotData {
  blocked_at: string;
  reason?: string;
}
