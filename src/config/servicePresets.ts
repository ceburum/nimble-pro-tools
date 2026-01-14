// Service presets for different industries
// Each preset includes theme colors and a list of common services

export interface PresetService {
  name: string;
  price: number;
  duration?: number;
}

export interface ServicePreset {
  id: string;
  name: string;
  description: string;
  themeColor: string;    // Primary theme color (HSL format for CSS variables)
  altColor: string;      // Alternative/accent color
  services: PresetService[];
}

export const SERVICE_PRESETS: Record<string, ServicePreset> = {
  barber_shop: {
    id: 'barber_shop',
    name: 'Barber Shop',
    description: '50 common barber services with professional styling',
    themeColor: '215 50% 23%',   // Deep navy (#1e3a5f)
    altColor: '215 19% 35%',     // Charcoal (#2d3748)
    services: [
      { name: 'Basic Haircut', price: 25, duration: 30 },
      { name: 'Beard Trim', price: 15, duration: 15 },
      { name: 'Mustache Trim', price: 10, duration: 10 },
      { name: 'Buzz Cut', price: 20, duration: 20 },
      { name: 'Fade', price: 30, duration: 35 },
      { name: 'Crew Cut', price: 25, duration: 25 },
      { name: 'Undercut', price: 30, duration: 30 },
      { name: 'Pompadour', price: 35, duration: 40 },
      { name: 'Mohawk', price: 35, duration: 40 },
      { name: 'Hairline Design', price: 15, duration: 15 },
      { name: 'Shampoo & Cut', price: 35, duration: 40 },
      { name: 'Scalp Massage', price: 15, duration: 15 },
      { name: 'Hot Towel Shave', price: 30, duration: 30 },
      { name: 'Straight Razor Shave', price: 35, duration: 35 },
      { name: 'Eyebrow Trim', price: 10, duration: 10 },
      { name: 'Hair Wash', price: 10, duration: 10 },
      { name: 'Beard Shape', price: 20, duration: 20 },
      { name: 'Fade + Line Up', price: 35, duration: 40 },
      { name: 'Skin Fade', price: 30, duration: 35 },
      { name: 'Taper Fade', price: 28, duration: 30 },
      { name: 'Line Up', price: 12, duration: 10 },
      { name: 'Chin Strap Beard', price: 18, duration: 15 },
      { name: 'Goatee Shape', price: 15, duration: 15 },
      { name: 'Hair Color / Dye', price: 50, duration: 60 },
      { name: 'Highlights', price: 60, duration: 75 },
      { name: 'Lowlights', price: 55, duration: 70 },
      { name: 'Hair Treatment', price: 25, duration: 30 },
      { name: 'Deep Conditioning', price: 20, duration: 25 },
      { name: 'Hair Relaxing', price: 45, duration: 60 },
      { name: 'Beard Coloring', price: 25, duration: 30 },
      { name: 'Hair Consultation', price: 0, duration: 15 },
      { name: 'Hair Styling', price: 20, duration: 25 },
      { name: 'Blow Dry', price: 15, duration: 15 },
      { name: 'Product Application', price: 5, duration: 5 },
      { name: 'Hair Mask Treatment', price: 30, duration: 30 },
      { name: 'Split End Trim', price: 15, duration: 15 },
      { name: 'Razor Fade', price: 32, duration: 35 },
      { name: 'Pomade Styling', price: 10, duration: 10 },
      { name: 'Clipper Cut', price: 22, duration: 25 },
      { name: 'Hot Oil Treatment', price: 25, duration: 30 },
      { name: 'Beard Oil Application', price: 8, duration: 5 },
      { name: 'Facial Hair Cleanup', price: 12, duration: 10 },
      { name: 'Edge Up', price: 10, duration: 10 },
      { name: 'Temple Fade', price: 28, duration: 30 },
      { name: 'Sideburn Trim', price: 8, duration: 5 },
      { name: 'Neckline Cleanup', price: 10, duration: 10 },
      { name: 'Shaving Tutorial', price: 40, duration: 45 },
      { name: 'Hair Design', price: 25, duration: 30 },
      { name: 'Hairline Correction', price: 20, duration: 20 },
      { name: 'Quick Trim', price: 15, duration: 15 },
    ],
  },
  contractor_general: {
    id: 'contractor_general',
    name: 'General Contractor',
    description: 'Common contractor services for trades and handyman work',
    themeColor: '25 70% 45%',     // Warm orange (#c86b23)
    altColor: '20 25% 30%',       // Dark brown
    services: [
      { name: 'Service Call', price: 75, duration: 60 },
      { name: 'Hourly Labor', price: 85, duration: 60 },
      { name: 'Emergency Rate', price: 125, duration: 60 },
      { name: 'Diagnostic Fee', price: 50, duration: 30 },
      { name: 'Estimate / Quote', price: 0, duration: 60 },
      { name: 'Consultation', price: 50, duration: 45 },
      { name: 'Minor Repair', price: 100, duration: 60 },
      { name: 'Major Repair', price: 250, duration: 180 },
      { name: 'Installation - Small', price: 150, duration: 90 },
      { name: 'Installation - Large', price: 350, duration: 240 },
      { name: 'Replacement', price: 200, duration: 120 },
      { name: 'Maintenance Visit', price: 95, duration: 60 },
      { name: 'Inspection', price: 75, duration: 45 },
      { name: 'Cleanup', price: 50, duration: 30 },
      { name: 'Travel Fee', price: 25, duration: 0 },
    ],
  },
  mobile_service: {
    id: 'mobile_service',
    name: 'Mobile Services',
    description: 'Common services for mobile businesses like detailing, grooming, cleaning',
    themeColor: '200 60% 40%',    // Bright blue
    altColor: '200 30% 30%',      // Dark blue
    services: [
      { name: 'Basic Package', price: 50, duration: 45 },
      { name: 'Standard Package', price: 75, duration: 60 },
      { name: 'Premium Package', price: 100, duration: 90 },
      { name: 'Deluxe Package', price: 150, duration: 120 },
      { name: 'Add-On Service', price: 25, duration: 15 },
      { name: 'Express Service', price: 40, duration: 30 },
      { name: 'Deep Clean', price: 120, duration: 90 },
      { name: 'Detail Service', price: 200, duration: 180 },
      { name: 'Specialty Treatment', price: 75, duration: 45 },
      { name: 'Travel Fee', price: 15, duration: 0 },
      { name: 'Same-Day Service', price: 20, duration: 0 },
      { name: 'Weekend Premium', price: 15, duration: 0 },
    ],
  },
  // Future presets can be added here
  // salon: { ... },
  // spa: { ... },
};

// Color theme presets for custom color picker
export const COLOR_THEMES = [
  { name: 'Navy Professional', color: '215 50% 23%' },
  { name: 'Charcoal', color: '215 19% 35%' },
  { name: 'Forest Green', color: '150 40% 30%' },
  { name: 'Deep Burgundy', color: '350 50% 30%' },
  { name: 'Royal Purple', color: '270 40% 35%' },
  { name: 'Slate Blue', color: '210 30% 45%' },
  { name: 'Warm Brown', color: '30 40% 30%' },
  { name: 'Teal', color: '180 50% 30%' },
] as const;
