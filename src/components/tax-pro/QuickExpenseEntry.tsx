import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Shield, Stethoscope, Fuel, Wrench, Building2, CalendarIcon, Loader2, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBankExpenses } from '@/hooks/useBankExpenses';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { toast } from 'sonner';

interface QuickCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  irsCode: string;
  color: string;
}

const QUICK_CATEGORIES: QuickCategory[] = [
  { id: 'insurance', name: 'Insurance', icon: <Shield className="h-5 w-5" />, irsCode: 'L15', color: 'bg-blue-500/10 text-blue-600' },
  { id: 'medical', name: 'Medical', icon: <Stethoscope className="h-5 w-5" />, irsCode: 'L14', color: 'bg-red-500/10 text-red-600' },
  { id: 'fuel', name: 'Fuel', icon: <Fuel className="h-5 w-5" />, irsCode: 'L9', color: 'bg-orange-500/10 text-orange-600' },
  { id: 'tools', name: 'Tools', icon: <Wrench className="h-5 w-5" />, irsCode: 'L22', color: 'bg-purple-500/10 text-purple-600' },
  { id: 'office', name: 'Office Supplies', icon: <Building2 className="h-5 w-5" />, irsCode: 'L18', color: 'bg-green-500/10 text-green-600' },
];

export function QuickExpenseEntry() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuickCategory | null>(null);
  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { addExpense } = useBankExpenses();
  const { categories } = useExpenseCategories();

  const handleOpenQuickEntry = (category: QuickCategory) => {
    setSelectedCategory(category);
    setAmount('');
    setPayee(category.name);
    setDate(new Date());
    setNotes('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCategory || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      // Find matching category by IRS code
      const matchingCategory = categories.find(c => c.irsCode === selectedCategory.irsCode);

      await addExpense({
        description: `${payee || selectedCategory.name}${notes ? `: ${notes}` : ''}`,
        amount: amountNum,
        expenseDate: date,
        categoryId: matchingCategory?.id,
        vendor: payee || selectedCategory.name,
      });

      toast.success(`${selectedCategory.name} expense recorded`);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Quick Expense Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleOpenQuickEntry(category)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border transition-all hover:border-primary/50 hover:bg-primary/5 ${category.color}`}
              >
                {category.icon}
                <span className="text-xs font-medium text-foreground">{category.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCategory && (
                <span className={`p-1.5 rounded ${selectedCategory.color}`}>
                  {selectedCategory.icon}
                </span>
              )}
              {selectedCategory?.name} Expense
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="payee">Payee / Vendor</Label>
              <Input
                id="payee"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder={selectedCategory?.name || "Enter payee name"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!amount || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
