import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileText, Table } from 'lucide-react';
import { format } from 'date-fns';

interface ProfitLossData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

interface ExpenseCategory {
  name: string;
  total: number;
  irsCode?: string | null;
}

interface ProfitLossExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ProfitLossData;
  expensesByCategory: ExpenseCategory[];
  dateRange: { from: Date; to: Date };
}

export function ProfitLossExportDialog({ 
  open, 
  onOpenChange, 
  data, 
  expensesByCategory,
  dateRange 
}: ProfitLossExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'csv') {
        exportCSV();
      } else {
        exportPDF();
      }
    } finally {
      setIsExporting(false);
      onOpenChange(false);
    }
  };

  const exportCSV = () => {
    const dateRangeStr = `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    
    let csv = 'Profit & Loss Report\n';
    csv += `Date Range,${dateRangeStr}\n\n`;
    
    csv += 'INCOME\n';
    csv += `Paid Invoices,${data.totalIncome}\n`;
    csv += `Total Income,${data.totalIncome}\n\n`;
    
    csv += 'EXPENSES\n';
    csv += 'Category,IRS Code,Amount\n';
    expensesByCategory.forEach(cat => {
      csv += `${cat.name},${cat.irsCode || ''},${cat.total}\n`;
    });
    csv += `Total Expenses,,${data.totalExpenses}\n\n`;
    
    csv += `NET ${data.netProfit >= 0 ? 'PROFIT' : 'LOSS'},${Math.abs(data.netProfit)}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    // Create a printable HTML version and trigger print dialog
    const dateRangeStr = `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    const isProfit = data.netProfit >= 0;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profit & Loss Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { font-size: 24px; margin-bottom: 5px; }
          .date-range { color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: 600; }
          .amount { text-align: right; }
          .total-row { font-weight: bold; background: #f9f9f9; }
          .net-profit { font-size: 18px; padding: 15px; margin-top: 20px; text-align: center; border-radius: 8px; }
          .profit { background: #dcfce7; color: #166534; }
          .loss { background: #fee2e2; color: #991b1b; }
          .section-header { font-size: 14px; font-weight: 600; margin: 20px 0 10px; color: #666; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <h1>Profit & Loss Statement</h1>
        <p class="date-range">${dateRangeStr}</p>
        
        <div class="section-header">Income</div>
        <table>
          <tr><td>Paid Invoices</td><td class="amount">${formatCurrency(data.totalIncome)}</td></tr>
          <tr class="total-row"><td>Total Income</td><td class="amount">${formatCurrency(data.totalIncome)}</td></tr>
        </table>
        
        <div class="section-header">Expenses by Category</div>
        <table>
          <thead><tr><th>Category</th><th>IRS Code</th><th class="amount">Amount</th></tr></thead>
          <tbody>
            ${expensesByCategory.map(cat => `
              <tr><td>${cat.name}</td><td>${cat.irsCode || '—'}</td><td class="amount">${formatCurrency(cat.total)}</td></tr>
            `).join('')}
            <tr class="total-row"><td>Total Expenses</td><td></td><td class="amount">${formatCurrency(data.totalExpenses)}</td></tr>
          </tbody>
        </table>
        
        <div class="net-profit ${isProfit ? 'profit' : 'loss'}">
          Net ${isProfit ? 'Profit' : 'Loss'}: ${formatCurrency(Math.abs(data.netProfit))}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Profit & Loss Report
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-sm font-medium mb-3 block">Export Format</Label>
          <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="csv" id="csv" />
              <Table className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="csv" className="cursor-pointer font-medium">CSV Spreadsheet</Label>
                <p className="text-xs text-muted-foreground">For Excel, Google Sheets, or accounting software</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer mt-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="pdf" className="cursor-pointer font-medium">PDF Document</Label>
                <p className="text-xs text-muted-foreground">For printing or sharing with your accountant</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
