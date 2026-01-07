import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  dueDate: string;
  status: string;
  clientName: string;
  clientEmail: string;
}

export default function PayInvoice() {
  const { paymentToken } = useParams<{ paymentToken: string }>();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      if (!paymentToken) {
        setError('Invalid payment link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            items,
            due_date,
            status,
            clients (
              name,
              email
            )
          `)
          .eq('payment_token', paymentToken)
          .single();

        if (fetchError || !data) {
          setError('Invoice not found or link expired');
          setLoading(false);
          return;
        }

        const client = data.clients as { name: string; email: string } | null;
        const rawItems = data.items;
        const items: InvoiceItem[] = Array.isArray(rawItems) ? (rawItems as unknown as InvoiceItem[]) : [];

        setInvoice({
          id: data.id,
          invoiceNumber: data.invoice_number,
          items,
          dueDate: data.due_date,
          status: data.status,
          clientName: client?.name || 'Customer',
          clientEmail: client?.email || '',
        });
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [paymentToken]);

  const total = invoice?.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
  const convenienceFee = total * 0.03;
  const totalWithFee = total + convenienceFee;

  const handlePayWithCard = async () => {
    if (!invoice) return;

    setProcessing(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-invoice-payment', {
        body: {
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          amount: total,
          includeConvenienceFee: true,
        },
      });

      if (invokeError) throw invokeError;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: 'Payment failed',
        description: err?.message || 'Could not create payment session.',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>
              {error || 'This payment link may be invalid or expired.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <CardTitle>Already Paid</CardTitle>
            <CardDescription>
              Invoice {invoice.invoiceNumber} has already been paid. Thank you!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center border-b">
          <div className="mx-auto mb-4">
            <h1 className="text-2xl font-serif text-foreground">CEB Building</h1>
            <p className="text-sm text-muted-foreground italic">Hand-Crafted Wood Works</p>
          </div>
          <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
          <CardDescription>Due: {new Date(invoice.dueDate).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Invoice Items */}
          <div className="space-y-3">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.description}</span>
                <span className="font-medium">
                  ${(item.quantity * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Card Processing Fee (3%):</span>
              <span>+${convenienceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>${totalWithFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayWithCard}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ${totalWithFee.toLocaleString('en-US', { minimumFractionDigits: 2 })} with Card
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            To avoid the 3% fee, pay with Venmo or CashApp instead.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
