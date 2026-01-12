-- Add business profile fields to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS company_phone text,
ADD COLUMN IF NOT EXISTS company_email text,
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'INV-',
ADD COLUMN IF NOT EXISTS payment_instructions text;