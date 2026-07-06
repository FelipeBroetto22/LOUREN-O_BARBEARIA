/**
 * Booking Service — CRUD de agendamentos com Supabase
 */
import { supabase } from '../config/supabase';
import type { Booking, CreateBookingData, Service, TimeSlot } from '../types/booking';

/** Listar todos os serviços ativos */
export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Listar agendamentos do usuário */
export async function getUserBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, service:services(*), barber:profiles!bookings_barber_id_fkey(id, full_name, avatar_url)')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Buscar próximos agendamentos confirmados */
export async function getUpcomingBookings(userId: string): Promise<Booking[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, service:services(*), barber:profiles!bookings_barber_id_fkey(id, full_name, avatar_url)')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(5);

  if (error) throw error;
  return data || [];
}

/** Criar novo agendamento */
export async function createBooking(
  userId: string,
  booking: CreateBookingData
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      barber_id: booking.barber_id || null,
      service_id: booking.service_id,
      scheduled_at: booking.scheduled_at,
      notes: booking.notes || null,
    })
    .select('*, service:services(*)')
    .single();

  if (error) throw error;
  return data;
}

/** Cancelar agendamento */
export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) throw error;
}

/**
 * Buscar horários já agendados para uma data e barbeiro específicos.
 * Se barberId for null, verifica todos os barbeiros (fallback geral).
 */
export async function getBookedSlots(
  date: Date,
  barberId?: string | null
): Promise<string[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let query = supabase
    .from('bookings')
    .select('scheduled_at')
    .eq('status', 'confirmed')
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString());

  if (barberId) {
    query = query.eq('barber_id', barberId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((b) => {
    const d = new Date(b.scheduled_at);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
}

/** Gerar horários disponíveis para uma data */
export function generateTimeSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 9;  // 09:00
  const endHour = 20;   // 20:00
  const interval = 30;  // 30 min

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += interval) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push({
        time: timeStr,
        available: true,
      });
    }
  }

  return slots;
}
