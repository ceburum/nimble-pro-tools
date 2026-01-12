import { useMemo } from 'react';
import { useProjects } from './useProjects';
import { useBankExpenses } from './useBankExpenses';
import { useExpenseCategories } from './useExpenseCategories';
import { isWithinInterval, startOfYear, endOfYear } from 'date-fns';

export interface CategorizedExpense {
  id: string;
  amount: number;
  description: string;
  date: Date;
  vendor: string | null;
  categoryId: string | null;
  categoryName: string | null;
  irsCode: string | null;
  source: 'project_receipt' | 'bank_expense';
  projectId?: string;
  projectTitle?: string;
}

export interface ExpenseByCategory {
  categoryId: string | null;
  categoryName: string;
  irsCode: string | null;
  total: number;
  count: number;
  expenses: CategorizedExpense[];
}

export interface ExpenseByIrsCode {
  irsCode: string;
  lineName: string;
  total: number;
  count: number;
  categories: string[];
}

interface DateRange {
  from: Date;
  to: Date;
}

// IRS Schedule C line names
const IRS_LINE_NAMES: Record<string, string> = {
  'line_8': 'Line 8: Advertising',
  'line_10': 'Line 10: Car & truck expenses',
  'line_11': 'Line 11: Commissions & fees',
  'line_13': 'Line 13: Depreciation',
  'line_14': 'Line 14: Employee benefit programs',
  'line_15': 'Line 15: Insurance (other than health)',
  'line_16a': 'Line 16a: Interest - Mortgage',
  'line_16b': 'Line 16b: Interest - Other',
  'line_17': 'Line 17: Legal & professional services',
  'line_18': 'Line 18: Office expense',
  'line_20a': 'Line 20a: Rent - Vehicles, machinery',
  'line_20b': 'Line 20b: Rent - Other property',
  'line_21': 'Line 21: Repairs & maintenance',
  'line_22': 'Line 22: Supplies',
  'line_23': 'Line 23: Taxes & licenses',
  'line_24a': 'Line 24a: Travel',
  'line_24b': 'Line 24b: Meals',
  'line_25': 'Line 25: Utilities',
  'line_26': 'Line 26: Wages',
  'line_27a': 'Line 27a: Other expenses',
};

export function useCategorizedExpenses(dateRange?: DateRange, year?: number) {
  const { projects, loading: projectsLoading } = useProjects();
  const { expenses: bankExpenses, loading: bankExpensesLoading } = useBankExpenses();
  const { categories, loading: categoriesLoading } = useExpenseCategories();

  const loading = projectsLoading || bankExpensesLoading || categoriesLoading;

  // Determine effective date range
  const effectiveDateRange = useMemo(() => {
    if (dateRange) return dateRange;
    if (year) {
      const yearDate = new Date(year, 0, 1);
      return { from: startOfYear(yearDate), to: endOfYear(yearDate) };
    }
    return { from: startOfYear(new Date()), to: endOfYear(new Date()) };
  }, [dateRange, year]);

  // Build category lookup
  const categoryLookup = useMemo(() => {
    const lookup = new Map<string, { name: string; irsCode: string | null }>();
    categories.forEach((c) => {
      lookup.set(c.id, { name: c.name, irsCode: c.irsCode || null });
    });
    return lookup;
  }, [categories]);

  // Combine and normalize all expenses
  const allExpenses = useMemo<CategorizedExpense[]>(() => {
    const expenses: CategorizedExpense[] = [];

    // Add project receipts
    projects.forEach((project) => {
      project.receipts.forEach((receipt) => {
        const receiptDate = new Date(receipt.createdAt);
        if (!isWithinInterval(receiptDate, { start: effectiveDateRange.from, end: effectiveDateRange.to })) {
          return;
        }

        const categoryInfo = receipt.categoryId ? categoryLookup.get(receipt.categoryId) : null;

        expenses.push({
          id: receipt.id,
          amount: receipt.amount,
          description: receipt.description,
          date: receiptDate,
          vendor: receipt.vendor || null,
          categoryId: receipt.categoryId || null,
          categoryName: categoryInfo?.name || null,
          irsCode: categoryInfo?.irsCode || null,
          source: 'project_receipt',
          projectId: project.id,
          projectTitle: project.title,
        });
      });
    });

    // Add bank expenses
    bankExpenses.forEach((expense) => {
      if (!isWithinInterval(expense.expenseDate, { start: effectiveDateRange.from, end: effectiveDateRange.to })) {
        return;
      }

      const categoryInfo = expense.categoryId ? categoryLookup.get(expense.categoryId) : null;

      expenses.push({
        id: expense.id,
        amount: expense.amount,
        description: expense.description,
        date: expense.expenseDate,
        vendor: expense.vendor,
        categoryId: expense.categoryId,
        categoryName: categoryInfo?.name || null,
        irsCode: categoryInfo?.irsCode || null,
        source: 'bank_expense',
      });
    });

    return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [projects, bankExpenses, categoryLookup, effectiveDateRange]);

  // Group by category
  const byCategory = useMemo<ExpenseByCategory[]>(() => {
    const map = new Map<string, ExpenseByCategory>();

    allExpenses.forEach((expense) => {
      const key = expense.categoryId || 'uncategorized';
      const existing = map.get(key);

      if (existing) {
        existing.total += expense.amount;
        existing.count += 1;
        existing.expenses.push(expense);
      } else {
        map.set(key, {
          categoryId: expense.categoryId,
          categoryName: expense.categoryName || 'Uncategorized',
          irsCode: expense.irsCode,
          total: expense.amount,
          count: 1,
          expenses: [expense],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [allExpenses]);

  // Group by IRS code for Schedule C
  const byIrsCode = useMemo<ExpenseByIrsCode[]>(() => {
    const map = new Map<string, ExpenseByIrsCode>();

    allExpenses.forEach((expense) => {
      const code = expense.irsCode || 'other';
      const existing = map.get(code);

      if (existing) {
        existing.total += expense.amount;
        existing.count += 1;
        if (expense.categoryName && !existing.categories.includes(expense.categoryName)) {
          existing.categories.push(expense.categoryName);
        }
      } else {
        map.set(code, {
          irsCode: code,
          lineName: IRS_LINE_NAMES[code] || (code === 'other' ? 'Other / Uncategorized' : code),
          total: expense.amount,
          count: 1,
          categories: expense.categoryName ? [expense.categoryName] : [],
        });
      }
    });

    // Sort by IRS line number
    return Array.from(map.values()).sort((a, b) => {
      if (a.irsCode === 'other') return 1;
      if (b.irsCode === 'other') return -1;
      return a.irsCode.localeCompare(b.irsCode);
    });
  }, [allExpenses]);

  // Calculate totals
  const totalCategorized = useMemo(() => {
    return allExpenses
      .filter((e) => e.categoryId !== null)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [allExpenses]);

  const totalUncategorized = useMemo(() => {
    return allExpenses
      .filter((e) => e.categoryId === null)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [allExpenses]);

  const uncategorizedExpenses = useMemo(() => {
    return allExpenses.filter((e) => e.categoryId === null);
  }, [allExpenses]);

  const totalExpenses = useMemo(() => {
    return allExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [allExpenses]);

  return {
    expenses: allExpenses,
    byCategory,
    byIrsCode,
    totalCategorized,
    totalUncategorized,
    totalExpenses,
    uncategorizedExpenses,
    uncategorizedCount: uncategorizedExpenses.length,
    categories,
    loading,
    irsLineNames: IRS_LINE_NAMES,
  };
}
