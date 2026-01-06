-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_id TEXT,
  invoice_number TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create reminder tracking table
CREATE TABLE public.invoice_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('3_day', '7_day', '14_day')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  method TEXT NOT NULL CHECK (method IN ('email', 'text', 'both')),
  UNIQUE(invoice_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

-- For now, allow public access since there's no auth yet
-- These can be updated later when auth is added
CREATE POLICY "Allow public read clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete clients" ON public.clients FOR DELETE USING (true);

CREATE POLICY "Allow public read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete invoices" ON public.invoices FOR DELETE USING (true);

CREATE POLICY "Allow public read reminders" ON public.invoice_reminders FOR SELECT USING (true);
CREATE POLICY "Allow public insert reminders" ON public.invoice_reminders FOR INSERT WITH CHECK (true);

-- Create index for efficient overdue queries
CREATE INDEX idx_invoices_status_due_date ON public.invoices(status, due_date);
CREATE INDEX idx_invoice_reminders_invoice ON public.invoice_reminders(invoice_id);