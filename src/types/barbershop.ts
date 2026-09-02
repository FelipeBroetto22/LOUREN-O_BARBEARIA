/**
 * Barbershop Entities and Types Definition
 * This file contains the core models and enumerations used across the application.
 */

/**
 * Represents the current status of an appointment.
 */
export enum AppointmentStatus {
  /** The appointment has been requested but not yet confirmed */
  PENDING = 'PENDING',
  /** The appointment is confirmed by the professional or system */
  CONFIRMED = 'CONFIRMED',
  /** The appointment was canceled by the user or professional */
  CANCELED = 'CANCELED',
  /** The appointment has successfully taken place */
  COMPLETED = 'COMPLETED',
  /** The user did not show up for the appointment */
  NO_SHOW = 'NO_SHOW',
}

/**
 * Available payment methods within the system.
 */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  CASH = 'CASH',
}

/**
 * Categorization for barbershop services.
 */
export enum ServiceCategory {
  HAIR = 'HAIR',
  BEARD = 'BEARD',
  COMBO = 'COMBO',
  TREATMENT = 'TREATMENT',
  OTHER = 'OTHER',
}

/**
 * Interface representing a barbershop Service.
 */
export interface Service {
  id: string;
  name: string;
  description: string;
  /** Price in local currency (e.g., BRL) */
  price: number;
  /** Duration of the service in minutes */
  durationInMinutes: number;
  isActive: boolean;
  category: ServiceCategory;
}

/**
 * Interface representing a User (Customer).
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  /** Points accumulated for loyalty programs */
  loyaltyPoints: number;
  isVIP: boolean;
}

/**
 * Represents a scheduled break for a professional (e.g., lunch, personal time).
 */
export interface PauseTime {
  /** Start time of the pause in HH:mm format */
  startTime: string;
  /** End time of the pause in HH:mm format */
  endTime: string;
  reason?: string;
}

/**
 * Represents a Professional (Barber) working at the shop.
 */
export interface Professional {
  id: string;
  name: string;
  specialties: ServiceCategory[];
  workHours: {
    /** Start of the shift in HH:mm format */
    start: string;
    /** End of the shift in HH:mm format */
    end: string;
  };
  pauses: PauseTime[];
  isActive: boolean;
  /** Average rating from 1.0 to 5.0 */
  rating: number;
  /** Short biography or description of the professional */
  bio: string;
}

/**
 * Represents a scheduled Appointment linking User, Professional, and Services.
 */
export interface Appointment {
  id: string;
  userId: string;
  professionalId: string;
  /** List of service IDs requested in this appointment */
  serviceIds: string[];
  /** The date of the appointment (normalized to midnight) */
  date: Date;
  /** Start time in HH:mm format */
  startTime: string;
  /** End time in HH:mm format */
  endTime: string;
  status: AppointmentStatus;
  paymentMethod?: PaymentMethod;
  /** Total calculated price of all services */
  totalPrice: number;
  /** Total calculated duration of all services in minutes */
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
  /** Optional notes provided by the user */
  notes?: string;
}

/**
 * Standard API Error Response interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
