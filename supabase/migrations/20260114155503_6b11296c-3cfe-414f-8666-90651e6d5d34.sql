-- Add context fields to invoices table for linking to projects or appointments
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS context_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS context_id UUID DEFAULT NULL;

-- Add index for faster lookups by context
CREATE INDEX IF NOT EXISTS idx_invoices_context 
ON public.invoices (context_type, context_id) 
WHERE context_type IS NOT NULL;