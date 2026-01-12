-- Add financial_pro_enabled to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS financial_pro_enabled boolean DEFAULT false;

-- Create bank_expenses table for standalone expense tracking
CREATE TABLE public.bank_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL,
  expense_date date NOT NULL,
  vendor text,
  category_id uuid REFERENCES public.expense_categories(id),
  bank_statement_ref text,
  is_reconciled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_expenses
CREATE POLICY "Users can read their own bank expenses"
ON public.bank_expenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank expenses"
ON public.bank_expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank expenses"
ON public.bank_expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank expenses"
ON public.bank_expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_bank_expenses_user_id ON public.bank_expenses(user_id);
CREATE INDEX idx_bank_expenses_category_id ON public.bank_expenses(category_id);
CREATE INDEX idx_bank_expenses_date ON public.bank_expenses(expense_date);