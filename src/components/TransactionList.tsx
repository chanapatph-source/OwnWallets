import { useState } from 'react';
import { Search, Trash2, Edit3, ArrowDownRight, ArrowUpRight, Filter } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatThaiCurrency, formatThaiDate, ALL_CATEGORIES } from '../lib/constants';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
}

export const TransactionList = ({
  transactions,
  onEdit,
  onDelete,
  onOpenAddModal,
}: TransactionListProps) => {
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions
  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCategory = t.categoryName.toLowerCase().includes(q);
      const matchNote = (t.note || '').toLowerCase().includes(q);
      const matchAmount = String(t.amount).includes(q);
      return matchCategory || matchNote || matchAmount;
    }
    return true;
  });

  // Sort by date descending, then createdAt descending
  const sorted = [...filtered].sort((a, b) => {
    const dComp = b.date.localeCompare(a.date);
    if (dComp !== 0) return dComp;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  // Group by date
  const groupedByDate: Record<string, Transaction[]> = {};
  sorted.forEach(t => {
    if (!groupedByDate[t.date]) {
      groupedByDate[t.date] = [];
    }
    groupedByDate[t.date].push(t);
  });

  // Helper to format friendly date
  const getFriendlyDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (dateStr === today) return 'วันนี้';
    if (dateStr === yesterday) return 'เมื่อวานนี้';
    return formatThaiDate(dateStr);
  };

  return (
    <div id="transaction-list-container" className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-transaction"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหารายการ, หมายเหตุ หรือหมวดหมู่..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition-colors shadow-2xs"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center p-1 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold shrink-0 shadow-2xs">
          <button
            id="filter-all"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            id="filter-expense"
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'expense'
                ? 'bg-rose-500 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            รายจ่าย
          </button>
          <button
            id="filter-income"
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'income'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            รายรับ
          </button>
        </div>
      </div>

      {/* Transactions Feed */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">ไม่พบรายการบันทึก</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {searchQuery ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'กดปุ่มเพิ่มรายการเพื่อเริ่มต้นจดบันทึก'}
            </p>
          </div>
          {!searchQuery && (
            <button
              id="btn-empty-add-transaction"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              + บันทึกรายการแรก
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([dateStr, items]) => {
            // Day's income and expense summary
            const dayExpense = items
              .filter(i => i.type === 'expense')
              .reduce((s, i) => s + i.amount, 0);
            const dayIncome = items
              .filter(i => i.type === 'income')
              .reduce((s, i) => s + i.amount, 0);

            return (
              <div key={dateStr} className="space-y-1.5">
                {/* Date header */}
                <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span>{getFriendlyDateLabel(dateStr)}</span>
                    <span className="text-slate-400 font-normal">({formatThaiDate(dateStr)})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600 font-medium">+{formatThaiCurrency(dayIncome)}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-500 font-medium">-{formatThaiCurrency(dayExpense)}</span>
                    )}
                  </div>
                </div>

                {/* Items in this date */}
                <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-2xs overflow-hidden">
                  {items.map(t => {
                    const catInfo = ALL_CATEGORIES.find(c => c.id === t.categoryId);
                    const isIncome = t.type === 'income';

                    return (
                      <div
                        key={t.id}
                        id={`transaction-row-${t.id}`}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Category Icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: catInfo?.color || '#64748b' }}
                          >
                            <CategoryIcon
                              iconName={catInfo?.icon || 'Tag'}
                              className="w-5 h-5"
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">
                              {t.categoryName}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {t.note || (isIncome ? 'รายรับ' : 'รายจ่าย')}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="text-right">
                            <div
                              className={`text-sm sm:text-base font-bold flex items-center justify-end gap-0.5 ${
                                isIncome ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {isIncome ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              )}
                              <span>{formatThaiCurrency(t.amount)}</span>
                            </div>
                          </div>

                          {/* Edit / Delete action buttons */}
                          <div className="flex items-center opacity-70 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity gap-1">
                            <button
                              id={`btn-edit-${t.id}`}
                              onClick={() => onEdit(t)}
                              title="แก้ไข"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-${t.id}`}
                              onClick={() => {
                                if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
                                  onDelete(t.id);
                                }
                              }}
                              title="ลบ"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
