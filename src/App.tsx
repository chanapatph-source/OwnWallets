import { useState, useEffect, useMemo, useRef } from 'react';
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
  Camera,
  Home,
  Monitor,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { toPng } from 'html-to-image';
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
import { CapturePreviewModal } from './components/CapturePreviewModal';
import { AddToHomeScreenModal } from './components/AddToHomeScreenModal';

export default function App() {
  // Current active date month
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'history'>('overview');

  // Stored state
  const [transactions, setTransactions] = useState<Transaction[]>(getStoredTransactions);
  const [budget, setBudget] = useState<BudgetConfig>(getStoredBudget);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isA2HSOpen, setIsA2HSOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Screen capture states
  const screenRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [capturedFilename, setCapturedFilename] = useState<string>('');
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [captureSuccessToast, setCaptureSuccessToast] = useState(false);

  // Device frame vs Full web mode
  const [isDeviceFramed, setIsDeviceFramed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return false; // Auto fluid on mobile screen
    }
    const saved = localStorage.getItem('app_device_framed');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleDeviceFrame = () => {
    setIsDeviceFramed(prev => {
      const next = !prev;
      localStorage.setItem('app_device_framed', String(next));
      return next;
    });
  };

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

  // Screen capture action
  const handleCaptureScreen = async () => {
    if (!screenRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      // Brief settling delay
      await new Promise(r => setTimeout(r, 120));

      const dataUrl = await toPng(screenRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
      });

      const now = new Date();
      const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `สรุปการเงิน_${currentYearMonth}_${datePart}_${timePart}.png`;

      setCapturedImageUrl(dataUrl);
      setCapturedFilename(filename);
      setIsCaptureModalOpen(true);

      // Auto download
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Toast notification
      setCaptureSuccessToast(true);
      setTimeout(() => setCaptureSuccessToast(false), 3000);
    } catch (err) {
      console.error('Screen capture failed:', err);
      alert('ไม่สามารถบันทึกภาพหน้าจอได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCapturing(false);
    }
  };

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
      screenRef={screenRef}
      onCaptureScreen={handleCaptureScreen}
      onOpenA2HS={() => setIsA2HSOpen(true)}
      isCapturing={isCapturing}
      isDeviceFramed={isDeviceFramed}
      onToggleDeviceFrame={handleToggleDeviceFrame}
    >
      <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 pb-24 relative min-h-full">
        {/* iOS / Web App Header in Blue Theme */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-100/80 shadow-2xs">
          <div className="px-4 py-2.5 flex items-center justify-between gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
                <Wallet className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    บันทึกรายรับรายจ่าย
                  </h1>
                </div>
                <p className="text-[10px] text-blue-600 font-medium leading-none">
                  โทนสีฟ้าน้ำเงิน • {formatMonthLabel(currentYearMonth)}
                </p>
              </div>
            </div>

            {/* Top Actions: Capture screen, Month select, Settings */}
            <div className="flex items-center gap-1.5">
              {/* Quick Capture Button on Header */}
              <button
                id="btn-header-capture-screen"
                onClick={handleCaptureScreen}
                disabled={isCapturing}
                className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-colors active:scale-95 shadow-2xs flex items-center gap-1 text-xs font-semibold"
                title="แคปหน้าจอเพื่อบันทึกเป็นรูปภาพ"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline text-[11px]">แคปรูป</span>
              </button>

              {/* Month Selector dropdown */}
              <select
                id="select-active-month"
                value={currentYearMonth}
                onChange={e => setCurrentYearMonth(e.target.value)}
                aria-label="เลือกเดือน"
                className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-700 outline-none cursor-pointer transition-colors max-w-[105px] sm:max-w-[120px] truncate"
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
                <SlidersHorizontal className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          </div>
        </header>

        {/* Capture Success Toast */}
        {captureSuccessToast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl border border-blue-500/40 flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>แคปและบันทึกรูปภาพเรียบร้อยแล้ว!</span>
          </div>
        )}

        {/* Main Scrollable Content */}
        <main className="flex-1 px-3.5 sm:px-5 pt-3 space-y-3.5">
          {/* Real-time Budget Alert Banner */}
          <BudgetAlertBanner
            totalExpense={stats.totalExpense}
            budget={budget}
            onOpenSettings={() => setIsBudgetModalOpen(true)}
          />

          {/* iOS Segmented Control in Royal Blue Theme */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-2xl">
            <button
              id="tab-view-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ภาพรวม
            </button>

            <button
              id="tab-view-charts"
              onClick={() => setActiveTab('charts')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'charts'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กราฟสรุป
            </button>

            <button
              id="tab-view-history"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ประวัติ ({transactions.length})
            </button>
          </div>

          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-3.5">
              {/* Quick Summary Cards (Blue Theme Accents) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* Income */}
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-blue-100 shadow-2xs">
                  <div className="flex items-center gap-1 text-blue-600 mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">รายรับ</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-800 truncate">
                    {formatThaiCurrency(stats.totalIncome)}
                  </div>
                </div>

                {/* Expense */}
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-rose-100 shadow-2xs">
                  <div className="flex items-center gap-1 text-rose-500 mb-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">รายจ่าย</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-rose-600 truncate">
                    {formatThaiCurrency(stats.totalExpense)}
                  </div>
                </div>

                {/* Balance */}
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                    <Wallet className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold">คงเหลือ</span>
                  </div>
                  <div
                    className={`text-sm sm:text-base font-bold truncate ${
                      stats.balance >= 0 ? 'text-blue-700 font-extrabold' : 'text-rose-600 font-extrabold'
                    }`}
                  >
                    {formatThaiCurrency(stats.balance)}
                  </div>
                </div>
              </div>

              {/* Quick Add CTA Banner (Deep Blue Gradient) */}
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 rounded-2xl p-3.5 text-white flex items-center justify-between gap-2 shadow-md shadow-blue-700/20">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                    <h2 className="font-bold text-xs sm:text-sm">จดบันทึกรายรับรายจ่าย</h2>
                  </div>
                  <p className="text-[11px] text-blue-100">
                    บันทึกรวดเร็ว คุมงบได้แม่นยำ
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-quick-add-cta"
                    onClick={() => {
                      setEditingTransaction(null);
                      setIsAddModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 active:scale-95 transition-all text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-700 stroke-[2.5]" />
                    <span>+ บันทึก</span>
                  </button>
                </div>
              </div>

              {/* Home Screen App Icon Prompt Banner */}
              <div
                onClick={() => setIsA2HSOpen(true)}
                className="cursor-pointer bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-3 text-white flex items-center justify-between gap-3 border border-slate-700/60 shadow-xs hover:border-blue-400/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src="/apple-touch-icon.png"
                      alt="กระเป๋าตังสีแดง"
                      className="w-9 h-9 rounded-xl object-cover shadow-md border border-white/20"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border border-slate-900" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Add to Home Screen</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                        กระเป๋าตังสีแดง
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">
                      แตะเพื่อดูวิธีติดตั้งเป็นแอปบน iPhone และ Android
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-[11px] font-bold text-sky-400 hover:underline">
                  ดูวิธีทำ &gt;
                </span>
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
                  <span>รีเซ็ตตัวอย่าง</span>
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

        {/* iOS 18 Bottom Tab Bar Dock (Deep Blue Theme) */}
        <nav className="fixed bottom-3 left-0 right-0 z-30 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto bg-white/95 backdrop-blur-xl border border-blue-100 rounded-3xl shadow-xl shadow-blue-900/15 px-3 py-1.5 flex items-center justify-around">
            <button
              id="dock-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 transition-colors ${
                activeTab === 'overview' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-[10px]">ภาพรวม</span>
            </button>

            <button
              id="dock-tab-charts"
              onClick={() => setActiveTab('charts')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 transition-colors ${
                activeTab === 'charts' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px]">กราฟ</span>
            </button>

            {/* Central iOS Add Button in Deep Blue / Royal Blue */}
            <button
              id="btn-fab-add-transaction"
              onClick={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              className="w-11 h-11 -my-2 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/35 hover:scale-105 active:scale-95 transition-all"
              title="จดบันทึกรายการ"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              id="dock-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 transition-colors ${
                activeTab === 'history' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span className="text-[10px]">ประวัติ</span>
            </button>

            <button
              id="btn-open-export-modal"
              onClick={() => setIsExportModalOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-slate-400 hover:text-blue-600 transition-colors"
              title="ส่งออก Excel / ซิงค์ Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-[10px]">ส่งออก</span>
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

        {/* Capture Preview Modal */}
        <CapturePreviewModal
          isOpen={isCaptureModalOpen}
          onClose={() => setIsCaptureModalOpen(false)}
          imageUrl={capturedImageUrl}
          filename={capturedFilename}
        />

        {/* Add to Home Screen Instructions Modal */}
        <AddToHomeScreenModal
          isOpen={isA2HSOpen}
          onClose={() => setIsA2HSOpen(false)}
        />
      </div>
    </IPhone16Frame>
  );
}
