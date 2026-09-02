/**
 * src/types/entities.ts
 * Este arquivo contém as definições de tipagem centrais para as entidades
 * do domínio da barbearia, definindo as regras estruturais e de dados.
 */

/**
 * Representa os possíveis status de um agendamento.
 */
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED',
}

/**
 * Categorias de serviços prestados na barbearia.
 */
export enum ServiceCategory {
  HAIR = 'HAIR',
  BEARD = 'BEARD',
  COMBO = 'COMBO',
  TREATMENT = 'TREATMENT',
  OTHER = 'OTHER',
}

/**
 * Perfil de um cliente (User) do sistema.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  preferences: {
    preferredProfessionalId?: string;
    receiveNotifications: boolean;
    communicationChannel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  };
  loyaltyPoints: number;
  totalAppointmentsCount: number;
  lastVisit?: Date;
  notes?: string;
}

/**
 * Expediente de trabalho padrão de um profissional.
 */
export interface WorkingHours {
  start: string; // Formato HH:MM
  end: string;   // Formato HH:MM
  daysOff: number[]; // 0 = Domingo, 1 = Segunda, etc.
  lunchBreakStart?: string; // Formato HH:MM
  lunchBreakEnd?: string; // Formato HH:MM
}

/**
 * Perfil de um barbeiro/profissional da barbearia.
 */
export interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl?: string;
  isActive: boolean;
  specialties: ServiceCategory[];
  workingHours: WorkingHours;
  rating: number;
  totalReviews: number;
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;
  comissionRate: number; // Porcentagem de comissão (ex: 0.4 para 40%)
}

/**
 * Estrutura de um serviço prestado na barbearia.
 */
export interface Service {
  id: string;
  name: string;
  description: string;
  durationInMinutes: number; // Duração estimada para reserva
  price: number;
  category: ServiceCategory;
  isActive: boolean;
  pointsEarned: number; // Pontos de fidelidade ganhos ao realizar
  pointsCost?: number; // Custo em pontos para resgate gratuito
  imageUrl?: string;
  materialsUsed?: string[];
}

/**
 * Estrutura de um agendamento (Appointment).
 */
export interface Appointment {
  id: string;
  userId: string;
  professionalId: string;
  serviceIds: string[]; // Pode envolver mais de um serviço
  date: Date; // Data e hora do início do agendamento
  durationTotalInMinutes: number;
  totalPrice: number;
  status: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
  rescheduledTo?: string; // ID do novo agendamento caso remarcado
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date; // Data em que o serviço foi finalizado
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
}

/**
 * Erro de domínio para lançamento de exceções nas regras de negócio.
 */
export class BusinessError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BusinessError';
  }
}
