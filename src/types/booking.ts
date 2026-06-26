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

export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  scheduled_at: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  /** Populated via join */
  service?: Service;
}

export interface CreateBookingData {
  service_id: string;
  scheduled_at: string;
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
