-- Add business_type column to user_settings for Scheduling Pro
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS business_type text;