import {
  Appointment,
  AppointmentStatus,
  PaymentMethod,
  Professional,
  Service,
  ServiceCategory,
  User,
} from '../types/barbershop';

/**
 * Mock Data: Services
 * Comprehensive list of services offered by the barbershop.
 */
export const MOCK_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Corte Clássico',
    description: 'Corte tradicional feito com tesoura e máquina.',
    price: 45.0,
    durationInMinutes: 40,
    isActive: true,
    category: ServiceCategory.HAIR,
  },
  {
    id: 'srv-2',
    name: 'Corte Degradê (Fade)',
    description: 'Corte moderno com transição suave nas laterais.',
    price: 55.0,
    durationInMinutes: 50,
    isActive: true,
    category: ServiceCategory.HAIR,
  },
  {
    id: 'srv-3',
    name: 'Barba Terapia',
    description: 'Aparo e alinhamento com toalha quente e massagem.',
    price: 35.0,
    durationInMinutes: 30,
    isActive: true,
    category: ServiceCategory.BEARD,
  },
  {
    id: 'srv-4',
    name: 'Combo: Corte + Barba',
    description: 'O serviço completo para cabelo e barba com desconto.',
    price: 80.0,
    durationInMinutes: 80,
    isActive: true,
    category: ServiceCategory.COMBO,
  },
  {
    id: 'srv-5',
    name: 'Sobrancelha',
    description: 'Limpeza e alinhamento das sobrancelhas.',
    price: 15.0,
    durationInMinutes: 15,
    isActive: true,
    category: ServiceCategory.OTHER,
  },
  {
    id: 'srv-6',
    name: 'Platinado',
    description: 'Descoloração global dos fios até o tom platinado.',
    price: 150.0,
    durationInMinutes: 120,
    isActive: true,
    category: ServiceCategory.TREATMENT,
  },
];

/**
 * Mock Data: Professionals
 * The team of barbers including Rychard Gustavo and Rodolfo Lourenço.
 * Working hours: 09:00 to 19:00 with a lunch break from 12:00 to 13:00.
 */
export const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: 'prof-rychard',
    name: 'Rychard Gustavo',
    specialties: [ServiceCategory.HAIR, ServiceCategory.BEARD, ServiceCategory.COMBO],
    workHours: { start: '09:00', end: '19:00' },
    pauses: [{ startTime: '12:00', endTime: '13:00', reason: 'Almoço' }],
    isActive: true,
    rating: 4.9,
    bio: 'Especialista em cortes modernos e fade perfection. Mais de 5 anos de experiência transformando visuais.',
  },
  {
    id: 'prof-rodolfo',
    name: 'Rodolfo Lourenço',
    specialties: [ServiceCategory.HAIR, ServiceCategory.BEARD, ServiceCategory.TREATMENT, ServiceCategory.COMBO],
    workHours: { start: '09:00', end: '19:00' },
    pauses: [{ startTime: '13:00', endTime: '14:00', reason: 'Almoço' }],
    isActive: true,
    rating: 5.0,
    bio: 'Mestre barbeiro focado em barboterapia e cortes clássicos. A excelência no atendimento é a marca registrada.',
  },
];

/**
 * Mock Data: Users (Customers)
 */
export const MOCK_USERS: User[] = [
  {
    id: 'usr-1',
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@email.com',
    phone: '11999999999',
    createdAt: new Date('2023-01-15T10:00:00Z'),
    updatedAt: new Date('2023-01-15T10:00:00Z'),
    loyaltyPoints: 120,
    isVIP: false,
  },
  {
    id: 'usr-2',
    firstName: 'Marcos',
    lastName: 'Oliveira',
    email: 'marcos.oli@email.com',
    phone: '11988888888',
    createdAt: new Date('2022-11-20T14:30:00Z'),
    updatedAt: new Date('2023-05-10T09:15:00Z'),
    loyaltyPoints: 500,
    isVIP: true,
  },
];

/**
 * Mock Data: Appointments
 * A fully booked agenda for a specific week to test the SchedulingService.
 * Let's assume dates are based on a specific week in September 2026 for context.
 */
const BASE_DATE = '2026-09-07T00:00:00Z'; // A Monday
const createMockDate = (offsetDays: number) => {
  const date = new Date(BASE_DATE);
  date.setDate(date.getDate() + offsetDays);
  return date;
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  // Rychard's Appointments - Monday
  {
    id: 'app-1',
    userId: 'usr-1',
    professionalId: 'prof-rychard',
    serviceIds: ['srv-4'], // Combo (80 mins)
    date: createMockDate(0), // Monday
    startTime: '09:00',
    endTime: '10:20',
    status: AppointmentStatus.CONFIRMED,
    paymentMethod: PaymentMethod.PIX,
    totalPrice: 80.0,
    totalDuration: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'app-2',
    userId: 'usr-2',
    professionalId: 'prof-rychard',
    serviceIds: ['srv-2'], // Fade (50 mins)
    date: createMockDate(0),
    startTime: '10:30',
    endTime: '11:20',
    status: AppointmentStatus.COMPLETED,
    totalPrice: 55.0,
    totalDuration: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Rodolfo's Appointments - Monday
  {
    id: 'app-3',
    userId: 'usr-1',
    professionalId: 'prof-rodolfo',
    serviceIds: ['srv-6'], // Platinado (120 mins)
    date: createMockDate(0),
    startTime: '09:30',
    endTime: '11:30',
    status: AppointmentStatus.CONFIRMED,
    totalPrice: 150.0,
    totalDuration: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'app-4',
    userId: 'usr-2',
    professionalId: 'prof-rodolfo',
    serviceIds: ['srv-1', 'srv-5'], // Clássico + Sobrancelha (55 mins)
    date: createMockDate(0),
    startTime: '14:00',
    endTime: '14:55',
    status: AppointmentStatus.PENDING,
    totalPrice: 60.0,
    totalDuration: 55,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ... Adding a few more to simulate a busy week
  {
    id: 'app-5',
    userId: 'usr-1',
    professionalId: 'prof-rychard',
    serviceIds: ['srv-3'], // Barba (30 mins)
    date: createMockDate(1), // Tuesday
    startTime: '17:00',
    endTime: '17:30',
    status: AppointmentStatus.CONFIRMED,
    totalPrice: 35.0,
    totalDuration: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'app-6',
    userId: 'usr-2',
    professionalId: 'prof-rodolfo',
    serviceIds: ['srv-4'], // Combo (80 mins)
    date: createMockDate(2), // Wednesday
    startTime: '15:00',
    endTime: '16:20',
    status: AppointmentStatus.CONFIRMED,
    totalPrice: 80.0,
    totalDuration: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];
