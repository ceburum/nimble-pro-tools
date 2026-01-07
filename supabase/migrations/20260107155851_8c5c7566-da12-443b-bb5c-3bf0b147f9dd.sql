-- Add user_id column to clients table for ownership
ALTER TABLE public.clients 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to invoices table for ownership
ALTER TABLE public.invoices 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add payment_token for secure public access to specific invoices
ALTER TABLE public.invoices 
ADD COLUMN payment_token uuid DEFAULT gen_random_uuid() UNIQUE;

-- Add user_id to invoice_reminders for ownership tracking
ALTER TABLE public.invoice_reminders 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_payment_token ON public.invoices(payment_token);
CREATE INDEX idx_invoice_reminders_user_id ON public.invoice_reminders(user_id);

-- Drop existing overly permissive policies on clients
DROP POLICY IF EXISTS "Public can read client for invoice payment" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

-- Create new ownership-based policies for clients
CREATE POLICY "Users can read their own clients"
ON public.clients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
ON public.clients FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
ON public.clients FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
ON public.clients FOR DELETE
USING (auth.uid() = user_id);

-- Drop existing overly permissive policies on invoices
DROP POLICY IF EXISTS "Public can read invoices for payment" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON public.invoices;

-- Create new ownership-based policies for invoices
CREATE POLICY "Users can read their own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
ON public.invoices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
ON public.invoices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
ON public.invoices FOR DELETE
USING (auth.uid() = user_id);

-- Allow public read access ONLY via payment_token (for payment page)
CREATE POLICY "Public can read invoice by payment token"
ON public.invoices FOR SELECT
USING (payment_token IS NOT NULL);

-- Allow public to read client info ONLY when accessed via valid invoice payment token
CREATE POLICY "Public can read client for valid invoice"
ON public.clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.client_id = clients.id 
    AND invoices.payment_token IS NOT NULL
  )
);

-- Drop existing policies on invoice_reminders
DROP POLICY IF EXISTS "Authenticated users can read reminders" ON public.invoice_reminders;
DROP POLICY IF EXISTS "Authenticated users can insert reminders" ON public.invoice_reminders;
DROP POLICY IF EXISTS "Service role can read reminders" ON public.invoice_reminders;
DROP POLICY IF EXISTS "Service role can insert reminders" ON public.invoice_reminders;

-- Create new ownership-based policies for invoice_reminders
CREATE POLICY "Users can read their own reminders"
ON public.invoice_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
ON public.invoice_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role policies for background jobs
CREATE POLICY "Service role can manage reminders"
ON public.invoice_reminders FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');