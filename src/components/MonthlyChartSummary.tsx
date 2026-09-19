import { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, PieChart as PieChartIcon, Calendar, Wallet } from 'lucide-react';
import { MonthlyStats } from '../types';
import { formatThaiCurrency, formatMonthLabel } from '../lib/constants';
import { CategoryIcon } from './CategoryIcon';
import { ALL_CATEGORIES } from '../lib/constants';

interface MonthlyChartSummaryProps {
  stats: MonthlyStats;
  selectedMonth: string; // YYYY-MM
  onMonthChange: (newMonth: string) => void;
}

export const MonthlyChartSummary = ({
  stats,
  selectedMonth,
  onMonthChange,
}: MonthlyChartSummaryProps) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'daily'>('categories');
  const [hoveredDay, setHoveredDay] = useState<{ day: number; amount: number } | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newY = prevDate.getFullYear();
    const newM = String(prevDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newY = nextDate.getFullYear();
    const newM = String(nextDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${newY}-${newM}`);
  };

  const maxDailyExpense = Math.max(...stats.dailyExpenses.map(d => d.amount), 1);
  const totalBoth = stats.totalIncome + stats.totalExpense;
  const incomeShare = totalBoth > 0 ? (stats.totalIncome / totalBoth) * 100 : 50;
  const expenseShare = totalBoth > 0 ? (stats.totalExpense / totalBoth) * 100 : 50;

  return (
    <div id="monthly-chart-summary" className="space-y-4">
      {/* Month Navigator Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-xs border border-slate-200/80">
        <button
          id="btn-prev-month"
          onClick={handlePrevMonth}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">เดือนก่อน</span>
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {formatMonthLabel(selectedMonth)}
          </h2>
        </div>

        <button
          id="btn-next-month"
          onClick={handleNextMonth}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold"
        >
          <span className="hidden sm:inline">เดือนถัดไป</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Metric Cards: Income, Expense, Balance */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Total Income */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-semibold">รายรับ</span>
          </div>
          <div className="text-sm sm:text-lg font-bold text-slate-800 truncate">
            {formatThaiCurrency(stats.totalIncome)}
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-rose-100 shadow-xs">
          <div className="flex items-center gap-1.5 text-rose-500 mb-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-semibold">รายจ่าย</span>
          </div>
          <div className="text-sm sm:text-lg font-bold text-rose-600 truncate">
            {formatThaiCurrency(stats.totalExpense)}
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Wallet className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-semibold">คงเหลือ</span>
          </div>
          <div
            className={`text-sm sm:text-lg font-bold truncate ${
              stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatThaiCurrency(stats.balance)}
          </div>
        </div>
      </div>

      {/* Visual Proportion Bar (Income vs Expense) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
          <span>สัดส่วนรายรับ vs รายจ่าย</span>
          <span className="text-slate-500 font-normal text-[11px]">
            {stats.totalIncome > 0
              ? `อัตราการออม ${Math.max(0, ((stats.balance / stats.totalIncome) * 100)).toFixed(0)}%`
              : ''}
          </span>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${incomeShare}%` }}
            title={`รายรับ: ${formatThaiCurrency(stats.totalIncome)}`}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${expenseShare}%` }}
            title={`รายจ่าย: ${formatThaiCurrency(stats.totalExpense)}`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mt-2">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            รายรับ ({incomeShare.toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            รายจ่าย ({expenseShare.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Chart View Tabs: Category Breakdown vs Daily Trend */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-1.5">
            <PieChartIcon className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              การวิเคราะห์รายจ่าย
            </h3>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              id="tab-chart-categories"
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'categories'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              แยกหมวดหมู่
            </button>
            <button
              id="tab-chart-daily"
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'daily'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              กราฟรายวัน
            </button>
          </div>
        </div>

        {/* Tab 1: Categories Breakdown */}
        {activeTab === 'categories' && (
          <div className="space-y-3">
            {stats.expenseByCategory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                ยังไม่มีรายการรายจ่ายในเดือนนี้
              </div>
            ) : (
              stats.expenseByCategory.map(item => {
                const catInfo = ALL_CATEGORIES.find(c => c.id === item.categoryId);
                return (
                  <div key={item.categoryId} className="group">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: item.color }}
                        >
                          <CategoryIcon
                            iconName={catInfo?.icon || 'Tag'}
                            className="w-3.5 h-3.5"
                          />
                        </div>
                        <span className="text-slate-700 font-semibold truncate">
                          {item.categoryName}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-800">
                          {formatThaiCurrency(item.amount)}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1.5">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress distribution bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Daily Spending Trend Bar Chart */}
        {activeTab === 'daily' && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>กราฟแท่งแสดงรายจ่ายในแต่ละวัน (วันที่ 1 - 31)</span>
              {hoveredDay && hoveredDay.amount > 0 && (
                <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  วันที่ {hoveredDay.day}: {formatThaiCurrency(hoveredDay.amount)}
                </span>
              )}
            </div>

            <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-1 border-b border-slate-200">
              {stats.dailyExpenses.map(item => {
                const heightPercent =
                  item.amount > 0 ? Math.max((item.amount / maxDailyExpense) * 100, 8) : 0;
                return (
                  <div
                    key={item.day}
                    onMouseEnter={() => setHoveredDay(item)}
                    onTouchStart={() => setHoveredDay(item)}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    {item.amount > 0 && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none shadow-md">
                        {item.amount.toLocaleString()}฿
                      </div>
                    )}
                    <div
                      className={`w-full rounded-t transition-all ${
                        item.amount > 0
                          ? 'bg-rose-400 group-hover:bg-rose-600'
                          : 'bg-slate-100 h-1'
                      }`}
                      style={{ height: item.amount > 0 ? `${heightPercent}%` : '2px' }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Day indices preview */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
              <span>วันที่ 1</span>
              <span>10</span>
              <span>20</span>
              <span>31</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
