import { 
  Appointment, 
  AppointmentStatus, 
  BusinessError, 
  Professional, 
  Service, 
  User 
} from '../types/entities';
import { 
  mockAppointments, 
  mockProfessionals, 
  mockServices, 
  mockUsers 
} from '../mocks/databaseMock';

/**
 * @class SchedulingService
 * @description Classe central da camada de serviços responsável pela orquestração
 * de todas as regras de negócio envoltas no ecossistema de agendamentos da barbearia.
 * Implementa validações rigorosas para garantir a integridade dos dados e prevenir 
 * sobreposições e agendamentos indevidos.
 */
export class SchedulingService {
  private appointmentsDB: Appointment[];
  private professionalsDB: Professional[];
  private servicesDB: Service[];
  private usersDB: User[];

  /**
   * Construtor da classe SchedulingService.
   * Inicializa o banco de dados em memória utilizando os mocks.
   */
  constructor() {
    this.appointmentsDB = [...mockAppointments];
    this.professionalsDB = [...mockProfessionals];
    this.servicesDB = [...mockServices];
    this.usersDB = [...mockUsers];
  }

  /**
   * @method calculateTotalTimeAndPrice
   * @description Analisa uma lista de IDs de serviços, validando a existência e atividade
   * de cada um. Computa e retorna o tempo total necessário (em minutos) e o valor total a ser pago.
   * 
   * @param {string[]} serviceIds - Array de IDs dos serviços a serem processados.
   * @returns {{ totalDuration: number; totalPrice: number }} Objeto contendo duração e preço.
   * @throws {BusinessError} Se o array estiver vazio, um serviço não existir ou estiver inativo.
   */
  public calculateTotalTimeAndPrice(serviceIds: string[]): { totalDuration: number; totalPrice: number } {
    if (!serviceIds || serviceIds.length === 0) {
      throw new BusinessError('É obrigatório selecionar pelo menos um serviço.', 'EMPTY_SERVICE_LIST');
    }

    let totalDuration = 0;
    let totalPrice = 0;

    for (const id of serviceIds) {
      const service = this.servicesDB.find(s => s.id === id);
      
      if (!service) {
        throw new BusinessError(`Serviço referenciado (${id}) não encontrado na base de dados.`, 'SERVICE_NOT_FOUND');
      }
      if (!service.isActive) {
        throw new BusinessError(`Serviço ${service.name} não está ativo no momento.`, 'SERVICE_INACTIVE');
      }

      totalDuration += service.durationInMinutes;
      totalPrice += service.price;
    }

    return { totalDuration, totalPrice };
  }

  /**
   * @method checkScheduleConflict
   * @description Varre a agenda do profissional fornecido para o dia correspondente 
   * à data solicitada, verificando se o slot de tempo desejado (baseado na duração total) 
   * cruza com algum outro agendamento ativo.
   * 
   * @param {string} professionalId - O identificador único do profissional.
   * @param {Date} targetDate - A data e hora exatas de início do agendamento pretendido.
   * @param {number} durationInMinutes - A duração total do(s) serviço(s) em minutos.
   * @returns {boolean} `true` caso exista algum conflito, `false` caso o slot esteja livre.
   * @throws {BusinessError} Caso o profissional não exista na base.
   */
  public checkScheduleConflict(professionalId: string, targetDate: Date, durationInMinutes: number): boolean {
    const professional = this.professionalsDB.find(p => p.id === professionalId);
    if (!professional) {
      throw new BusinessError('O profissional solicitado não existe no sistema.', 'PROFESSIONAL_NOT_FOUND');
    }

    const startDesiredMs = targetDate.getTime();
    const endDesiredMs = startDesiredMs + (durationInMinutes * 60 * 1000);

    // Filtramos apenas os agendamentos deste profissional para a mesma data (desconsiderando cancelados).
    const dailyAppointments = this.appointmentsDB.filter(apt => {
      const isSamePro = apt.professionalId === professionalId;
      const isActiveStatus = apt.status !== AppointmentStatus.CANCELED && apt.status !== AppointmentStatus.NO_SHOW;
      const isSameDate = apt.date.toDateString() === targetDate.toDateString();
      
      return isSamePro && isActiveStatus && isSameDate;
    });

    for (const apt of dailyAppointments) {
      const aptStartMs = apt.date.getTime();
      const aptEndMs = aptStartMs + (apt.durationTotalInMinutes * 60 * 1000);

      // Regra matemática para intersecção de intervalos (se houver cruzamento em qualquer ponto)
      // O evento A e o evento B se cruzam se StartA < EndB e EndA > StartB.
      if (startDesiredMs < aptEndMs && endDesiredMs > aptStartMs) {
        return true; // Há um conflito evidente
      }
    }

    return false; // Sem conflito
  }

