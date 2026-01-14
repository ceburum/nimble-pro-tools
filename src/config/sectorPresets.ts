// Business sector presets with suggested services and add-ons

export type BusinessSector =
  | 'contractor_trades'
  | 'mobile_services'
  | 'salon_beauty'
  | 'appointment_services'
  | 'retail_sales'
  | 'blank_minimal';

export type BusinessType = 'mobile_job' | 'stationary_appointment';

export interface PreloadedService {
  name: string;
  description?: string;
  price: number;
  duration?: number; // in minutes, for appointment-based
}

export interface SectorPreset {
  name: string;
  description: string;
  suggestedAddons: ('service_menu' | 'mileage' | 'financial_tool' | 'scanner' | 'cloud')[];
  defaultBusinessType: BusinessType;
  preloadedServices: PreloadedService[];
  icon: string; // Lucide icon name
}

export const SECTOR_PRESETS: Record<BusinessSector, SectorPreset> = {
  contractor_trades: {
    name: 'Contractor / Trades',
    description: 'Plumbers, electricians, HVAC, general contractors, handyman services',
    suggestedAddons: ['mileage', 'financial_tool'],
    defaultBusinessType: 'mobile_job',
    icon: 'Hammer',
    preloadedServices: [
      { name: 'Service Call', description: 'Standard service call fee', price: 75 },
      { name: 'Hourly Labor', description: 'Per hour labor rate', price: 85 },
      { name: 'Emergency Rate', description: 'After-hours emergency service', price: 125 },
      { name: 'Diagnostic Fee', description: 'Troubleshooting and diagnosis', price: 50 },
      { name: 'Travel Charge', description: 'Per mile travel fee', price: 1.50 },
    ],
  },
  mobile_services: {
    name: 'Mobile Services',
    description: 'Mobile pet grooming, mobile detailing, lawn care, cleaning services',
    suggestedAddons: ['mileage', 'service_menu', 'financial_tool'],
    defaultBusinessType: 'mobile_job',
    icon: 'Truck',
    preloadedServices: [
      { name: 'Basic Service', description: 'Standard service package', price: 50 },
      { name: 'Premium Service', description: 'Full service package', price: 100 },
      { name: 'Add-On Service', description: 'Extra service option', price: 25 },
      { name: 'Travel Fee', description: 'Distance-based travel fee', price: 15 },
    ],
  },
  salon_beauty: {
    name: 'Salon / Beauty',
    description: 'Hair salons, nail salons, spas, barbershops, estheticians',
    suggestedAddons: ['service_menu', 'financial_tool'],
    defaultBusinessType: 'stationary_appointment',
    icon: 'Scissors',
    preloadedServices: [
      { name: 'Haircut', description: 'Standard haircut', price: 35, duration: 30 },
      { name: 'Color Treatment', description: 'Full color service', price: 85, duration: 90 },
      { name: 'Highlights', description: 'Partial or full highlights', price: 120, duration: 120 },
      { name: 'Blowout', description: 'Wash and style', price: 45, duration: 45 },
      { name: 'Manicure', description: 'Basic manicure', price: 25, duration: 30 },
      { name: 'Pedicure', description: 'Basic pedicure', price: 40, duration: 45 },
    ],
  },
  appointment_services: {
    name: 'Appointment Services',
    description: 'Consultants, tutors, coaches, therapists, photographers',
    suggestedAddons: ['financial_tool', 'cloud'],
    defaultBusinessType: 'stationary_appointment',
    icon: 'Calendar',
    preloadedServices: [
      { name: 'Consultation', description: 'Initial consultation', price: 50, duration: 30 },
      { name: '1-Hour Session', description: 'Standard session', price: 100, duration: 60 },
      { name: '2-Hour Session', description: 'Extended session', price: 180, duration: 120 },
      { name: 'Package (4 Sessions)', description: 'Discounted package', price: 350 },
    ],
  },
  retail_sales: {
    name: 'Retail / Simple Sales',
    description: 'Small retail, market vendors, e-commerce fulfillment',
    suggestedAddons: ['financial_tool', 'scanner'],
    defaultBusinessType: 'stationary_appointment',
    icon: 'ShoppingBag',
    preloadedServices: [
      { name: 'Product Sale', description: 'Standard product', price: 20 },
      { name: 'Premium Product', description: 'Premium product', price: 50 },
      { name: 'Shipping', description: 'Standard shipping', price: 8 },
    ],
  },
  blank_minimal: {
    name: 'Blank / Minimal',
    description: 'Start fresh with no preloaded services or suggestions',
    suggestedAddons: [],
    defaultBusinessType: 'mobile_job',
    icon: 'FileText',
    preloadedServices: [],
  },
};

export const SECTOR_OPTIONS = Object.entries(SECTOR_PRESETS).map(([key, preset]) => ({
  value: key as BusinessSector,
  label: preset.name,
  description: preset.description,
  icon: preset.icon,
}));
