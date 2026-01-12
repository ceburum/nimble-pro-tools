import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TaxDisclaimer } from './TaxDisclaimer';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { useCapitalAssets } from '@/hooks/useCapitalAssets';
import { use1099Tracking } from '@/hooks/use1099Tracking';
import { useSubcontractorPayments } from '@/hooks/useSubcontractorPayments';
import { useMileageTrips } from '@/hooks/useMileageTrips';
import { useIrsMileageRates } from '@/hooks/useIrsMileageRates';
import { useClients } from '@/hooks/useClients';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaxExportDialogProps {
  selectedYear: number;
}

export function TaxExportDialog({ selectedYear }: TaxExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeMileage, setIncludeMileage] = useState(true);
  const [includeAssets, setIncludeAssets] = useState(true);
  const [include1099, setInclude1099] = useState(true);

  const { invoices } = useInvoices();
  const { projects } = useProjects();
  const { assets } = useCapitalAssets();
  const { eligible1099Clients } = use1099Tracking();
  const { getTotalByClient } = useSubcontractorPayments();
  const { trips } = useMileageTrips();
  const { getRateForYear } = useIrsMileageRates();
  const { clients } = useClients();
  const { categories } = useExpenseCategories();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

  const generateCSV = () => {
    const sections: string[] = [];
    const disclaimer = '"For your tax professional - informational only. This is not tax advice."';
    
    sections.push(`Tax Export - ${selectedYear}`);
    sections.push(disclaimer);
    sections.push('');

    // Income Section
    if (includeIncome) {
      sections.push('=== INCOME SUMMARY ===');
      sections.push('Client,Invoice Number,Date,Amount,Status');
      
      const yearInvoices = invoices.filter(inv => 
        new Date(inv.createdAt).getFullYear() === selectedYear
      );
      
      yearInvoices.forEach(inv => {
        const client = clients.find(c => c.id === inv.clientId);
        const amount = inv.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        sections.push(`"${client?.name || 'Unknown'}","${inv.invoiceNumber}","${format(inv.createdAt, 'yyyy-MM-dd')}","${amount.toFixed(2)}","${inv.status}"`);
      });
      
      const totalIncome = yearInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);
      sections.push(`"TOTAL PAID INCOME","","","${totalIncome.toFixed(2)}",""`);
      sections.push('');
    }

    // Expenses Section
    if (includeExpenses) {
      sections.push('=== EXPENSES BY CATEGORY ===');
      sections.push('Category,Description,Date,Amount,Vendor');
      
      const allReceipts = projects.flatMap(p => p.receipts.map(r => ({ ...r, projectTitle: p.title })));
      const yearReceipts = allReceipts.filter(r => new Date(r.createdAt).getFullYear() === selectedYear);
      
      // Group by category
      const byCategory: Record<string, typeof yearReceipts> = {};
      yearReceipts.forEach(r => {
        const cat = categories.find(c => c.id === r.categoryId);
        const catName = cat?.name || 'Uncategorized';
        if (!byCategory[catName]) byCategory[catName] = [];
        byCategory[catName].push(r);
      });
      
      Object.entries(byCategory).forEach(([cat, receipts]) => {
        receipts.forEach(r => {
          sections.push(`"${cat}","${r.description}","${format(r.createdAt, 'yyyy-MM-dd')}","${r.amount.toFixed(2)}","${r.vendor || ''}"`);
        });
        const catTotal = receipts.reduce((sum, r) => sum + r.amount, 0);
        sections.push(`"${cat} SUBTOTAL","","","${catTotal.toFixed(2)}",""`);
      });
      
      const totalExpenses = yearReceipts.reduce((sum, r) => sum + r.amount, 0);
      sections.push(`"TOTAL EXPENSES","","","${totalExpenses.toFixed(2)}",""`);
      sections.push('');
    }

    // Mileage Section
    if (includeMileage) {
      sections.push('=== MILEAGE SUMMARY ===');
      sections.push('Date,Start Location,End Location,Miles,Purpose');
      
      const yearTrips = trips.filter(t => t.startTime && new Date(t.startTime).getFullYear() === selectedYear);
      
      yearTrips.forEach(t => {
        sections.push(`"${t.startTime ? format(new Date(t.startTime), 'yyyy-MM-dd') : ''}","${t.startLocation || ''}","${t.endLocation || ''}","${t.distance.toFixed(1)}","${t.purpose || ''}"`);
      });
      
      const totalMiles = yearTrips.reduce((sum, t) => sum + t.distance, 0);
      const rate = getRateForYear(selectedYear);
      const deduction = totalMiles * rate;
      
      sections.push(`"TOTAL MILES","","","${totalMiles.toFixed(1)}",""`);
      sections.push(`"IRS Rate (${selectedYear})","","","$${rate.toFixed(3)}/mile",""`);
      sections.push(`"ESTIMATED DEDUCTION","","","${deduction.toFixed(2)}","(informational only)"`);
      sections.push('');
    }

    // Assets Section
    if (includeAssets) {
      sections.push('=== CAPITAL ASSETS ===');
      sections.push('Description,Type,Purchase Date,Cost,Tax Note');
      
      assets.forEach(a => {
        const taxNote = a.depreciationHint === 'section_179_candidate' ? 'Section 179 Candidate' :
                       a.depreciationHint === 'likely_depreciable' ? 'Likely Depreciable' : '';
        sections.push(`"${a.description}","${a.assetType}","${format(a.purchaseDate, 'yyyy-MM-dd')}","${a.cost.toFixed(2)}","${taxNote}"`);
      });
      
      const totalAssets = assets.reduce((sum, a) => sum + a.cost, 0);
      sections.push(`"TOTAL ASSET VALUE","","","${totalAssets.toFixed(2)}",""`);
      sections.push('');
    }

    // 1099 Section
    if (include1099) {
      sections.push('=== 1099 SUMMARY ===');
      sections.push('Recipient,Type,TIN Type,Address,YTD Payments,Meets Threshold');
      
      eligible1099Clients.forEach(c => {
        const total = getTotalByClient(c.id, selectedYear);
        const meets = total >= 600 ? 'YES' : 'NO';
        const type = c.isSubcontractor ? 'Subcontractor' : 'Vendor';
        sections.push(`"${c.legalName || c.name}","${type}","${c.tinType || 'N/A'}","${c.address}","${total.toFixed(2)}","${meets}"`);
      });
      sections.push('');
    }

    return sections.join('\n');
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csv = generateCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tax-export-${selectedYear}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Tax export downloaded');
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Download className="h-4 w-4 mr-2" />
        Export for CPA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Tax Data</DialogTitle>
            <DialogDescription>
              Generate a {selectedYear} tax summary for your tax professional
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <TaxDisclaimer variant="banner" />

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Include in Export:</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="income"
                    checked={includeIncome}
                    onCheckedChange={(c) => setIncludeIncome(!!c)}
                  />
                  <Label htmlFor="income" className="font-normal">Income Summary</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="expenses"
                    checked={includeExpenses}
                    onCheckedChange={(c) => setIncludeExpenses(!!c)}
                  />
                  <Label htmlFor="expenses" className="font-normal">Expenses by Category</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mileage"
                    checked={includeMileage}
                    onCheckedChange={(c) => setIncludeMileage(!!c)}
                  />
                  <Label htmlFor="mileage" className="font-normal">Mileage Summary</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assets"
                    checked={includeAssets}
                    onCheckedChange={(c) => setIncludeAssets(!!c)}
                  />
                  <Label htmlFor="assets" className="font-normal">Capital Assets</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="form1099"
                    checked={include1099}
                    onCheckedChange={(c) => setInclude1099(!!c)}
                  />
                  <Label htmlFor="form1099" className="font-normal">1099 Summary</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleExportCSV} disabled={exporting} className="w-full sm:w-auto">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {exporting ? 'Generating...' : 'Download CSV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
