-- Add column to store receipt image paths for invoice attachments
ALTER TABLE public.invoices 
ADD COLUMN receipt_attachments jsonb DEFAULT '[]'::jsonb;