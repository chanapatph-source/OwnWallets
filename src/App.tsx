import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  BarChart3,
  ListOrdered,
  FileSpreadsheet,
  SlidersHorizontal,
  Wallet,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Transaction, BudgetConfig } from './types';
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredBudget,
  saveStoredBudget,
  calculateMonthlyStats,
  generateInitialData,
} from './lib/storage';
import { formatThaiCurrency, formatMonthLabel } from './lib/constants';
import { initAuth } from './lib/auth';
import { IPhone16Frame } from './components/IPhone16Frame';
import { BudgetAlertBanner } from './components/BudgetAlertBanner';
import { MonthlyChartSummary } from './components/MonthlyChartSummary';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BudgetSettingsModal } from './components/BudgetSettingsModal';
import { ExportSyncModal } from './components/ExportSyncModal';

export default function App() {
  // Current active date month
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Navigation tab for mobile
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'history'>('overview');

  // Stored state
  const [transactions, setTransactions] = useState<Transaction[]>(getStoredTransactions);
  const [budget, setBudget] = useState<BudgetConfig>(getStoredBudget);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Auth state for Google Sheets
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cachedToken, setCachedToken] = useState<string | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setCachedToken(token);
      },
      () => {
        // user not signed in yet or token expired
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Compute monthly statistics
  const stats = useMemo(() => {
    return calculateMonthlyStats(transactions, currentYearMonth, budget);
  }, [transactions, currentYearMonth, budget]);

  // Save transactions to storage whenever updated
  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    if (editingTransaction) {
      // Edit existing
      const updated = transactions.map(t =>
        t.id === editingTransaction.id
          ? { ...t, ...data }
          : t
      );
      setTransactions(updated);
      saveStoredTransactions(updated);
      setEditingTransaction(null);
    } else {
      // Create new
      const newTx: Transaction = {
        ...data,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: Date.now(),
      };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      saveStoredTransactions(updated);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveStoredTransactions(updated);
  };

  const handleSaveBudget = (newBudget: BudgetConfig) => {
    setBudget(newBudget);
    saveStoredBudget(newBudget);
  };

  const handleResetSampleData = () => {
    if (confirm('ต้องการรีเซ็ตข้อมูลเป็นตัวอย่างเริ่มต้นหรือไม่?')) {
      const initial = generateInitialData();
      setTransactions(initial);
      saveStoredTransactions(initial);
    }
  };

  // Month options for quick selector
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentYearMonth);
    transactions.forEach(t => {
      const ym = t.date.slice(0, 7);
      if (ym) monthsSet.add(ym);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions, currentYearMonth]);

  return (
    <IPhone16Frame
      budgetStatus={{
        isOver: stats.isOverBudget,
        percent: stats.budgetUsedPercent,
        text: stats.isOverBudget
          ? `เกินงบ ${formatThaiCurrency(Math.abs(stats.budgetRemaining))}`
          : `เหลืองบ ${formatThaiCurrency(stats.budgetRemaining)}`,
      }}
    >
      <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 pb-20 relative">
        {/* iOS App Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-2xs">
          <div className="px-4 py-2.5 flex items-center justify-between gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  บันทึกรายรับรายจ่าย
                </h1>
                <p className="text-[10px] text-slate-400 leading-none">
                  {formatMonthLabel(currentYearMonth)}
                </p>
              </div>
            </div>

            {/* Top Actions */}
            <div className="flex items-center gap-1.5">
              {/* Month Selector dropdown */}
              <select
                id="select-active-month"
                value={currentYearMonth}
                onChange={e => setCurrentYearMonth(e.target.value)}
                aria-label="เลือกเดือน"
                className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-700 outline-none cursor-pointer transition-colors max-w-[110px] truncate"
              >
                {availableMonths.map(ym => (
                  <option key={ym} value={ym}>
                    {formatMonthLabel(ym)}
                  </option>
                ))}
              </select>

              {/* Budget Settings Button */}
              <button
                id="btn-open-budget-modal"
                onClick={() => setIsBudgetModalOpen(true)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors active:scale-95 shadow-2xs"
                title="ตั้งค่างบประมาณ"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 px-3.5 sm:px-4 pt-3 space-y-3.5">
          {/* Real-time Budget Alert Banner */}
          <BudgetAlertBanner
            totalExpense={stats.totalExpense}
            budget={budget}
            onOpenSettings={() => setIsBudgetModalOpen(true)}
          />

          {/* iOS Segmented Control */}
          <div className="flex items-center p-0.5 bg-slate-200/70 rounded-xl">
            <button
              id="tab-view-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ภาพรวม
            </button>

            <button
              id="tab-view-charts"
              onClick={() => setActiveTab('charts')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'charts'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กราฟสรุป
            </button>

            <button
              id="tab-view-history"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ประวัติ ({transactions.length})
            </button>
          </div>

          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-3.5">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-3 gap-2">
                {/* Income */}
                <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-2xs">
                  <div className="flex items-center gap-1 text-emerald-600 mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">รายรับ</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-800 truncate">
                    {formatThaiCurrency(stats.totalIncome)}
                  </div>
                </div>

                {/* Expense */}
                <div className="bg-white rounded-2xl p-3 border border-rose-100 shadow-2xs">
                  <div className="flex items-center gap-1 text-rose-500 mb-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">รายจ่าย</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-rose-600 truncate">
                    {formatThaiCurrency(stats.totalExpense)}
                  </div>
                </div>

                {/* Balance */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">คงเหลือ</span>
                  </div>
                  <div
                    className={`text-sm sm:text-base font-bold truncate ${
                      stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatThaiCurrency(stats.balance)}
                  </div>
                </div>
              </div>

              {/* Quick Add CTA Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-3.5 text-white flex items-center justify-between gap-2 shadow-sm shadow-emerald-600/15">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <h2 className="font-bold text-xs sm:text-sm">จดบันทึกด่วน</h2>
                  </div>
                  <p className="text-[11px] text-emerald-100">
                    บันทึกได้ใน 5 วินาที
                  </p>
                </div>

                <button
                  id="btn-quick-add-cta"
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsAddModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 transition-all text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-700" />
                  <span>+ เพิ่ม</span>
                </button>
              </div>

              {/* Month's Transactions List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-bold text-xs text-slate-700">
                    รายการประจำ {formatMonthLabel(currentYearMonth)}
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    {transactions.filter(t => t.date.startsWith(currentYearMonth)).length} รายการ
                  </span>
                </div>

                <TransactionList
                  transactions={transactions.filter(t => t.date.startsWith(currentYearMonth))}
                  onEdit={tx => {
                    setEditingTransaction(tx);
                    setIsAddModalOpen(true);
                  }}
                  onDelete={handleDeleteTransaction}
                  onOpenAddModal={() => {
                    setEditingTransaction(null);
                    setIsAddModalOpen(true);
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Monthly Graphs & Charts */}
          {activeTab === 'charts' && (
            <MonthlyChartSummary
              stats={stats}
              selectedMonth={currentYearMonth}
              onMonthChange={setCurrentYearMonth}
            />
          )}

          {/* TAB 3: All History with Search */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-bold text-xs text-slate-700">ประวัติรายการทั้งหมด</h2>
                <button
                  onClick={handleResetSampleData}
                  className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  title="รีเซ็ตตัวอย่างข้อมูล"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>รีเซ็ต</span>
                </button>
              </div>

              <TransactionList
                transactions={transactions}
                onEdit={tx => {
                  setEditingTransaction(tx);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteTransaction}
                onOpenAddModal={() => {
                  setEditingTransaction(null);
                  setIsAddModalOpen(true);
                }}
              />
            </div>
          )}
        </main>

        {/* iOS 18 Bottom Tab Bar Dock */}
        <nav className="fixed bottom-3 left-0 right-0 z-30 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-900/10 px-3 py-1.5 flex items-center justify-around">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 transition-colors ${
                activeTab === 'overview' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-[10px] font-medium">ภาพรวม</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 transition-colors ${
                activeTab === 'charts' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-medium">กราฟ</span>
            </button>

            {/* Central iOS Add Button */}
            <button
              id="btn-fab-add-transaction"
              onClick={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              className="w-11 h-11 -my-2 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all"
              title="จดบันทึกรายการ"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 transition-colors ${
                activeTab === 'history' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span className="text-[10px] font-medium">ประวัติ</span>
            </button>

            <button
              id="btn-open-export-modal"
              onClick={() => setIsExportModalOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-slate-400 hover:text-emerald-600 transition-colors"
              title="ส่งออก Excel / ซิงค์ Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-[10px] font-medium">ส่งออก</span>
            </button>
          </div>
        </nav>

        {/* Modals */}
        <TransactionModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          initialTransaction={editingTransaction}
        />

        <BudgetSettingsModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          budget={budget}
          onSave={handleSaveBudget}
        />

        <ExportSyncModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          transactions={transactions}
          selectedMonth={currentYearMonth}
          currentUser={currentUser}
          cachedToken={cachedToken}
          onUserAuthChange={(user, token) => {
            setCurrentUser(user);
            setCachedToken(token);
          }}
        />
      </div>
    </IPhone16Frame>
  );
}
