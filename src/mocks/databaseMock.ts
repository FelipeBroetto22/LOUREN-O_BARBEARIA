import { 
  Appointment, 
  AppointmentStatus, 
  Professional, 
  Service, 
  ServiceCategory, 
  User 
} from '../types/entities';

export const mockUsers: User[] = [
  {
    id: 'u-001',
    name: 'João Pedro da Silva',
    email: 'joao.pedro@example.com',
    phone: '44999991111',
    createdAt: new Date('2022-01-10T10:00:00Z'),
    updatedAt: new Date('2023-01-15T10:00:00Z'),
    isActive: true,
    loyaltyPoints: 150,
    totalAppointmentsCount: 15,
    preferences: {
      receiveNotifications: true,
      communicationChannel: 'WHATSAPP'
    }
  },
  {
    id: 'u-002',
    name: 'Carlos Almeida',
    email: 'carlos.almeida@example.com',
    phone: '44999992222',
    createdAt: new Date('2022-03-20T10:00:00Z'),
    updatedAt: new Date('2023-05-15T10:00:00Z'),
    isActive: true,
    loyaltyPoints: 80,
    totalAppointmentsCount: 8,
    preferences: {
      preferredProfessionalId: 'p-rychard',
      receiveNotifications: true,
      communicationChannel: 'SMS'
    }
  },
  {
    id: 'u-003',
    name: 'Felipe Marques',
    email: 'felipe.marques@example.com',
    phone: '44999993333',
    createdAt: new Date('2023-01-05T10:00:00Z'),
    updatedAt: new Date('2023-01-05T10:00:00Z'),
    isActive: true,
    loyaltyPoints: 10,
    totalAppointmentsCount: 1,
    preferences: {
      receiveNotifications: false,
      communicationChannel: 'EMAIL'
    }
  }
];

export const mockServices: Service[] = [
  {
    id: 's-hair-01',
    name: 'Corte Clássico',
    description: 'Corte tradicional na tesoura ou máquina.',
    durationInMinutes: 40,
    price: 45.0,
    category: ServiceCategory.HAIR,
    isActive: true,
    pointsEarned: 10
  },
  {
    id: 's-beard-01',
    name: 'Barba Terapia',
    description: 'Barba modelada, toalha quente e massagem facial.',
    durationInMinutes: 30,
    price: 35.0,
    category: ServiceCategory.BEARD,
    isActive: true,
    pointsEarned: 10
  },
  {
    id: 's-combo-01',
    name: 'Corte + Barba VIP',
    description: 'Combo completo de cabelo e barba.',
    durationInMinutes: 70,
    price: 75.0,
    category: ServiceCategory.COMBO,
    isActive: true,
    pointsEarned: 25
  },
  {
    id: 's-treat-01',
    name: 'Pigmentação',
    description: 'Disfarce de fios brancos e volume.',
    durationInMinutes: 45,
    price: 50.0,
    category: ServiceCategory.TREATMENT,
    isActive: true,
    pointsEarned: 15
  },
  {
    id: 's-other-01',
    name: 'Sobrancelha',
    description: 'Alinhamento na navalha.',
    durationInMinutes: 15,
    price: 15.0,
    category: ServiceCategory.OTHER,
    isActive: true,
    pointsEarned: 5
  }
];

export const mockProfessionals: Professional[] = [
  {
    id: 'p-rychard',
    name: 'Rychard Gustavo',
    email: 'rychard.gustavo@lourencobarbearia.com',
    phone: '44988880001',
    bio: 'Especialista em degrade e cortes modernos. Fade perfection.',
    isActive: true,
    specialties: [ServiceCategory.HAIR, ServiceCategory.COMBO, ServiceCategory.TREATMENT],
    workingHours: {
      start: '09:00',
      end: '19:00',
      daysOff: [0], // Domingo
      lunchBreakStart: '12:00',
      lunchBreakEnd: '13:00'
    },
    rating: 4.9,
    totalReviews: 240,
    hireDate: new Date('2021-02-15T09:00:00Z'),
    createdAt: new Date('2021-02-15T09:00:00Z'),
    updatedAt: new Date('2023-01-10T14:00:00Z'),
    comissionRate: 0.5
  },
  {
    id: 'p-rodolfo',
    name: 'Rodolfo Lourenço',
    email: 'rodolfo.lourenco@lourencobarbearia.com',
    phone: '44988880002',
    bio: 'Estilo clássico e mestre na barba com toalha quente.',
    isActive: true,
    specialties: [ServiceCategory.BEARD, ServiceCategory.COMBO, ServiceCategory.OTHER],
    workingHours: {
      start: '09:00',
      end: '19:00',
      daysOff: [0], // Domingo
      lunchBreakStart: '13:00',
      lunchBreakEnd: '14:00'
    },
    rating: 4.8,
    totalReviews: 312,
    hireDate: new Date('2020-05-10T09:00:00Z'),
    createdAt: new Date('2020-05-10T09:00:00Z'),
    updatedAt: new Date('2023-02-20T10:00:00Z'),
    comissionRate: 0.55
  }
];

/**
 * Função utilitária para gerar horários lotados
 */
const generateDenseSchedule = (): Appointment[] => {
  const appointments: Appointment[] = [];
  const baseDate = new Date();
  baseDate.setHours(9, 0, 0, 0); // Começa às 09:00

  // Gerar agenda cheia para os próximos 5 dias
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const currentDay = new Date(baseDate);
    currentDay.setDate(currentDay.getDate() + dayOffset);
    
    // Ignorar domingo
    if (currentDay.getDay() === 0) continue;

    // Rychard Gustavo: Das 09:00 até 12:00 e das 13:00 até 19:00 (slots de 40 min - Corte Clássico)
    for (let hour = 9; hour < 19; hour++) {
      if (hour === 12) continue; // Almoço
      
      const aptDateR = new Date(currentDay);
      aptDateR.setHours(hour, 0, 0, 0);
      
      appointments.push({
        id: `apt-rychard-${dayOffset}-${hour}-1`,
        userId: 'u-002',
        professionalId: 'p-rychard',
        serviceIds: ['s-hair-01'],
        date: aptDateR,
        durationTotalInMinutes: 40,
        totalPrice: 45.0,
        status: AppointmentStatus.CONFIRMED,
        paymentStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Rodolfo Lourenço: Das 09:00 até 13:00 e das 14:00 até 19:00 (slots de 70 min - Combo VIP)
    for (let hour = 9; hour < 18; hour += 2) {
      if (hour === 13) continue; // Almoço
      
      const aptDateRo = new Date(currentDay);
      aptDateRo.setHours(hour, 30, 0, 0);
      
      appointments.push({
        id: `apt-rodolfo-${dayOffset}-${hour}-1`,
        userId: 'u-001',
        professionalId: 'p-rodolfo',
        serviceIds: ['s-combo-01'],
        date: aptDateRo,
        durationTotalInMinutes: 70,
        totalPrice: 75.0,
        status: AppointmentStatus.CONFIRMED,
        paymentStatus: 'PAID',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  return appointments;
};

export const mockAppointments: Appointment[] = generateDenseSchedule();
