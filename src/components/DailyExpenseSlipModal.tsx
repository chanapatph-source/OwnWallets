import { useState, useRef } from 'react';
import {
  X,
  Download,
  Share2,
  Check,
  Calendar,
  Sparkles,
  Receipt,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Clock,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Transaction, BudgetConfig } from '../types';
import { formatThaiCurrency, formatThaiDate } from '../lib/constants';
import { CategoryIcon } from './CategoryIcon';

interface DailyExpenseSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currentYearMonth?: string;
  budget?: BudgetConfig;
}

export const DailyExpenseSlipModal = ({
  isOpen,
  onClose,
  transactions,
  budget = { monthlyLimit: 15000, alertThreshold: 80 },
}: DailyExpenseSlipModalProps) => {
  // Today's date string YYYY-MM-DD
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const slipRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  // Filter transactions for selected date
  const dayTransactions = transactions.filter(t => t.date === selectedDate);
  const dayExpenses = dayTransactions.filter(t => t.type === 'expense');
  const dayIncomes = dayTransactions.filter(t => t.type === 'income');

  const totalDayExpense = dayExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalDayIncome = dayIncomes.reduce((sum, t) => sum + t.amount, 0);

  // Group expenses by category
  const categoryBreakdown = dayExpenses.reduce<Record<string, { name: string; amount: number }>>(
    (acc, t) => {
      if (!acc[t.categoryId]) {
        acc[t.categoryId] = { name: t.categoryName, amount: 0 };
      }
      acc[t.categoryId].amount += t.amount;
      return acc;
    },
    {}
  );

  // Daily budget reference (monthly / 30)
  const dailyBudgetRef = Math.round(budget.monthlyLimit / 30);
  const isOverDaily = totalDayExpense > dailyBudgetRef;

  // Navigate dates
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Generate unique slip reference number from date
  const slipRefNo = `SLIP-${selectedDate.replace(/-/g, '')}-${(totalDayExpense * 17) % 9000 + 1000}`;

  // Download slip image
  const handleSaveSlipImage = async () => {
    if (!slipRef.current || isSaving) return;
    setIsSaving(true);
    try {
      await new Promise(r => setTimeout(r, 150));
      const dataUrl = await toPng(slipRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#f8fafc',
      });

      const filename = `สลิปรายจ่าย_${selectedDate}.png`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to capture slip image:', err);
      alert('ไม่สามารถบันทึกรูปภาพสลิปได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy slip image to clipboard
  const handleCopySlip = async () => {
    if (!slipRef.current) return;
    try {
      const dataUrl = await toPng(slipRef.current, { quality: 0.95, pixelRatio: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback to direct download
      handleSaveSlipImage();
    }
  };

  return (
    <div
      id="daily-expense-slip-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="daily-expense-slip-modal"
        className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-5 text-white flex flex-col max-h-[95vh] animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">สลิปสรุปรายจ่ายประจำวัน</h3>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400">รูปภาพสลิปสรุปยอดค่าใช้จ่ายในแต่ละวัน</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center justify-between my-2.5 px-2 py-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs">
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            title="วันก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer text-center"
            />
          </div>

          <button
            onClick={() => handleShiftDate(1)}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            title="วันถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* The Digital Receipt / Financial Slip Container (Capture Target) */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-1">
          <div
            ref={slipRef}
            id="printable-daily-slip"
            className="relative bg-white text-slate-900 rounded-2xl p-5 shadow-xl border border-slate-200 overflow-hidden select-none font-sans"
          >
            {/* Top jagged teeth pattern */}
            <div className="absolute top-0 left-0 right-0 h-1.5 flex justify-between overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-slate-900 rotate-45 -translate-y-2 shrink-0"
                />
              ))}
            </div>

            {/* Slip Header */}
            <div className="text-center pt-2 pb-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-center gap-2 mb-1">
                <img
                  src="/apple-touch-icon.png"
                  alt="กระเป๋าตัง"
                  className="w-7 h-7 rounded-lg shadow-sm border border-slate-200 object-cover"
                />
                <span className="font-bold text-slate-900 text-sm tracking-tight">
                  บันทึกรายรับรายจ่าย
                </span>
              </div>
              <p className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">
                DAILY EXPENSE SUMMARY SLIP
              </p>
              <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                {formatThaiDate(selectedDate)}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-1">
                <Clock className="w-3 h-3" />
                <span>รหัสสลิป: {slipRefNo}</span>
              </div>
            </div>

            {/* Big Total Expense Banner */}
            <div className="py-4 text-center border-b border-dashed border-slate-300">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                ยอดรวมรายจ่ายประจำวัน
              </span>
              <div className="text-3xl font-extrabold text-rose-600 tracking-tight my-1">
                {formatThaiCurrency(totalDayExpense)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {dayExpenses.length} รายการ
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isOverDaily ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isOverDaily ? 'เกินเกณฑ์เฉลี่ย' : 'อยู่ในเกณฑ์ปกติ'}
                </span>
              </div>
            </div>

            {/* Itemized List */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
                <span>รายการใช้จ่าย ({dayExpenses.length})</span>
                <span>จำนวนเงิน</span>
              </div>

              {dayExpenses.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  ไม่มีรายการรายจ่ายในวันนี้
                </div>
              ) : (
                <div className="space-y-2">
                  {dayExpenses.map((tx, idx) => (
                    <div
                      key={tx.id || idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                          <CategoryIcon
                            iconName={tx.categoryId}
                            className="w-3 h-3 text-blue-600"
                          />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 truncate leading-tight">
                            {tx.note || tx.categoryName}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">
                            {tx.categoryName}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-rose-600 shrink-0">
                        -{formatThaiCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Income and Net Summary if income exists */}
            {totalDayIncome > 0 && (
              <div className="py-2.5 border-b border-dashed border-slate-300 text-xs flex items-center justify-between text-slate-600">
                <span>รายรับของวันนี้:</span>
                <span className="font-bold text-blue-600">+{formatThaiCurrency(totalDayIncome)}</span>
              </div>
            )}

            {/* Category Breakdown (if multiple) */}
            {Object.keys(categoryBreakdown).length > 1 && (
              <div className="py-3 border-b border-dashed border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  สรุปแยกตามหมวดหมู่
                </span>
                <div className="space-y-1">
                  {Object.entries(categoryBreakdown).map(([catId, cat]) => (
                    <div key={catId} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">{cat.name}</span>
                      <span className="font-semibold text-slate-800">
                        {formatThaiCurrency(cat.amount)} (
                        {((cat.amount / (totalDayExpense || 1)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Barcode & Verified Seal */}
            <div className="pt-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-700 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>บันทึกผ่านระบบกระเป๋าตังเรียบร้อย</span>
              </div>

              {/* Decorative Barcode */}
              <div className="flex justify-center items-center gap-[2px] h-6 py-1 opacity-70">
                {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2].map((w, i) => (
                  <div key={i} className="bg-slate-800 h-full" style={{ width: `${w}px` }} />
                ))}
              </div>
              <p className="text-[9px] text-slate-400 mt-1 font-mono">{slipRefNo}</p>
            </div>

            {/* Bottom jagged teeth pattern */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 flex justify-between overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-slate-900 rotate-45 translate-y-2 shrink-0"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 mt-2">
          <button
            onClick={handleCopySlip}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกรูปแล้ว</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-blue-400" />
                <span>คัดลอกรูปสลิป</span>
              </>
            )}
          </button>

          <button
            id="btn-save-daily-slip-image"
            onClick={handleSaveSlipImage}
            disabled={isSaving}
            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>เซฟรูปสลิป (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
