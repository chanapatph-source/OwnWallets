import { useState, useEffect } from 'react';
import { X, Check, Calendar, FileText, Plus, Minus } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../lib/constants';
import { CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initialTransaction?: Transaction | null;
}

export const TransactionModal = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
}: TransactionModalProps) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('food');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmountStr(String(initialTransaction.amount));
      setCategoryId(initialTransaction.categoryId);
      setDate(initialTransaction.date);
      setNote(initialTransaction.note || '');
    } else {
      setType('expense');
      setAmountStr('');
      setCategoryId('food');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
    }
    setError('');
  }, [initialTransaction, isOpen]);

  // When type toggles, switch default category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense') {
      setCategoryId('food');
    } else {
      setCategoryId('salary');
    }
  };

  const categories = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  const handleQuickAdd = (addAmount: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr(String(current + addAmount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)');
      return;
    }

    const selectedCat = categories.find(c => c.id === categoryId) || categories[0];

    onSave({
      type,
      amount,
      categoryId: selectedCat.id,
      categoryName: selectedCat.name,
      date,
      note: note.trim(),
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="transaction-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="transaction-modal-content"
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {initialTransaction ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}
            </h2>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              id="toggle-type-expense"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minus className="w-4 h-4" />
              <span>รายจ่าย (Expense)</span>
            </button>
            <button
              type="button"
              id="toggle-type-income"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                type === 'income'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>รายรับ (Income)</span>
            </button>
          </div>

          {/* Amount Display & Input */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              จำนวนเงิน (บาท) *
            </label>
            <div className="flex items-center">
              <span className={`text-2xl sm:text-3xl font-bold mr-2 ${type === 'expense' ? 'text-rose-500' : 'text-blue-600'}`}>
                ฿
              </span>
              <input
                id="input-transaction-amount"
                type="number"
                step="any"
                inputMode="decimal"
                value={amountStr}
                onChange={e => {
                  setAmountStr(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                autoFocus
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-300"
              />
            </div>

            {/* Quick preset addition buttons for quick mobile entry */}
            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-slate-400 font-medium shrink-0">เพิ่มด่วน:</span>
              {[20, 50, 100, 500, 1000].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleQuickAdd(val)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0 shadow-2xs"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-500 px-1">{error}</p>
          )}

          {/* Category Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              หมวดหมู่ *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {categories.map(cat => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    id={`cat-select-${cat.id}`}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/30 shadow-xs font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-white shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon iconName={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium line-clamp-1 leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              วันที่ทำรายการ
            </label>
            <input
              id="input-transaction-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              บันทึกช่วยจำ (ไม่บังคับ)
            </label>
            <input
              id="input-transaction-note"
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="เช่น กาแฟอเมซอน, ซื้อเสื้อยืด, ค่าไฟห้องพัก"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-transaction"
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>{initialTransaction ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
