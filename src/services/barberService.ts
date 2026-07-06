/**
 * Barber Service — Operações do painel do barbeiro
 */
import { supabase } from '../config/supabase';
import type { Barber, BlockedSlot, CreateBlockedSlotData } from '../types/barber';
import type { Booking } from '../types/booking';
import type { AlbumSticker } from '../types/album';

/** Listar todos os barbeiros ativos */
export async function getBarbers(): Promise<Barber[]> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*, profiles!barbers_id_fkey(avatar_url)')
    .eq('is_active', true)
    .order('display_name', { ascending: true });

  if (error) throw error;

  return (data || []).map((b: any) => ({
    ...b,
    avatar_url: b.profiles?.avatar_url ?? null,
  }));
}

/** Buscar um barbeiro por ID */
export async function getBarberById(barberId: string): Promise<Barber | null> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*, profiles!barbers_id_fkey(avatar_url)')
    .eq('id', barberId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return { ...data, avatar_url: data.profiles?.avatar_url ?? null };
}

/** Buscar agendamentos do barbeiro para uma data específica */
export async function getBarberBookings(
  barberId: string,
  date?: Date
): Promise<Booking[]> {
  let query = supabase
    .from('bookings')
    .select(
      `*,
       service:services(*),
       client:profiles!bookings_user_id_fkey(id, full_name, phone, avatar_url)`
    )
    .eq('barber_id', barberId)
    .neq('status', 'cancelled')
    .order('scheduled_at', { ascending: true });

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query = query
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Remarcar agendamento (barbeiro) */
export async function rescheduleBooking(
  bookingId: string,
  newScheduledAt: string
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ scheduled_at: newScheduledAt })
    .eq('id', bookingId)
    .select('*, service:services(*)')
    .single();

  if (error) throw error;
  return data;
}

/** Marcar agendamento como concluído */
export async function completeBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId);

  if (error) throw error;
}

/** Bloquear horário */
export async function blockSlot(
  barberId: string,
  slot: CreateBlockedSlotData
): Promise<BlockedSlot> {
  const { data, error } = await supabase
    .from('blocked_slots')
    .insert({
      barber_id: barberId,
      blocked_at: slot.blocked_at,
      reason: slot.reason || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Desbloquear horário */
export async function unblockSlot(slotId: string): Promise<void> {
  const { error } = await supabase
    .from('blocked_slots')
    .delete()
    .eq('id', slotId);

  if (error) throw error;
}

/** Buscar slots bloqueados de um barbeiro em uma data */
export async function getBlockedSlots(
  barberId: string,
  date: Date
): Promise<string[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('blocked_slots')
    .select('blocked_at')
    .eq('barber_id', barberId)
    .gte('blocked_at', start.toISOString())
    .lte('blocked_at', end.toISOString());

  if (error) throw error;

  return (data || []).map((s) => {
    const d = new Date(s.blocked_at);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
}

/** Buscar todos os blocked_slots do barbeiro com objetos completos (para gerenciar) */
export async function getBlockedSlotsForDay(
  barberId: string,
  date: Date
): Promise<BlockedSlot[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('blocked_slots')
    .select('*')
    .eq('barber_id', barberId)
    .gte('blocked_at', start.toISOString())
    .lte('blocked_at', end.toISOString())
    .order('blocked_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Ver álbum de um cliente específico (usado pelo barbeiro) */
export async function getClientAlbum(clientId: string): Promise<AlbumSticker[]> {
  const { data, error } = await supabase
    .from('album_stickers')
    .select('*')
    .eq('user_id', clientId)
    .order('sticker_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Listar clientes distintos atendidos pelo barbeiro */
export async function getBarberClients(barberId: string): Promise<
  Array<{ id: string; full_name: string; phone: string | null; avatar_url: string | null; last_booking: string }>
> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `scheduled_at,
       client:profiles!bookings_user_id_fkey(id, full_name, phone, avatar_url)`
    )
    .eq('barber_id', barberId)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false });

  if (error) throw error;

  // Deduplicate by client id, keep the most recent booking date
  const map = new Map<
    string,
    { id: string; full_name: string; phone: string | null; avatar_url: string | null; last_booking: string }
  >();

  for (const row of data || []) {
    const client = (row as any).client;
    if (!client) continue;
    if (!map.has(client.id)) {
      map.set(client.id, {
        id: client.id,
        full_name: client.full_name,
        phone: client.phone,
        avatar_url: client.avatar_url,
        last_booking: row.scheduled_at,
      });
    }
  }

  return Array.from(map.values());
}

/** Atualizar dados do barbeiro */
export async function updateBarberProfile(
  barberId: string,
  updates: Partial<Pick<Barber, 'display_name' | 'specialty' | 'bio'>>
): Promise<void> {
  const { error } = await supabase
    .from('barbers')
    .update(updates)
    .eq('id', barberId);

  if (error) throw error;
}
