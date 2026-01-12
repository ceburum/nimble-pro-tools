import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, AlertCircle, Link2, Loader2, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { format, parseISO, isWithinInterval, subDays, addDays } from 'date-fns';

interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

interface MatchedTransaction extends ParsedTransaction {
  matchType: 'invoice' | 'receipt' | 'none';
  matchId?: string;
  matchLabel?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export function StatementReconciliation() {
  const { user } = useAuth();
  const { invoices } = useInvoices();
  const { projects } = useProjects();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<MatchedTransaction[]>([]);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<MatchedTransaction | null>(null);

  // Collect all receipts from projects
  const allReceipts = projects.flatMap((p) =>
    p.receipts.map((r) => ({
      ...r,
      projectTitle: p.title,
    }))
  );

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // For CSV files, parse locally
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const parsed = parseCSV(text);
        const matched = autoMatch(parsed);
        setTransactions(matched);
        toast.success(`Parsed ${matched.length} transactions from CSV`);
      } else if (file.name.endsWith('.pdf')) {
        // For PDFs, we'd use an edge function with AI parsing
        // For now, show a placeholder
        toast.info('PDF parsing coming soon - please use CSV for now');
      } else {
        toast.error('Please upload a CSV or PDF file');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [invoices, allReceipts]);

  const parseCSV = (text: string): ParsedTransaction[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // Try to detect header format
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('date') || header.includes('amount') || header.includes('description');
    const startIndex = hasHeader ? 1 : 0;

    return lines.slice(startIndex).map((line, idx) => {
      const parts = line.split(',').map((p) => p.trim().replace(/"/g, ''));
      // Common formats: Date, Description, Amount or Date, Description, Debit, Credit
      const date = parts[0] || '';
      const description = parts[1] || '';
      let amount = 0;
      let type: 'credit' | 'debit' = 'debit';

      if (parts.length >= 4) {
        // Debit/Credit columns
        const debit = parseFloat(parts[2]) || 0;
        const credit = parseFloat(parts[3]) || 0;
        amount = credit > 0 ? credit : debit;
        type = credit > 0 ? 'credit' : 'debit';
      } else if (parts.length >= 3) {
        amount = Math.abs(parseFloat(parts[2]) || 0);
        type = parseFloat(parts[2]) > 0 ? 'credit' : 'debit';
      }

      return {
        id: `tx-${idx}`,
        date,
        description,
        amount,
        type,
      };
    }).filter((t) => t.amount > 0);
  };

  const autoMatch = (parsed: ParsedTransaction[]): MatchedTransaction[] => {
    return parsed.map((tx) => {
      // Try to match credits to paid invoices
      if (tx.type === 'credit') {
        const matchingInvoice = invoices.find((inv) => {
          if (inv.status !== 'paid') return false;
          const total = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
          const amountClose = Math.abs(total - tx.amount) <= total * 0.05; // 5% tolerance
          return amountClose;
        });

        if (matchingInvoice) {
          return {
            ...tx,
            matchType: 'invoice' as const,
            matchId: matchingInvoice.id,
            matchLabel: `Invoice #${matchingInvoice.invoiceNumber}`,
            confidence: Math.abs(matchingInvoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) - tx.amount) < 1 ? 'high' : 'medium',
          };
        }
      }

      // Try to match debits to receipts
      if (tx.type === 'debit') {
        const matchingReceipt = allReceipts.find((r) => {
          const amountClose = Math.abs(r.amount - tx.amount) <= r.amount * 0.05;
          return amountClose;
        });

        if (matchingReceipt) {
          return {
            ...tx,
            matchType: 'receipt' as const,
            matchId: matchingReceipt.id,
            matchLabel: `${matchingReceipt.description} (${matchingReceipt.projectTitle})`,
            confidence: Math.abs(matchingReceipt.amount - tx.amount) < 1 ? 'high' : 'medium',
          };
        }
      }

      return {
        ...tx,
        matchType: 'none' as const,
        confidence: 'none' as const,
      };
    });
  };

  const handleManualMatch = (type: 'invoice' | 'receipt', id: string) => {
    if (!selectedTransaction) return;

    let label = '';
    if (type === 'invoice') {
      const inv = invoices.find((i) => i.id === id);
      label = inv ? `Invoice #${inv.invoiceNumber}` : '';
    } else {
      const rec = allReceipts.find((r) => r.id === id);
      label = rec ? `${rec.description} (${rec.projectTitle})` : '';
    }

    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === selectedTransaction.id
          ? { ...tx, matchType: type, matchId: id, matchLabel: label, confidence: 'high' }
          : tx
      )
    );

    setMatchDialogOpen(false);
    toast.success('Transaction matched');
  };

  const handleIgnore = (txId: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== txId));
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-success/20 text-success border-success/30">High</Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Unmatched</Badge>;
    }
  };

  const matchedCount = transactions.filter((t) => t.matchType !== 'none').length;
  const unmatchedCount = transactions.length - matchedCount;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Statement Reconciliation
          </CardTitle>
          <CardDescription>
            Upload your bank statement to automatically match transactions to invoices and receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg bg-muted/50">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Upload Bank Statement</p>
              <p className="text-sm text-muted-foreground">CSV format supported</p>
            </div>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="max-w-xs"
              disabled={isUploading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {transactions.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-xl font-semibold">{transactions.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Matched</p>
                  <p className="text-xl font-semibold text-success">{matchedCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/10">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Needs Review</p>
                  <p className="text-xl font-semibold text-warning">{unmatchedCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">{tx.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'credit' ? 'default' : 'secondary'}>
                          {tx.type === 'credit' ? 'Income' : 'Expense'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {tx.matchLabel || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{getConfidenceBadge(tx.confidence)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setMatchDialogOpen(true);
                            }}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleIgnore(tx.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Manual Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Transaction</DialogTitle>
            <DialogDescription>
              Select an invoice or receipt to match with this transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedTransaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTransaction.date} • ${selectedTransaction.amount.toFixed(2)}
                </p>
              </div>

              {selectedTransaction.type === 'credit' && (
                <div>
                  <p className="text-sm font-medium mb-2">Match to Invoice</p>
                  <Select onValueChange={(id) => handleManualMatch('invoice', id)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices
                        .filter((inv) => inv.status === 'paid')
                        .map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            #{inv.invoiceNumber} - ${inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedTransaction.type === 'debit' && (
                <div>
                  <p className="text-sm font-medium mb-2">Match to Receipt</p>
                  <Select onValueChange={(id) => handleManualMatch('receipt', id)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a receipt" />
                    </SelectTrigger>
                    <SelectContent>
                      {allReceipts.map((rec) => (
                        <SelectItem key={rec.id} value={rec.id}>
                          {rec.description} - ${rec.amount.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
