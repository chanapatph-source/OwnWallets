import { Category } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'อาหารและเครื่องดื่ม', icon: 'Utensils', color: '#f97316', type: 'expense' },
  { id: 'transport', name: 'การเดินทาง / น้ำมัน', icon: 'Car', color: '#3b82f6', type: 'expense' },
  { id: 'shopping', name: 'ช้อปปิ้ง / ของใช้', icon: 'ShoppingBag', color: '#ec4899', type: 'expense' },
  { id: 'bills', name: 'ค่าน้ำ-ไฟ / ที่พัก / อินเทอร์เน็ต', icon: 'Home', color: '#8b5cf6', type: 'expense' },
  { id: 'entertainment', name: 'บันเทิง / ท่องเที่ยว', icon: 'Film', color: '#06b6d4', type: 'expense' },
  { id: 'health', name: 'สุขภาพ / ยารักษาโรค', icon: 'HeartPulse', color: '#10b981', type: 'expense' },
  { id: 'education', name: 'การศึกษา / หนังสือ', icon: 'BookOpen', color: '#eab308', type: 'expense' },
  { id: 'other_expense', name: 'ค่าใช้จ่ายอื่นๆ', icon: 'MoreHorizontal', color: '#64748b', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'เงินเดือน / ค่าจ้าง', icon: 'Briefcase', color: '#10b981', type: 'income' },
  { id: 'business', name: 'ธุรกิจส่วนตัว / ค้าขาย', icon: 'Store', color: '#3b82f6', type: 'income' },
  { id: 'freelance', name: 'ฟรีแลนซ์ / รับจ๊อบพิเศษ', icon: 'Laptop', color: '#8b5cf6', type: 'income' },
  { id: 'investment', name: 'เงินปันผล / กำไรลงทุน', icon: 'TrendingUp', color: '#f59e0b', type: 'income' },
  { id: 'gift', name: 'ของขวัญ / โบนัส', icon: 'Gift', color: '#ec4899', type: 'income' },
  { id: 'other_income', name: 'รายรับอื่นๆ', icon: 'PlusCircle', color: '#64748b', type: 'income' },
];

export const ALL_CATEGORIES = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_SHORT_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const formatThaiCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace('THB', '฿');
};

export const formatThaiDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const thaiYear = year + 543;
  return `${day} ${THAI_SHORT_MONTHS[month - 1]} ${thaiYear}`;
};

export const formatMonthLabel = (yearMonthStr: string): string => {
  if (!yearMonthStr) return '';
  const [year, month] = yearMonthStr.split('-').map(Number);
  if (!year || !month) return yearMonthStr;
  const thaiYear = year + 543;
  return `${THAI_MONTHS[month - 1]} ${thaiYear}`;
};
