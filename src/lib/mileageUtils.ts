// Mileage Pro utility functions

export function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}

export function formatDuration(startTime: Date, endTime?: Date): string {
  const end = endTime || new Date();
  const diffMs = end.getTime() - startTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatTripDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTripTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function calculateDeduction(miles: number, irsRate: number): number {
  return miles * irsRate;
}

export interface MileageTrip {
  id: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  startTime: Date;
  endTime?: Date;
  isTracking: boolean;
  purpose?: string;
  coordinates?: { lat: number; lng: number }[];
}

export interface MileageSettings {
  irsRate: number;
  businessHoursStart: string;
  businessHoursEnd: string;
  bluetoothDevices: string[];
  autoStartEnabled: boolean;
}

export const DEFAULT_IRS_RATE = 0.70; // 2024 IRS rate
export const DEFAULT_SETTINGS: MileageSettings = {
  irsRate: DEFAULT_IRS_RATE,
  businessHoursStart: '08:00',
  businessHoursEnd: '18:00',
  bluetoothDevices: [],
  autoStartEnabled: false,
};
