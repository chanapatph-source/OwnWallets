import { Transaction } from '../types';
import { formatMonthLabel } from './constants';

export interface SyncToSheetsResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowCount: number;
}

export const syncToGoogleSheets = async (
  accessToken: string,
  transactions: Transaction[],
  yearMonth?: string,
  existingSpreadsheetId?: string
): Promise<SyncToSheetsResult> => {
  const items = yearMonth
    ? transactions.filter(t => t.date.startsWith(yearMonth))
    : transactions;

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  const totalIncome = sorted
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = sorted
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  let spreadsheetId = existingSpreadsheetId;
  const title = `บันทึกรายรับรายจ่าย - ${yearMonth ? formatMonthLabel(yearMonth) : 'ทั้งหมด'}`;

  // 1. If no existing spreadsheet, create a new one
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `บันทึกรายรับรายจ่ายส่วนบุคคล (Personal Expense Tracker)`,
        },
        sheets: [
          {
            properties: {
              title: 'รายการบันทึก',
              gridProperties: { rowCount: 1000, columnCount: 10 },
            },
          },
          {
            properties: {
              title: 'สรุปภาพรวม',
              gridProperties: { rowCount: 50, columnCount: 5 },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Sheets ได้');
    }

    const createdData = await createRes.json();
    spreadsheetId = createdData.spreadsheetId;
  }

  // 2. Prepare transaction rows
  const transactionHeaders = ['ลำดับ', 'วันที่', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน (บาท)', 'หมายเหตุ'];
  const transactionRows = sorted.map((t, idx) => [
    idx + 1,
    t.date,
    t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    t.categoryName,
    t.amount,
    t.note || '-',
  ]);

  // Clear and update 'รายการบันทึก'
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'รายการบันทึก'!A1:Z1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const updateTransRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'รายการบันทึก'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [transactionHeaders, ...transactionRows],
      }),
    }
  );

  if (!updateTransRes.ok) {
    const err = await updateTransRes.json();
    throw new Error(err.error?.message || 'ไม่สามารถเขียนข้อมูลลงใน Google Sheets ได้');
  }

  // 3. Update 'สรุปภาพรวม'
  const summaryRows = [
    ['หัวข้อสรุป', 'จำนวนเงิน / ข้อมูล'],
    ['ช่วงเวลาที่ส่งออก', yearMonth ? formatMonthLabel(yearMonth) : 'ทั้งหมด'],
    ['จำนวนรายการทั้งหมด', `${sorted.length} รายการ`],
    ['รวมรายรับทั้งหมด (บาท)', totalIncome],
    ['รวมรายจ่ายทั้งหมด (บาท)', totalExpense],
    ['ยอดเงินคงเหลือสุทธิ (บาท)', balance],
    ['สถานะการเงิน', balance >= 0 ? 'สมดุล (มีเงินเก็บ)' : 'รายจ่ายเกินรายรับ (ต้องระวัง)'],
    ['อัปเดตล่าสุดเมื่อ', new Date().toLocaleString('th-TH')],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'สรุปภาพรวม'!A1:Z100:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'สรุปภาพรวม'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: summaryRows,
      }),
    }
  );

  if (!spreadsheetId) {
    throw new Error('ไม่พบรหัส Google Sheets กรุณาลองใหม่อีกครั้ง');
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    rowCount: sorted.length,
  };
};
