import { AlertTriangle, AlertCircle, CheckCircle2, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { formatThaiCurrency } from '../lib/constants';
import { BudgetConfig } from '../types';

interface BudgetAlertBannerProps {
  totalExpense: number;
  budget: BudgetConfig;
  onOpenSettings: () => void;
}

export const BudgetAlertBanner = ({
  totalExpense,
  budget,
  onOpenSettings,
}: BudgetAlertBannerProps) => {
  const limit = budget.monthlyLimit || 1;
  const percent = (totalExpense / limit) * 100;
  const remaining = limit - totalExpense;
  const isOver = totalExpense > limit;
  const isWarning = !isOver && percent >= budget.alertThreshold;

  // Over budget
  if (isOver) {
    const overAmount = totalExpense - limit;
    return (
      <div
        id="budget-alert-danger"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 p-4 sm:p-5 text-white shadow-lg shadow-rose-500/20 border border-rose-400/30 animate-pulse-subtle"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white text-rose-700 text-xs font-bold uppercase tracking-wider">
                  แจ้งเตือนด่วน
                </span>
                <h3 className="font-semibold text-base sm:text-lg">ใช้เงินเกินงบประมาณที่กำหนดแล้ว!</h3>
              </div>
              <p className="text-sm text-rose-100 mt-1">
                คุณใช้จ่ายไปแล้ว <span className="font-bold text-white">{formatThaiCurrency(totalExpense)}</span> จากงบที่ตั้งไว้ {formatThaiCurrency(limit)} (เกินไปแล้ว <span className="font-bold underline decoration-white decoration-2">{formatThaiCurrency(overAmount)}</span> หรือ {percent.toFixed(1)}%)
              </p>
            </div>
          </div>

          <button
            id="btn-adjust-budget-danger"
            onClick={onOpenSettings}
            className="self-end sm:self-center shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 active:scale-95 transition-all text-xs sm:text-sm font-semibold shadow-md"
          >
            <SlidersHorizontal className="w-4 h-4" />
            ปรับงบประมาณ
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5 w-full bg-black/25 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  }

  // Warning (Near limit)
  if (isWarning) {
    return (
      <div
        id="budget-alert-warning"
        className="rounded-2xl bg-amber-50 border border-amber-300 p-4 sm:p-5 text-amber-950 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-xs font-semibold">
                  แจ้งเตือนใกล้ถึงงบ ({percent.toFixed(0)}%)
                </span>
                <h3 className="font-semibold text-base text-amber-900">ใกล้แตะงบประมาณที่กำหนดแล้ว</h3>
              </div>
              <p className="text-sm text-amber-800 mt-1">
                ใช้ไปแล้ว <span className="font-semibold">{formatThaiCurrency(totalExpense)}</span> เหลือใช้ได้อีก <span className="font-bold text-amber-900">{formatThaiCurrency(remaining)}</span>
              </p>
            </div>
          </div>

          <button
            id="btn-adjust-budget-warning"
            onClick={onOpenSettings}
            className="self-end sm:self-center shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs sm:text-sm font-semibold transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            ปรับงบ
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5 w-full bg-amber-200/60 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  // Normal safe state
  return (
    <div
      id="budget-alert-safe"
      className="rounded-2xl bg-white border border-blue-100 p-4 sm:p-4.5 text-slate-800 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">สถานะงบประมาณเดือนนี้</span>
              <span className="px-1.5 py-0.5 text-[11px] font-medium bg-blue-100 text-blue-800 rounded">
                อยู่ในเกณฑ์ดี ({percent.toFixed(0)}%)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 truncate mt-0.5">
              ใช้ไป {formatThaiCurrency(totalExpense)} / เหลืองบ <span className="font-semibold text-blue-600">{formatThaiCurrency(remaining)}</span>
            </p>
          </div>
        </div>

        <button
          id="btn-adjust-budget-normal"
          onClick={onOpenSettings}
          className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
        >
          <span>งบ {formatThaiCurrency(limit)}</span>
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
};
