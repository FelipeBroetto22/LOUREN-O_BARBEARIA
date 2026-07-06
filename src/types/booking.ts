/**
 * Tipos de agendamento (Booking)
 */
export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';

export interface BookingClient {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

export interface Booking {
  id: string;
  user_id: string;
  barber_id: string | null;
  service_id: string;
  scheduled_at: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  /** Populated via join */
  service?: Service;
  /** Populated via join (profile do cliente) */
  client?: BookingClient;
  /** Populated via join (profile do barbeiro) */
  barber?: BookingClient;
}

export interface CreateBookingData {
  service_id: string;
  scheduled_at: string;
  barber_id?: string;
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
