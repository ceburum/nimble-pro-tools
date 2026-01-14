// Service Menu types for salon/service-based businesses
export interface Service {
  id: string;
  name: string;
  price: number;
  duration?: number; // in minutes
  thumbnailUrl?: string; // optional image for service card (base64 or URL)
  bgColor?: string; // optional background color for service card (HSL format)
  sortOrder?: number; // for manual reordering
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceMenuSettings {
  globalBgColor: string; // Default tile color (HSL format)
  presetId?: string; // Which preset was used (if any)
  isUnlocked: boolean; // False until purchased/unlocked
  businessSector?: string; // The business sector this menu was created for (source of truth)
}
