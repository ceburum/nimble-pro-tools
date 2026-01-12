import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Receipt, CheckCircle, AlertCircle, FolderKanban } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useClients } from '@/hooks/useClients';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface UncategorizedExpensesListProps {
  selectedYear?: number;
}

export function UncategorizedExpensesList({ selectedYear }: UncategorizedExpensesListProps) {
  const { projects, loading: projectsLoading, updateReceipt } = useProjects();
  const { categories, loading: categoriesLoading } = useExpenseCategories();
  const { clients } = useClients();
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const loading = projectsLoading || categoriesLoading;

  // Get all uncategorized receipts with project context
  const uncategorizedExpenses = projects.flatMap(project => {
    const client = clients.find(c => c.id === project.clientId);
    return project.receipts
      .filter(receipt => {
        // Filter by year if provided
        if (selectedYear) {
          const receiptYear = new Date(receipt.createdAt).getFullYear();
          if (receiptYear !== selectedYear) return false;
        }
        // Only uncategorized
        return !receipt.categoryId;
      })
      .map(receipt => ({
        ...receipt,
        projectId: project.id,
        projectTitle: project.title,
        clientName: client?.name || 'No client',
      }));
  });

  // Get IRS categories only (those with irsCode)
  const irsCategories = categories.filter(c => c.irsCode);

  const handleCategoryChange = async (receiptId: string, categoryId: string) => {
    setUpdatingIds(prev => new Set(prev).add(receiptId));
    
    const success = await updateReceipt(receiptId, { categoryId });
    
    if (success) {
      toast.success('Category assigned');
    }
    
    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.delete(receiptId);
      return next;
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uncategorizedExpenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h3 className="font-semibold text-lg mb-2">All Expenses Categorized!</h3>
          <p className="text-muted-foreground text-sm">
            All your project receipts have IRS categories assigned.
            {selectedYear && ` (Showing ${selectedYear})`}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalUncategorized = uncategorizedExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Uncategorized Expenses
            </CardTitle>
            <CardDescription>
              {uncategorizedExpenses.length} expense{uncategorizedExpenses.length !== 1 ? 's' : ''} need IRS categories
              {selectedYear && ` for ${selectedYear}`}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            {formatCurrency(totalUncategorized)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {uncategorizedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-background">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{expense.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FolderKanban className="h-3 w-3" />
                      <span className="truncate">{expense.projectTitle}</span>
                      <span>•</span>
                      <span>{expense.clientName}</span>
                      <span>•</span>
                      <span>{format(new Date(expense.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="font-semibold text-sm">{formatCurrency(expense.amount)}</span>
                  <Select
                    value={expense.categoryId || ''}
                    onValueChange={(value) => handleCategoryChange(expense.id, value)}
                    disabled={updatingIds.has(expense.id)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {irsCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-1">
                              {category.irsCode}
                            </Badge>
                            {category.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
