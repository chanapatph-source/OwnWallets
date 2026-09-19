export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: number;
}

export interface BudgetConfig {
  monthlyLimit: number;
  alertThreshold: number; // percentage, e.g. 80
  categoryBudgets?: Record<string, number>; // categoryId -> limit
}

export interface MonthlyStats {
  yearMonth: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expenseByCategory: {
    categoryId: string;
    categoryName: string;
    color: string;
    amount: number;
    percentage: number;
  }[];
  dailyExpenses: {
    day: number;
    date: string;
    amount: number;
  }[];
  isOverBudget: boolean;
  budgetUsedPercent: number;
  budgetRemaining: number;
}
