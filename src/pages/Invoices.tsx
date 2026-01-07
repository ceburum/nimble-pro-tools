import { useState, useEffect } from 'react';
import { Plus, Search, Bug, FileText } from 'lucide-react';
import { Invoice, Client } from '@/types';
import { mockInvoices, mockClients } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InvoiceCard } from '@/components/invoices/InvoiceCard';
import { InvoiceDialog } from '@/components/invoices/InvoiceDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLocation, useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SmtpDiagnostics {
  smtpResponses: string[];
  messageSize: number;
  timestamp: string;
  recipient: string;
  subject: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('ceb-invoices', mockInvoices);
  const [clients] = useLocalStorage<Client[]>('ceb-clients', mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preSelectedClientId, setPreSelectedClientId] = useState<string | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState(false);
  const [plainTextMode, setPlainTextMode] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<SmtpDiagnostics | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle navigation state for creating invoice from client
  useEffect(() => {
    const state = location.state as { openNewInvoice?: boolean; selectedClientId?: string } | null;
    if (state?.openNewInvoice) {
      setPreSelectedClientId(state.selectedClientId || null);
      setIsDialogOpen(true);
      // Clear the state so it doesn't re-trigger
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const filteredInvoices = invoices.filter((invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateInvoice = (data: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice: Invoice = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setInvoices((prev) => [...prev, newInvoice]);
    toast({
      title: 'Invoice created',
      description: `${data.invoiceNumber} has been created.`,
    });
  };

  const handleSendEmail = async (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    if (!client) {
      toast({
        title: 'Error',
        description: 'Client not found.',
        variant: 'destructive',
      });
      return;
    }

    setSendingEmail(invoice.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          clientName: client.name,
          clientEmail: client.email,
          invoiceNumber: invoice.invoiceNumber,
          items: invoice.items,
          dueDate: invoice.dueDate.toLocaleDateString(),
          notes: invoice.notes,
          businessName: 'CEB Building',
          diagnosticMode,
          plainTextOnly: plainTextMode,
        },
      });

      if (error) throw error;

      // If diagnostic mode, show the diagnostics dialog
      if (diagnosticMode && data?.diagnostics) {
        setDiagnosticsResult(data.diagnostics);
        setShowDiagnostics(true);
      }

      // Update invoice status to sent
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id ? { ...inv, status: 'sent' as const } : inv
        )
      );

      toast({
        title: 'Invoice sent!',
        description: `Invoice emailed to ${client.email}${plainTextMode ? ' (plain text)' : ''}${diagnosticMode ? ' - check diagnostics' : ''}`,
      });
    } catch (error: any) {
      console.error('Failed to send invoice:', error);
      const message = error?.message ? String(error.message) : String(error);
      const looksLikeBlockedRequest =
        message.includes('Failed to fetch') ||
        message.includes('Failed to send a request to the Edge Function');

      toast({
        title: 'Failed to send',
        description: looksLikeBlockedRequest
          ? 'Your browser blocked the request. If you\'re using DuckDuckGo/Brave, disable tracking protection for this site or try Chrome/Safari, then retry.'
          : (message || 'Could not send invoice email.'),
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSendText = (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    toast({
      title: 'Coming soon',
      description: `Text messaging to ${client?.phone} will be available soon.`,
    });
  };

  const handleMarkPaid = (invoice: Invoice) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoice.id
          ? { ...inv, status: 'paid' as const, paidAt: new Date() }
          : inv
      )
    );
    toast({
      title: 'Payment recorded',
      description: `${invoice.invoiceNumber} has been marked as paid.`,
    });
  };

  const handleDelete = (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id);
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    toast({
      title: 'Invoice deleted',
      description: `${invoice?.invoiceNumber} has been removed.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Track and manage your invoices</p>
        </div>
        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Diagnostic Controls */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Switch
            id="diagnostic-mode"
            checked={diagnosticMode}
            onCheckedChange={setDiagnosticMode}
          />
          <Label htmlFor="diagnostic-mode" className="flex items-center gap-2 cursor-pointer">
            <Bug className="h-4 w-4" />
            Diagnostic Mode
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="plaintext-mode"
            checked={plainTextMode}
            onCheckedChange={setPlainTextMode}
          />
          <Label htmlFor="plaintext-mode" className="flex items-center gap-2 cursor-pointer">
            <FileText className="h-4 w-4" />
            Plain Text (no HTML/logo)
          </Label>
        </div>
        {(diagnosticMode || plainTextMode) && (
          <p className="text-xs text-muted-foreground">
            {diagnosticMode && "Full SMTP trace will be shown after sending. "}
            {plainTextMode && "Sends simple text email to test deliverability."}
          </p>
        )}
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No invoices found.</p>
          <Button variant="link" className="mt-2" onClick={() => setIsDialogOpen(true)}>
            Create your first invoice
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              client={clients.find((c) => c.id === invoice.clientId)}
              onSendEmail={handleSendEmail}
              onSendText={handleSendText}
              onMarkPaid={handleMarkPaid}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <InvoiceDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setPreSelectedClientId(null);
        }}
        clients={clients}
        onSave={handleCreateInvoice}
        defaultClientId={preSelectedClientId}
      />

      {/* Diagnostics Result Dialog */}
      <Dialog open={showDiagnostics} onOpenChange={setShowDiagnostics}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              SMTP Diagnostics
            </DialogTitle>
          </DialogHeader>
          {diagnosticsResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Recipient</p>
                  <p>{diagnosticsResult.recipient}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Subject</p>
                  <p>{diagnosticsResult.subject}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Message Size</p>
                  <p>{(diagnosticsResult.messageSize / 1024).toFixed(2)} KB</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Timestamp</p>
                  <p>{new Date(diagnosticsResult.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-2">SMTP Conversation</p>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-64 font-mono">
                  {diagnosticsResult.smtpResponses.join('\n')}
                </pre>
              </div>
              <div className="text-xs text-muted-foreground">
                <p><strong>Key responses to look for:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code>235</code> = Auth success</li>
                  <li><code>250</code> = Command accepted / Message queued</li>
                  <li><code>354</code> = Ready for message data</li>
                  <li>Any <code>4xx</code> or <code>5xx</code> = Error/rejection</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}