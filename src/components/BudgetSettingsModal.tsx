import { useState } from 'react';
import { X, Check, Sliders, BellRing, Target, AlertCircle } from 'lucide-react';
import { BudgetConfig } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, formatThaiCurrency } from '../lib/constants';

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetConfig;
  onSave: (newBudget: BudgetConfig) => void;
}

export const BudgetSettingsModal = ({
  isOpen,
  onClose,
  budget,
  onSave,
}: BudgetSettingsModalProps) => {
  const [monthlyLimit, setMonthlyLimit] = useState<string>(String(budget.monthlyLimit));
  const [alertThreshold, setAlertThreshold] = useState<number>(budget.alertThreshold || 80);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    DEFAULT_EXPENSE_CATEGORIES.forEach(cat => {
      map[cat.id] = budget.categoryBudgets?.[cat.id] ? String(budget.categoryBudgets[cat.id]) : '';
    });
    return map;
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(monthlyLimit);
    if (isNaN(limitNum) || limitNum < 0) {
      alert('กรุณากรอกงบประมาณรายเดือนที่ถูกต้อง');
      return;
    }

    const catBudgetNums: Record<string, number> = {};
    Object.entries(categoryBudgets).forEach(([id, val]) => {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) {
        catBudgetNums[id] = n;
      }
    });

    onSave({
      monthlyLimit: limitNum,
      alertThreshold,
      categoryBudgets: catBudgetNums,
    });

    onClose();
  };

  return (
    <div
      id="budget-settings-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="budget-settings-modal"
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">ตั้งค่างบประมาณและการแจ้งเตือน</h2>
              <p className="text-xs text-slate-400">กำหนดเพดานค่าใช้จ่ายเพื่อควบคุมการใช้เงิน</p>
            </div>
          </div>
          <button
            id="btn-close-budget-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Main Monthly Budget */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              งบประมาณรายเดือนรวม (บาท) *
            </label>
            <div className="flex items-center mt-2">
              <span className="text-2xl font-bold text-emerald-600 mr-2">฿</span>
              <input
                id="input-monthly-budget-limit"
                type="number"
                step="any"
                inputMode="decimal"
                value={monthlyLimit}
                onChange={e => setMonthlyLimit(e.target.value)}
                placeholder="เช่น 15000"
                className="w-full bg-transparent text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-300"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              ระบบจะแจ้งเตือนเมื่อยอดรวมรายจ่ายในแต่ละเดือนใกล้ถึงหรือเกินงบนี้
            </p>
          </div>

          {/* Alert Threshold Setting */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-amber-500" />
                เริ่มแจ้งเตือนล่วงหน้าเมื่อใช้เงินถึง:
              </label>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {alertThreshold}% ของงบ
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[70, 80, 90, 100].map(th => (
                <button
                  type="button"
                  key={th}
                  onClick={() => setAlertThreshold(th)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    alertThreshold === th
                      ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {th}%
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                เมื่อยอดถึง {((parseFloat(monthlyLimit) || 0) * (alertThreshold / 100)).toLocaleString()} บาท
                ระบบจะขึ้นแถบแจ้งเตือนเตือนสติทันที
              </span>
            </div>
          </div>

          {/* Sub-category Budgets (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              งบย่อยตามหมวดหมู่ (ไม่บังคับ)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {DEFAULT_EXPENSE_CATEGORIES.slice(0, 5).map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
                >
                  <span className="text-xs font-medium text-slate-700 truncate">{cat.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-slate-400">฿</span>
                    <input
                      type="number"
                      value={categoryBudgets[cat.id] || ''}
                      onChange={e =>
                        setCategoryBudgets({ ...categoryBudgets, [cat.id]: e.target.value })
                      }
                      placeholder="ไม่งบ"
                      className="w-24 px-2 py-1 text-right text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              id="btn-save-budget-settings"
              type="submit"
              className="w-full py-3.5 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <Check className="w-5 h-5" />
              <span>บันทึกการตั้งค่างบประมาณ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
