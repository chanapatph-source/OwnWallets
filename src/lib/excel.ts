import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { formatMonthLabel } from './constants';

export const exportTransactionsToExcel = (
  transactions: Transaction[],
  yearMonth?: string
) => {
  // Filter if yearMonth specified
  const items = yearMonth
    ? transactions.filter(t => t.date.startsWith(yearMonth))
    : transactions;

  // Sort by date descending
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  // Compute summary stats
  const totalIncome = sorted
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = sorted
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Prepare Transactions sheet rows
  const transactionRows = sorted.map((t, idx) => ({
    'ลำดับ': idx + 1,
    'วันที่': t.date,
    'ประเภท': t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    'หมวดหมู่': t.categoryName,
    'จำนวนเงิน (บาท)': t.amount,
    'หมายเหตุ': t.note || '-',
  }));

  // Category summary
  const categoryMap: Record<string, { type: string; amount: number }> = {};
  sorted.forEach(t => {
    if (!categoryMap[t.categoryName]) {
      categoryMap[t.categoryName] = {
        type: t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        amount: 0,
      };
    }
    categoryMap[t.categoryName].amount += t.amount;
  });

  const categoryRows = Object.entries(categoryMap).map(([name, val], idx) => ({
    'ลำดับ': idx + 1,
    'หมวดหมู่': name,
    'ประเภท': val.type,
    'ยอดรวม (บาท)': val.amount,
    'สัดส่วน (%)':
      val.type === 'expense' && totalExpense > 0
        ? Number(((val.amount / totalExpense) * 100).toFixed(1))
        : val.type === 'income' && totalIncome > 0
        ? Number(((val.amount / totalIncome) * 100).toFixed(1))
        : 0,
  }));

  // Overview summary rows
  const overviewRows = [
    { 'หัวข้อสรุป': 'ช่วงเวลา', 'ข้อมูล': yearMonth ? formatMonthLabel(yearMonth) : 'ทั้งหมด' },
    { 'หัวข้อสรุป': 'จำนวนรายการทั้งหมด', 'ข้อมูล': sorted.length },
    { 'หัวข้อสรุป': 'รวมรายรับทั้งหมด (บาท)', 'ข้อมูล': totalIncome },
    { 'หัวข้อสรุป': 'รวมรายจ่ายทั้งหมด (บาท)', 'ข้อมูล': totalExpense },
    { 'หัวข้อสรุป': 'ยอดเงินคงเหลือสุทธิ (บาท)', 'ข้อมูล': balance },
    {
      'หัวข้อสรุป': 'สถานะการเงิน',
      'ข้อมูล': balance >= 0 ? 'รายรับมากกว่ารายจ่าย (สมดุลดี)' : 'รายจ่ายเกินรายรับ (ต้องระวัง)',
    },
  ];

  // Create workbook and worksheets
  const wb = XLSX.utils.book_new();

  const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
  const wsCategories = XLSX.utils.json_to_sheet(categoryRows);

  // Set column widths
  wsTransactions['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 14 }, // วันที่
    { wch: 12 }, // ประเภท
    { wch: 26 }, // หมวดหมู่
    { wch: 18 }, // จำนวนเงิน
    { wch: 30 }, // หมายเหตุ
  ];

  wsCategories['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
  ];

  wsOverview['!cols'] = [
    { wch: 26 },
    { wch: 32 },
  ];

  XLSX.utils.book_append_sheet(wb, wsOverview, 'สรุปภาพรวม');
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'รายการรายรับรายจ่าย');
  XLSX.utils.book_append_sheet(wb, wsCategories, 'แยกตามหมวดหมู่');

  // File name
  const fileName = yearMonth
    ? `expense_report_${yearMonth}.xlsx`
    : `expense_report_all_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, fileName);
};
