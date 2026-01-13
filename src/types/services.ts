// Service Menu types for salon/service-based businesses
export interface Service {
  id: string;
  name: string;
  price: number;
  duration?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}
