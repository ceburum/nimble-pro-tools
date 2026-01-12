-- Add feature flag columns for Scheduling Pro and Mileage Pro add-ons
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS scheduling_pro_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mileage_pro_enabled boolean DEFAULT false;