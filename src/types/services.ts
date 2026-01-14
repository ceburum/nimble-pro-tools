// Service Menu types for salon/service-based businesses
export interface Service {
  id: string;
  name: string;
  price: number;
  duration?: number; // in minutes
  thumbnailUrl?: string; // optional image for service card
  bgColor?: string; // optional background color for service card
  createdAt: Date;
  updatedAt: Date;
}
