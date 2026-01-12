-- Create expense_categories table with IRS Schedule C categories
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  irs_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_categories
CREATE POLICY "Users can read their own categories and defaults"
ON public.expense_categories FOR SELECT
USING (user_id = auth.uid() OR is_default = true);

CREATE POLICY "Users can insert their own categories"
ON public.expense_categories FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own categories"
ON public.expense_categories FOR UPDATE
USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own categories"
ON public.expense_categories FOR DELETE
USING (auth.uid() = user_id AND is_default = false);

-- Insert IRS Schedule C default categories (user_id NULL for system defaults)
INSERT INTO public.expense_categories (user_id, name, irs_code, is_default) VALUES
(NULL, 'Advertising', 'L8', true),
(NULL, 'Car & Truck Expenses', 'L9', true),
(NULL, 'Commissions & Fees', 'L10', true),
(NULL, 'Contract Labor', 'L11', true),
(NULL, 'Depreciation', 'L13', true),
(NULL, 'Insurance (non-health)', 'L15', true),
(NULL, 'Interest (Mortgage)', 'L16a', true),
(NULL, 'Interest (Other)', 'L16b', true),
(NULL, 'Legal & Professional Services', 'L17', true),
(NULL, 'Office Expense', 'L18', true),
(NULL, 'Rent (Vehicles/Equipment)', 'L20a', true),
(NULL, 'Rent (Other)', 'L20b', true),
(NULL, 'Repairs & Maintenance', 'L21', true),
(NULL, 'Supplies', 'L22', true),
(NULL, 'Taxes & Licenses', 'L23', true),
(NULL, 'Travel', 'L24a', true),
(NULL, 'Meals (50%)', 'L24b', true),
(NULL, 'Utilities', 'L25', true),
(NULL, 'Wages', 'L26', true),
(NULL, 'Other Expenses', 'L27a', true);

-- Add category_id to project_receipts
ALTER TABLE public.project_receipts 
ADD COLUMN category_id UUID REFERENCES public.expense_categories(id);

-- Create transactions table for bank imports and manual entries
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'expense', -- 'income' or 'expense'
  category_id UUID REFERENCES public.expense_categories(id),
  matched_invoice_id UUID REFERENCES public.invoices(id),
  matched_receipt_id UUID REFERENCES public.project_receipts(id),
  match_confidence TEXT, -- 'exact', 'suggested', 'manual', null
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'bank_csv', 'bank_pdf'
  source_reference TEXT, -- original bank description/reference
  is_ignored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can read their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
ON public.transactions FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add IRS mileage rate setting to user_settings
ALTER TABLE public.user_settings
ADD COLUMN irs_mileage_rate NUMERIC DEFAULT 0.67,
ADD COLUMN tax_rate_estimate NUMERIC DEFAULT 0.25,
ADD COLUMN partner_suggestions_dismissed BOOLEAN DEFAULT false;