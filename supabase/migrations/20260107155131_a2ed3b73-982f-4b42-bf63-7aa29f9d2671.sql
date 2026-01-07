-- =====================================================
-- Security Fix: Update RLS Policies to Require Authentication
-- =====================================================

-- Drop existing overly permissive policies on clients table
DROP POLICY IF EXISTS "Allow public read clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public delete clients" ON public.clients;

-- Drop existing overly permissive policies on invoices table
DROP POLICY IF EXISTS "Allow public read invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow public insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow public update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow public delete invoices" ON public.invoices;

-- Drop existing overly permissive policies on invoice_reminders table
DROP POLICY IF EXISTS "Allow public read reminders" ON public.invoice_reminders;
DROP POLICY IF EXISTS "Allow public insert reminders" ON public.invoice_reminders;

-- =====================================================
-- CLIENTS TABLE - Authenticated access only
-- =====================================================

-- Authenticated users can read clients
CREATE POLICY "Authenticated users can read clients" ON public.clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert clients  
CREATE POLICY "Authenticated users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update clients
CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Authenticated users can delete clients
CREATE POLICY "Authenticated users can delete clients" ON public.clients
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- INVOICES TABLE - Authenticated access + public read for payment page
-- =====================================================

-- Public can read invoices (needed for /pay/:invoiceId page)
CREATE POLICY "Public can read invoices for payment" ON public.invoices
  FOR SELECT USING (true);

-- Authenticated users can insert invoices
CREATE POLICY "Authenticated users can insert invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update invoices
CREATE POLICY "Authenticated users can update invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Authenticated users can delete invoices
CREATE POLICY "Authenticated users can delete invoices" ON public.invoices
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- INVOICE_REMINDERS TABLE - Authenticated access only
-- =====================================================

-- Authenticated users can read reminders
CREATE POLICY "Authenticated users can read reminders" ON public.invoice_reminders
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert reminders (also service role for cron jobs)
CREATE POLICY "Authenticated users can insert reminders" ON public.invoice_reminders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Service role can insert reminders (for background jobs)
CREATE POLICY "Service role can insert reminders" ON public.invoice_reminders
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Service role can read reminders (for background jobs)
CREATE POLICY "Service role can read reminders" ON public.invoice_reminders
  FOR SELECT USING (auth.role() = 'service_role');

-- =====================================================
-- PUBLIC READ ACCESS FOR CLIENT INFO (for payment page)
-- =====================================================

-- Public can read client info when linked to an invoice (for payment page)
CREATE POLICY "Public can read client for invoice payment" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.client_id = clients.id
    )
  );