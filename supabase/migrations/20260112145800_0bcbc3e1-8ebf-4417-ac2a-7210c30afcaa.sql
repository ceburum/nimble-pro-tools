-- =============================================
-- TAX PRO ADD-ON: Database Schema Migration
-- =============================================

-- 1. Add tax_pro_enabled to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS tax_pro_enabled boolean DEFAULT false;

-- 2. Extend clients table for 1099 tracking
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS is_1099_eligible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS legal_name text,
ADD COLUMN IF NOT EXISTS tin_encrypted text,
ADD COLUMN IF NOT EXISTS tin_type text,
ADD COLUMN IF NOT EXISTS is_subcontractor boolean DEFAULT false;

-- 3. Extend project_receipts for enhanced tax categorization
ALTER TABLE public.project_receipts 
ADD COLUMN IF NOT EXISTS vendor text,
ADD COLUMN IF NOT EXISTS tax_notes text,
ADD COLUMN IF NOT EXISTS is_capital_asset boolean DEFAULT false;

-- 4. Extend mileage_entries for tax linking
ALTER TABLE public.mileage_entries 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tax_year integer;

-- 5. Create IRS mileage rates reference table
CREATE TABLE IF NOT EXISTS public.irs_mileage_rates (
  year integer PRIMARY KEY,
  rate_per_mile numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed with known IRS rates
INSERT INTO public.irs_mileage_rates (year, rate_per_mile) VALUES
  (2020, 0.575),
  (2021, 0.56),
  (2022, 0.585),
  (2023, 0.655),
  (2024, 0.67),
  (2025, 0.70)
ON CONFLICT (year) DO NOTHING;

-- Enable RLS on irs_mileage_rates (public read, no user writes)
ALTER TABLE public.irs_mileage_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read IRS rates" 
ON public.irs_mileage_rates 
FOR SELECT 
USING (true);

-- 6. Create capital_assets table
CREATE TABLE IF NOT EXISTS public.capital_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text NOT NULL,
  purchase_date date NOT NULL,
  cost numeric NOT NULL DEFAULT 0,
  asset_type text NOT NULL DEFAULT 'equipment',
  depreciation_hint text,
  notes text,
  receipt_id uuid REFERENCES public.project_receipts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on capital_assets
ALTER TABLE public.capital_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own capital assets" 
ON public.capital_assets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own capital assets" 
ON public.capital_assets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capital assets" 
ON public.capital_assets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own capital assets" 
ON public.capital_assets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_capital_assets_updated_at
BEFORE UPDATE ON public.capital_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create subcontractor_payments table
CREATE TABLE IF NOT EXISTS public.subcontractor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  description text,
  check_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on subcontractor_payments
ALTER TABLE public.subcontractor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own subcontractor payments" 
ON public.subcontractor_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subcontractor payments" 
ON public.subcontractor_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subcontractor payments" 
ON public.subcontractor_payments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subcontractor payments" 
ON public.subcontractor_payments 
FOR DELETE 
USING (auth.uid() = user_id);