-- Drop the overly permissive policies (if they still exist)
DROP POLICY IF EXISTS "Public can read invoice by payment token" ON public.invoices;
DROP POLICY IF EXISTS "Public can read specific invoice by payment token" ON public.invoices;
DROP POLICY IF EXISTS "Public can read client for valid invoice" ON public.clients;

-- Create a secure RPC function to fetch invoice data by payment token
-- This uses SECURITY DEFINER to bypass RLS safely
CREATE OR REPLACE FUNCTION public.get_invoice_by_payment_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  invoice_number text,
  items jsonb,
  due_date timestamptz,
  status text,
  client_name text,
  client_email text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.invoice_number,
    i.items,
    i.due_date,
    i.status,
    c.name AS client_name,
    c.email AS client_email
  FROM invoices i
  INNER JOIN clients c ON c.id = i.client_id
  WHERE i.payment_token = p_token
  AND i.payment_token IS NOT NULL
  LIMIT 1;
END;
$$;

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_invoice_by_payment_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invoice_by_payment_token(uuid) TO authenticated;