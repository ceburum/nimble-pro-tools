// Profession and Service Menu Library types

export interface Profession {
  id: string;
  slug: string;
  display_name: string;
  icon: string;
  description: string | null;
  business_type: 'mobile_job' | 'stationary_appointment';
  is_active: boolean;
  setup_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceMenuLibraryItem {
  name: string;
  price: number;
  duration?: number;
}

export interface ServiceMenuLibrary {
  id: string;
  title: string;
  profession_id: string;
  description: string | null;
  preview_items: string[];
  services: ServiceMenuLibraryItem[];
  is_active: boolean;
  available_in_setup: boolean;
  is_featured: boolean;
  price_cents: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  profession?: Profession;
}

export interface UserService {
  id: string;
  user_id: string;
  name: string;
  price: number;
  duration: number | null;
  thumbnail_url: string | null;
  bg_color: string | null;
  sort_order: number;
  source_library_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