  /**
   * @method validateWorkingHours
   * @description Verifica rigorosamente se a data/hora do agendamento cai dentro do 
   * expediente do profissional, considerando horas trabalhadas, dias de folga e horário de almoço.
   * 
   * @param {Professional} professional - A entidade do profissional carregada.
   * @param {Date} date - Data e hora pretendida.
   * @param {number} durationInMinutes - Duração total.
   * @throws {BusinessError} Se estiver fora do expediente ou bater com intervalo/folga.
   */
  private validateWorkingHours(professional: Professional, date: Date, durationInMinutes: number): void {
    const dayOfWeek = date.getDay();
    if (professional.workingHours.daysOff.includes(dayOfWeek)) {
      throw new BusinessError('O barbeiro não trabalha neste dia da semana.', 'DAY_OFF_CONFLICT');
    }

    const reqStartTotalMins = (date.getHours() * 60) + date.getMinutes();
    const reqEndTotalMins = reqStartTotalMins + durationInMinutes;

    // Converte Start/End do expediente para minutos
    const [wStartH, wStartM] = professional.workingHours.start.split(':').map(Number);
    const workStartMins = (wStartH * 60) + wStartM;

    const [wEndH, wEndM] = professional.workingHours.end.split(':').map(Number);
    const workEndMins = (wEndH * 60) + wEndM;

    if (reqStartTotalMins < workStartMins || reqEndTotalMins > workEndMins) {
      throw new BusinessError('Horário pretendido excede o expediente do barbeiro.', 'OUT_OF_WORK_HOURS');
    }

    // Verifica intervalo de almoço, se existir
    if (professional.workingHours.lunchBreakStart && professional.workingHours.lunchBreakEnd) {
      const [lStartH, lStartM] = professional.workingHours.lunchBreakStart.split(':').map(Number);
      const lunchStartMins = (lStartH * 60) + lStartM;

      const [lEndH, lEndM] = professional.workingHours.lunchBreakEnd.split(':').map(Number);
      const lunchEndMins = (lEndH * 60) + lEndM;

      // Se cruzar com o horário de almoço
      if (reqStartTotalMins < lunchEndMins && reqEndTotalMins > lunchStartMins) {
        throw new BusinessError('O horário cruza com o intervalo de almoço do barbeiro.', 'LUNCH_BREAK_CONFLICT');
      }
    }
  }

  /**
   * @method createAppointment
   * @description Ponto de entrada para criação de novo agendamento, unificando as validações.
   */
  public createAppointment(userId: string, professionalId: string, serviceIds: string[], date: Date): Appointment {
    const user = this.usersDB.find(u => u.id === userId);
    if (!user || !user.isActive) throw new BusinessError('Usuário não apto para agendar.', 'INVALID_USER');

    const professional = this.professionalsDB.find(p => p.id === professionalId);
    if (!professional || !professional.isActive) throw new BusinessError('Barbeiro inativo ou ausente.', 'INVALID_PRO');

    const { totalDuration, totalPrice } = this.calculateTotalTimeAndPrice(serviceIds);

    this.validateWorkingHours(professional, date, totalDuration);

    if (this.checkScheduleConflict(professionalId, date, totalDuration)) {
      throw new BusinessError('O horário escolhido já está ocupado.', 'SCHEDULE_CONFLICT');
    }

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      userId,
      professionalId,
      serviceIds,
      date,
      durationTotalInMinutes: totalDuration,
      totalPrice,
      status: AppointmentStatus.CONFIRMED,
      paymentStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.appointmentsDB.push(newAppointment);
    return newAppointment;
  }

  /**
   * @method cancelAppointment
   * @description Aplica regras rigorosas de cancelamento. Apenas agendamentos no futuro e com 
   * no mínimo 3 horas de antecedência podem ser cancelados sem multa.
   */
  public cancelAppointment(appointmentId: string, reason: string): Appointment {
    const appointment = this.appointmentsDB.find(a => a.id === appointmentId);
    if (!appointment) throw new BusinessError('Agendamento não encontrado.', 'NOT_FOUND');

    if (appointment.status !== AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.PENDING) {
      throw new BusinessError('Agendamento não está em um estado passível de cancelamento.', 'INVALID_STATE');
    }

    const hoursUntilAppointment = (appointment.date.getTime() - Date.now()) / (1000 * 60 * 60);

    // Regra de cancelamento com 3 horas de antecedência mínima
    if (hoursUntilAppointment < 3) {
      throw new BusinessError('Cancelamentos precisam de no mínimo 3h de antecedência.', 'CANCELLATION_POLICY_VIOLATION');
    }

    appointment.status = AppointmentStatus.CANCELED;
    appointment.cancellationReason = reason;
    appointment.updatedAt = new Date();

    return appointment;
  }
}
