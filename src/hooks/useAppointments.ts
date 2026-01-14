import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useAppState } from './useAppState';
import { useProjects } from './useProjects';
import { useClients } from './useClients';
import { Service } from '@/types/services';
import { Project, Client } from '@/types';
import { format, parseISO, isToday, startOfToday, startOfWeek, endOfWeek, isWithinInterval, addMinutes } from 'date-fns';
import { AppState } from '@/lib/appState';

export interface Appointment {
  id: string;
  clientId: string;
  serviceId?: string;
  projectId?: string; // Link to project for invoicing
  date: Date;
  startTime: string; // HH:mm format
  duration: number; // minutes
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  createdAt: Date;
  updatedAt: Date;
}

interface AppointmentWithDetails extends Appointment {
  client?: Client;
  service?: Service;
  project?: Project;
}

// Storage key for appointments
const APPOINTMENTS_STORAGE_KEY = 'nimble_appointments';

function generateId(): string {
  return `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getStoredAppointments(): Appointment[] {
  try {
    const stored = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((a: any) => ({
        ...a,
        date: new Date(a.date),
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Error reading appointments:', error);
  }
  return [];
}

function saveStoredAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  } catch (error) {
    console.error('Error saving appointments:', error);
  }
}

/**
 * useAppointments - Appointment management for stationary businesses
 * 
 * Appointments can be linked to projects for invoicing.
 * Access is determined by AppState.
 */
export function useAppointments() {
  const { user } = useAuth();
  const { state, hasAccess, setupProgress } = useAppState();
  const { projects, addProject, updateProject } = useProjects();
  const { clients } = useClients();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Check if user can access appointments (stationary businesses in READY_BASE+)
  const canAccessAppointments = [
    AppState.READY_BASE,
    AppState.TRIAL_PRO,
    AppState.PAID_PRO,
    AppState.ADMIN_PREVIEW,
  ].includes(state);
  
  // Check if this is a stationary business
  const isStationaryBusiness = setupProgress.businessType === 'stationary_appointment';

  // Load appointments on mount
  useEffect(() => {
    if (canAccessAppointments && isStationaryBusiness) {
      const stored = getStoredAppointments();
      setAppointments(stored);
    }
    setLoading(false);
  }, [canAccessAppointments, isStationaryBusiness]);

  // Get appointments with related data
  const appointmentsWithDetails = useMemo((): AppointmentWithDetails[] => {
    return appointments.map(appt => ({
      ...appt,
      client: clients.find(c => c.id === appt.clientId),
      project: appt.projectId ? projects.find(p => p.id === appt.projectId) : undefined,
    }));
  }, [appointments, clients, projects]);

  // Stats calculations
  const today = startOfToday();
  const thisWeekStart = startOfWeek(today);
  const thisWeekEnd = endOfWeek(today);

  const stats = useMemo(() => {
    const scheduled = appointments.filter(a => a.status === 'scheduled');
    const todayAppts = scheduled.filter(a => isToday(a.date));
    const thisWeekAppts = scheduled.filter(a =>
      isWithinInterval(a.date, { start: thisWeekStart, end: thisWeekEnd })
    );
    const upcomingAppts = scheduled.filter(a => a.date >= today);

    return {
      todayCount: todayAppts.length,
      thisWeekCount: thisWeekAppts.length,
      upcomingCount: upcomingAppts.length,
      totalCount: appointments.length,
    };
  }, [appointments, today, thisWeekStart, thisWeekEnd]);

  // Add a new appointment
  const addAppointment = useCallback(async (data: {
    clientId: string;
    serviceId?: string;
    date: Date;
    startTime: string;
    duration: number;
    notes?: string;
    createProject?: boolean; // Option to auto-create a linked project
    serviceName?: string;
    servicePrice?: number;
  }): Promise<Appointment | null> => {
    if (!canAccessAppointments) return null;

    const now = new Date();
    let projectId: string | undefined;

    // Optionally create a linked project for invoicing
    if (data.createProject && data.serviceName) {
      const client = clients.find(c => c.id === data.clientId);
      const project = await addProject({
        title: `${data.serviceName} - ${client?.name || 'Client'}`,
        description: data.notes || '',
        clientId: data.clientId,
        status: 'accepted',
        items: data.servicePrice ? [{
          id: generateId(),
          description: data.serviceName,
          quantity: 1,
          unitPrice: data.servicePrice,
        }] : [],
        scheduledDate: data.date,
        arrivalWindowStart: data.startTime,
      });
      
      if (project) {
        projectId = project.id;
      }
    }

    const newAppointment: Appointment = {
      id: generateId(),
      clientId: data.clientId,
      serviceId: data.serviceId,
      projectId,
      date: data.date,
      startTime: data.startTime,
      duration: data.duration,
      notes: data.notes,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...appointments, newAppointment];
    saveStoredAppointments(updated);
    setAppointments(updated);

    return newAppointment;
  }, [canAccessAppointments, appointments, clients, addProject]);

  // Update an existing appointment
  const updateAppointment = useCallback((
    appointmentId: string, 
    updates: Partial<Omit<Appointment, 'id' | 'createdAt'>>
  ): boolean => {
    if (!canAccessAppointments) return false;

    const index = appointments.findIndex(a => a.id === appointmentId);
    if (index === -1) return false;

    const updatedAppointment = {
      ...appointments[index],
      ...updates,
      updatedAt: new Date(),
    };

    const updated = [...appointments];
    updated[index] = updatedAppointment;
    saveStoredAppointments(updated);
    setAppointments(updated);

    return true;
  }, [canAccessAppointments, appointments]);

  // Delete an appointment
  const deleteAppointment = useCallback((appointmentId: string): boolean => {
    if (!canAccessAppointments) return false;

    const filtered = appointments.filter(a => a.id !== appointmentId);
    if (filtered.length === appointments.length) return false;

    saveStoredAppointments(filtered);
    setAppointments(filtered);

    return true;
  }, [canAccessAppointments, appointments]);

  // Mark appointment as completed
  const completeAppointment = useCallback((appointmentId: string): boolean => {
    return updateAppointment(appointmentId, { status: 'completed' });
  }, [updateAppointment]);

  // Cancel an appointment
  const cancelAppointment = useCallback((appointmentId: string): boolean => {
    return updateAppointment(appointmentId, { status: 'cancelled' });
  }, [updateAppointment]);

  // Get appointments for a specific date
  const getAppointmentsForDate = useCallback((date: Date): AppointmentWithDetails[] => {
    return appointmentsWithDetails.filter(a => 
      format(a.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  }, [appointmentsWithDetails]);

  // Check for conflicts
  const hasConflict = useCallback((
    date: Date, 
    startTime: string, 
    duration: number,
    excludeId?: string
  ): boolean => {
    const dayAppts = appointments.filter(a => 
      a.id !== excludeId && 
      a.status === 'scheduled' &&
      format(a.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    // Parse times and check for overlap
    const [newStartHour, newStartMin] = startTime.split(':').map(Number);
    const newStart = newStartHour * 60 + newStartMin;
    const newEnd = newStart + duration;

    return dayAppts.some(appt => {
      const [apptStartHour, apptStartMin] = appt.startTime.split(':').map(Number);
      const apptStart = apptStartHour * 60 + apptStartMin;
      const apptEnd = apptStart + appt.duration;

      // Check overlap
      return newStart < apptEnd && newEnd > apptStart;
    });
  }, [appointments]);

  // Reset appointments (admin function)
  const resetAppointments = useCallback(() => {
    localStorage.removeItem(APPOINTMENTS_STORAGE_KEY);
    setAppointments([]);
  }, []);

  return {
    appointments: appointmentsWithDetails,
    loading,
    stats,
    canAccessAppointments,
    isStationaryBusiness,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    completeAppointment,
    cancelAppointment,
    getAppointmentsForDate,
    hasConflict,
    resetAppointments,
  };
}
