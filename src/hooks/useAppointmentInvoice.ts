import { useState, useCallback, useEffect, useMemo } from 'react';
import { useInvoices, Invoice } from './useInvoices';
import { useBusinessProfile } from './useBusinessProfile';
import { useAppState } from './useAppState';
import { AppState } from '@/lib/appState';
import { LineItem } from '@/types';
import { Service } from '@/types/services';
import { toast } from 'sonner';

const ACTIVE_APPOINTMENT_KEY = 'nimble_active_appointment';

/**
 * Hook for managing appointment-linked invoices for stationary businesses.
 * 
 * Provides:
 * - Active appointment tracking
 * - Invoice creation for appointments
 * - Adding services to appointment invoices
 */
export function useAppointmentInvoice() {
  const { invoices, addInvoice, updateInvoice, refetch } = useInvoices();
  const { profile } = useBusinessProfile();
  const { state, setupProgress } = useAppState();
  
  const [activeAppointmentId, setActiveAppointmentIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_APPOINTMENT_KEY);
    } catch {
      return null;
    }
  });

  // Check if user can add to invoices based on AppState
  const canAddToInvoice = useMemo(() => {
    return [
      AppState.READY_BASE,
      AppState.TRIAL_PRO,
      AppState.PAID_PRO,
      AppState.ADMIN_PREVIEW,
    ].includes(state);
  }, [state]);

  // Is this a stationary business?
  const isStationaryBusiness = setupProgress.businessType === 'stationary_appointment';

  // Persist active appointment to localStorage
  const setActiveAppointmentId = useCallback((id: string | null) => {
    setActiveAppointmentIdState(id);
    try {
      if (id) {
        localStorage.setItem(ACTIVE_APPOINTMENT_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_APPOINTMENT_KEY);
      }
    } catch (e) {
      console.error('Failed to persist active appointment:', e);
    }
  }, []);

  // Get all appointment-linked invoices
  const appointmentInvoices = useMemo(() => {
    return invoices.filter(inv => inv.contextType === 'appointment');
  }, [invoices]);

  // Get invoice for a specific appointment
  const getInvoiceForAppointment = useCallback((appointmentId: string): Invoice | undefined => {
    return invoices.find(
      inv => inv.contextType === 'appointment' && inv.contextId === appointmentId
    );
  }, [invoices]);

  // Get active invoice for the current active appointment
  const activeInvoice = useMemo(() => {
    if (!activeAppointmentId) return null;
    return getInvoiceForAppointment(activeAppointmentId) || null;
  }, [activeAppointmentId, getInvoiceForAppointment]);

  // Generate next invoice number
  const generateInvoiceNumber = useCallback(() => {
    const prefix = profile.invoicePrefix || 'INV-';
    const existingNumbers = invoices
      .map(inv => {
        const match = inv.invoiceNumber.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `${prefix}${String(maxNumber + 1).padStart(4, '0')}`;
  }, [invoices, profile.invoicePrefix]);

  // Create a new invoice for an appointment
  const createInvoiceForAppointment = useCallback(async (
    appointmentId: string, 
    clientId: string,
    initialItems?: LineItem[]
  ): Promise<Invoice | null> => {
    if (!canAddToInvoice) {
      toast.error('Complete setup to create invoices');
      return null;
    }

    // Check if invoice already exists
    const existing = getInvoiceForAppointment(appointmentId);
    if (existing) {
      return existing;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const newInvoice = await addInvoice({
      clientId,
      invoiceNumber: generateInvoiceNumber(),
      items: initialItems || [],
      status: 'draft',
      dueDate,
      contextType: 'appointment',
      contextId: appointmentId,
    });

    if (newInvoice) {
      toast.success('Invoice created for appointment');
    }

    return newInvoice;
  }, [canAddToInvoice, addInvoice, generateInvoiceNumber, getInvoiceForAppointment]);

  // Add a service to the active appointment's invoice
  const addServiceToAppointmentInvoice = useCallback(async (service: Service): Promise<boolean> => {
    if (!canAddToInvoice) {
      toast.error('Complete setup to add services to invoices');
      return false;
    }

    if (!activeAppointmentId) {
      toast.error('No active appointment selected', {
        description: 'Select an appointment from the calendar first.',
      });
      return false;
    }

    const invoice = getInvoiceForAppointment(activeAppointmentId);

    // If no invoice exists for this appointment
    if (!invoice) {
      toast.error('No invoice exists for this appointment', {
        description: 'Open the appointment to create an invoice first.',
      });
      return false;
    }

    // Add the service as a line item
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: service.name,
      quantity: 1,
      unitPrice: service.price,
    };

    const updatedItems = [...(invoice.items || []), newItem];
    const success = await updateInvoice(invoice.id, { items: updatedItems });

    if (success) {
      toast.success(`Added ${service.name} to invoice`, {
        description: `$${service.price.toFixed(2)}`,
      });
      // Refetch to get updated data
      await refetch();
    }

    return success;
  }, [canAddToInvoice, activeAppointmentId, getInvoiceForAppointment, updateInvoice, refetch]);

  // Add a service to a specific appointment's invoice
  const addServiceToInvoice = useCallback(async (
    appointmentId: string,
    clientId: string,
    service: Service
  ): Promise<boolean> => {
    if (!canAddToInvoice) {
      toast.error('Complete setup to add services to invoices');
      return false;
    }

    let invoice = getInvoiceForAppointment(appointmentId);

    // Create invoice if it doesn't exist
    if (!invoice) {
      const newInvoice = await createInvoiceForAppointment(appointmentId, clientId, []);
      if (!newInvoice) return false;
      invoice = newInvoice;
    }

    // Add the service as a line item
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: service.name,
      quantity: 1,
      unitPrice: service.price,
    };

    const updatedItems = [...(invoice.items || []), newItem];
    const success = await updateInvoice(invoice.id, { items: updatedItems });

    if (success) {
      toast.success(`Added ${service.name} to invoice`, {
        description: `$${service.price.toFixed(2)}`,
      });
      await refetch();
    }

    return success;
  }, [canAddToInvoice, getInvoiceForAppointment, createInvoiceForAppointment, updateInvoice, refetch]);

  // Clear active appointment (for admin reset)
  const clearActiveAppointment = useCallback(() => {
    setActiveAppointmentId(null);
  }, [setActiveAppointmentId]);

  return {
    // State
    activeAppointmentId,
    setActiveAppointmentId,
    activeInvoice,
    appointmentInvoices,
    
    // Capabilities
    canAddToInvoice,
    isStationaryBusiness,
    
    // Actions
    addServiceToAppointmentInvoice,
    addServiceToInvoice,
    getInvoiceForAppointment,
    createInvoiceForAppointment,
    clearActiveAppointment,
    
    // Utilities
    generateInvoiceNumber,
  };
}
