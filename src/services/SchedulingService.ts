import {
  Appointment,
  AppointmentStatus,
  Professional,
  Service,
} from '../types/barbershop';
import { MOCK_APPOINTMENTS, MOCK_PROFESSIONALS, MOCK_SERVICES } from '../mocks/barbershopData';

/**
 * Custom Error class for Scheduling specific errors
 */
export class SchedulingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchedulingError';
  }
}

/**
 * Service class handling all business logic related to appointments and scheduling.
 */
export class SchedulingService {
  /**
   * Minimum hours required to cancel an appointment without penalty.
   */
  private static readonly MIN_CANCEL_HOURS = 24;

  /**
   * Helper method to convert a time string "HH:mm" to minutes since midnight.
   * @param time Time string in "HH:mm" format
   * @returns Total minutes
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new SchedulingError(`Invalid time format: ${time}. Expected HH:mm.`);
    }
    return hours * 60 + minutes;
  }

  /**
   * Helper method to convert minutes since midnight back to "HH:mm" format.
   * @param minutes Total minutes
   * @returns Time string in "HH:mm"
   */
  private static minutesToTime(minutes: number): string {
    if (minutes < 0 || minutes >= 24 * 60) {
      throw new SchedulingError('Minutes out of bounds for a single day.');
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Calculates the total price and duration for a given list of service IDs.
   *
   * @param serviceIds Array of service identifiers
   * @returns Object containing totalPrice and totalDuration
   * @throws SchedulingError if any service is not found
   */
  public static calculateTotals(serviceIds: string[]): { totalPrice: number; totalDuration: number } {
    if (!serviceIds || serviceIds.length === 0) {
      throw new SchedulingError('At least one service must be selected.');
    }

    let totalPrice = 0;
    let totalDuration = 0;

    for (const id of serviceIds) {
      const service = MOCK_SERVICES.find((s) => s.id === id);
      if (!service) {
        throw new SchedulingError(`Service with ID ${id} not found.`);
      }
      if (!service.isActive) {
        throw new SchedulingError(`Service with ID ${id} is currently inactive and cannot be scheduled.`);
      }
      totalPrice += service.price;
      totalDuration += service.durationInMinutes;
    }

    return { totalPrice, totalDuration };
  }

  /**
   * Checks if a requested time slot is available for a specific professional on a given date.
   * It crosses data with the professional's work hours, pause times (lunch), and existing appointments.
   *
   * @param professionalId ID of the professional
   * @param date Date of the requested appointment
   * @param requestedStartTime Requested start time in "HH:mm"
   * @param durationInMinutes Total duration of the requested services
   * @returns boolean indicating if the slot is available
   */
  public static isSlotAvailable(
    professionalId: string,
    date: Date,
    requestedStartTime: string,
    durationInMinutes: number
  ): boolean {
    const professional = MOCK_PROFESSIONALS.find((p) => p.id === professionalId);
    
    if (!professional) {
      throw new SchedulingError(`Professional with ID ${professionalId} not found.`);
    }

    if (!professional.isActive) {
      throw new SchedulingError(`Professional ${professional.name} is currently not active.`);
    }

    const reqStartMins = this.timeToMinutes(requestedStartTime);
    const reqEndMins = reqStartMins + durationInMinutes;

    // 1. Check if within working hours
    const workStartMins = this.timeToMinutes(professional.workHours.start);
    const workEndMins = this.timeToMinutes(professional.workHours.end);

    if (reqStartMins < workStartMins || reqEndMins > workEndMins) {
      return false; // Outside of working hours
    }

    // 2. Check if overlaps with any pause times (e.g., lunch)
    for (const pause of professional.pauses) {
      const pauseStartMins = this.timeToMinutes(pause.startTime);
      const pauseEndMins = this.timeToMinutes(pause.endTime);

      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      if (reqStartMins < pauseEndMins && reqEndMins > pauseStartMins) {
        return false; // Overlaps with a pause
      }
    }

    // 3. Check if overlaps with existing confirmed or pending appointments for that day
    const targetDateStr = date.toISOString().split('T')[0];
    
    const existingAppointments = MOCK_APPOINTMENTS.filter((app) => {
      const appDateStr = app.date.toISOString().split('T')[0];
      return (
        app.professionalId === professionalId &&
        appDateStr === targetDateStr &&
        [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING].includes(app.status)
      );
    });

    for (const app of existingAppointments) {
      const appStartMins = this.timeToMinutes(app.startTime);
      const appEndMins = this.timeToMinutes(app.endTime);

      if (reqStartMins < appEndMins && reqEndMins > appStartMins) {
        return false; // Overlaps with an existing appointment
      }
    }

    return true; // Slot is free!
  }

  /**
   * Attempts to schedule a new appointment.
   * Validates services, calculates totals, and checks availability before "saving".
   *
   * @param userId The ID of the user requesting the appointment
   * @param professionalId The ID of the chosen professional
   * @param serviceIds Array of chosen service IDs
   * @param date Date of the appointment
   * @param startTime Start time in "HH:mm"
   * @returns The created Appointment object
   */
  public static createAppointment(
    userId: string,
    professionalId: string,
    serviceIds: string[],
    date: Date,
    startTime: string
  ): Appointment {
    // Calculate totals and validate services
    const { totalPrice, totalDuration } = this.calculateTotals(serviceIds);

    // Check availability
    const isAvailable = this.isSlotAvailable(professionalId, date, startTime, totalDuration);
    if (!isAvailable) {
      throw new SchedulingError('The selected time slot is no longer available.');
    }

    // Calculate end time
    const startMins = this.timeToMinutes(startTime);
    const endMins = startMins + totalDuration;
    const endTime = this.minutesToTime(endMins);

    // Construct the new appointment (Simulating DB insert)
    const newAppointment: Appointment = {
      id: `app-${Date.now()}`,
      userId,
      professionalId,
      serviceIds,
      date,
      startTime,
      endTime,
      status: AppointmentStatus.PENDING, // Always starts pending until confirmed
      totalPrice,
      totalDuration,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real scenario, we would save this to a database here
    // For now, we just return the object
    return newAppointment;
  }

  /**
   * Processes a cancellation request based on strict business rules.
   * Requires a minimum notice period (e.g., 24 hours).
   *
   * @param appointmentId The ID of the appointment to cancel
   * @param currentDate The current date and time (useful for mocking/testing)
   * @returns The updated appointment
   */
  public static cancelAppointment(appointmentId: string, currentDate: Date = new Date()): Appointment {
    const appointment = MOCK_APPOINTMENTS.find((app) => app.id === appointmentId);

    if (!appointment) {
      throw new SchedulingError(`Appointment with ID ${appointmentId} not found.`);
    }

    if (
      appointment.status === AppointmentStatus.CANCELED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new SchedulingError(`Cannot cancel an appointment that is already ${appointment.status}.`);
    }

    // Combine appointment date and start time into a single Date object
    const [year, month, day] = appointment.date.toISOString().split('T')[0].split('-');
    const [hours, minutes] = appointment.startTime.split(':');
    
    const appointmentDateTime = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes)
    );

    // Calculate hours difference
    const diffMs = appointmentDateTime.getTime() - currentDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < this.MIN_CANCEL_HOURS) {
      throw new SchedulingError(
        `Cancellations must be made at least ${this.MIN_CANCEL_HOURS} hours in advance. ` +
        `Only ${diffHours.toFixed(1)} hours remaining.`
      );
    }

    // Simulate update
    const updatedAppointment = {
      ...appointment,
      status: AppointmentStatus.CANCELED,
      updatedAt: new Date(),
    };

    return updatedAppointment;
  }
}
