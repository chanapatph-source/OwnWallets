import { Transaction, BudgetConfig, MonthlyStats } from '../types';
import { ALL_CATEGORIES } from './constants';

const TRANSACTIONS_KEY = 'my_expense_tracker_transactions';
const BUDGET_KEY = 'my_expense_tracker_budget';
const SPREADSHEET_ID_KEY = 'my_expense_tracker_spreadsheet_id';

export const DEFAULT_BUDGET: BudgetConfig = {
  monthlyLimit: 18000,
  alertThreshold: 80, // alert at 80%
  categoryBudgets: {
    food: 7000,
    transport: 2500,
    shopping: 3500,
    bills: 3000,
    entertainment: 2000,
  },
};

// Generate realistic initial starter data if user has none
export const generateInitialData = (): Transaction[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const pad = (d: number) => String(d).padStart(2, '0');

  return [
    {
      id: 'tx-init-1',
      type: 'income',
      amount: 32000,
      categoryId: 'salary',
      categoryName: 'เงินเดือน / ค่าจ้าง',
      date: `${year}-${month}-01`,
      note: 'เงินเดือนประจำเดือน',
      createdAt: Date.now() - 86400000 * 15,
    },
    {
      id: 'tx-init-2',
      type: 'income',
      amount: 4500,
      categoryId: 'freelance',
      categoryName: 'ฟรีแลนซ์ / รับจ๊อบพิเศษ',
      date: `${year}-${month}-10`,
      note: 'งานออกแบบกราฟิก',
      createdAt: Date.now() - 86400000 * 8,
    },
    {
      id: 'tx-init-3',
      type: 'expense',
      amount: 3200,
      categoryId: 'bills',
      categoryName: 'ค่าน้ำ-ไฟ / ที่พัก / อินเทอร์เน็ต',
      date: `${year}-${month}-03`,
      note: 'ค่าอินเทอร์เน็ตและค่าไฟ',
      createdAt: Date.now() - 86400000 * 14,
    },
    {
      id: 'tx-init-4',
      type: 'expense',
      amount: 1250,
      categoryId: 'transport',
      categoryName: 'การเดินทาง / น้ำมัน',
      date: `${year}-${month}-05`,
      note: 'เติมน้ำมันรถ',
      createdAt: Date.now() - 86400000 * 12,
    },
    {
      id: 'tx-init-5',
      type: 'expense',
      amount: 380,
      categoryId: 'food',
      categoryName: 'อาหารและเครื่องดื่ม',
      date: `${year}-${month}-07`,
      note: 'มื้อเที่ยงและกาแฟ',
      createdAt: Date.now() - 86400000 * 10,
    },
    {
      id: 'tx-init-6',
      type: 'expense',
      amount: 1850,
      categoryId: 'shopping',
      categoryName: 'ช้อปปิ้ง / ของใช้',
      date: `${year}-${month}-09`,
      note: 'ซื้อของใช้ในบ้านและซูเปอร์มาร์เก็ต',
      createdAt: Date.now() - 86400000 * 9,
    },
    {
      id: 'tx-init-7',
      type: 'expense',
      amount: 520,
      categoryId: 'entertainment',
      categoryName: 'บันเทิง / ท่องเที่ยว',
      date: `${year}-${month}-12`,
      note: 'ตั๋วหนังและป๊อปคอร์น',
      createdAt: Date.now() - 86400000 * 6,
    },
    {
      id: 'tx-init-8',
      type: 'expense',
      amount: 450,
      categoryId: 'food',
      categoryName: 'อาหารและเครื่องดื่ม',
      date: `${year}-${month}-14`,
      note: 'ชาบูมื้อเย็นกับเพื่อน',
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'tx-init-9',
      type: 'expense',
      amount: 800,
      categoryId: 'transport',
      categoryName: 'การเดินทาง / น้ำมัน',
      date: `${year}-${month}-${pad(Math.min(now.getDate(), 17))}`,
      note: 'ค่าทางด่วนและ BTS',
      createdAt: Date.now() - 86400000 * 1,
    },
    {
      id: 'tx-init-10',
      type: 'expense',
      amount: 320,
      categoryId: 'food',
      categoryName: 'อาหารและเครื่องดื่ม',
      date: `${year}-${month}-${pad(now.getDate())}`,
      note: 'ข้าวกะเพรา + ชานมไข่มุก',
      createdAt: Date.now(),
    },
  ];
};

export const getStoredTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      const initial = generateInitialData();
      saveStoredTransactions(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return generateInitialData();
  }
};

export const saveStoredTransactions = (transactions: Transaction[]) => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage:', err);
  }
};

export const getStoredBudget = (): BudgetConfig => {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    if (!raw) return DEFAULT_BUDGET;
    return { ...DEFAULT_BUDGET, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BUDGET;
  }
};

export const saveStoredBudget = (budget: BudgetConfig) => {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
  } catch (err) {
    console.error('Failed to save budget to localStorage:', err);
  }
};

export const getStoredSpreadsheetId = (): string | null => {
  return localStorage.getItem(SPREADSHEET_ID_KEY);
};

export const saveStoredSpreadsheetId = (id: string) => {
  localStorage.setItem(SPREADSHEET_ID_KEY, id);
};

// Calculate monthly statistics
export const calculateMonthlyStats = (
  transactions: Transaction[],
  yearMonth: string,
  budget: BudgetConfig
): MonthlyStats => {
  const monthItems = transactions.filter(t => t.date.startsWith(yearMonth));

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseCatMap: Record<string, number> = {};
  const dailyMap: Record<number, number> = {};

  monthItems.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      expenseCatMap[t.categoryId] = (expenseCatMap[t.categoryId] || 0) + t.amount;

      const day = parseInt(t.date.split('-')[2], 10);
      dailyMap[day] = (dailyMap[day] || 0) + t.amount;
    }
  });

  const expenseByCategory = Object.entries(expenseCatMap)
    .map(([catId, amount]) => {
      const cat = ALL_CATEGORIES.find(c => c.id === catId);
      return {
        categoryId: catId,
        categoryName: cat ? cat.name : catId,
        color: cat ? cat.color : '#94a3b8',
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const daysInMonth = 31;
  const dailyExpenses = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    date: `${yearMonth}-${String(i + 1).padStart(2, '0')}`,
    amount: dailyMap[i + 1] || 0,
  }));

  const budgetUsedPercent = budget.monthlyLimit > 0
    ? (totalExpense / budget.monthlyLimit) * 100
    : 0;

  const isOverBudget = totalExpense > budget.monthlyLimit;
  const budgetRemaining = budget.monthlyLimit - totalExpense;

  return {
    yearMonth,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    expenseByCategory,
    dailyExpenses,
    isOverBudget,
    budgetUsedPercent,
    budgetRemaining,
  };
};
