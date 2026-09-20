import { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CloudUpload,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Transaction } from '../types';
import { exportTransactionsToExcel } from '../lib/excel';
import { syncToGoogleSheets } from '../lib/sheets';
import {
  googleSignIn,
  logout,
  getAccessToken,
  signInWithGSI,
  getDomainConfig,
  UnauthorizedDomainError,
} from '../lib/auth';
import { formatMonthLabel } from '../lib/constants';
import { getStoredSpreadsheetId, saveStoredSpreadsheetId, getStoredSpreadsheetUrl } from '../lib/storage';
import { User } from 'firebase/auth';

interface ExportSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  selectedMonth: string;
  currentUser: User | null;
  cachedToken: string | null;
  onUserAuthChange: (user: User | null, token: string | null) => void;
}

export const ExportSyncModal = ({
  isOpen,
  onClose,
  transactions,
  selectedMonth,
  currentUser,
  cachedToken,
  onUserAuthChange,
}: ExportSyncModalProps) => {
  const [exportScope, setExportScope] = useState<'month' | 'all'>('month');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sheetResult, setSheetResult] = useState<{ url: string; count: number } | null>(() => {
    const existingUrl = getStoredSpreadsheetUrl();
    return existingUrl ? { url: existingUrl, count: transactions.length } : null;
  });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<{
    domain: string;
    recommendedWildcard: string;
    settingsUrl: string;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  // 1. Download Excel
  const handleDownloadExcel = () => {
    try {
      setErrorMessage('');
      const targetMonth = exportScope === 'month' ? selectedMonth : undefined;
      exportTransactionsToExcel(transactions, targetMonth);
    } catch (err: any) {
      console.error('Export Excel failed:', err);
      setErrorMessage('ไม่สามารถสร้างไฟล์ Excel ได้: ' + (err.message || ''));
    }
  };

  // 2. Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMessage('');
    setUnauthorizedDomain(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onUserAuthChange(res.user, res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (
        err instanceof UnauthorizedDomainError ||
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('auth/unauthorized-domain') ||
        err?.message?.includes('unauthorized-domain')
      ) {
        const domainCfg = getDomainConfig();
        setUnauthorizedDomain({
          domain: err.domain || domainCfg.currentDomain,
          recommendedWildcard: domainCfg.recommendedWildcard,
          settingsUrl: err.settingsUrl || domainCfg.settingsUrl,
        });
        setErrorMessage('Firebase: โดเมนยังไม่ได้รับอนุญาตใน Firebase Authentication (auth/unauthorized-domain)');
      } else {
        setErrorMessage(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 3. Fallback GSI Token Client Sign-in
  const handleGsiSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMessage('');
    try {
      const res = await signInWithGSI();
      if (res) {
        onUserAuthChange(res.user, res.accessToken);
        setUnauthorizedDomain(null);
      }
    } catch (err: any) {
      console.error('GSI Sign In Error:', err);
      setErrorMessage(err.message || 'เชื่อมต่อ Google ไม่สำเร็จ');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 4. Sync to Google Sheets
  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    setErrorMessage('');
    setSheetResult(null);

    try {
      let token = cachedToken;
      if (!token) {
        token = await getAccessToken();
      }

      if (!token) {
        // Prompt login first
        const res = await googleSignIn();
        token = res.accessToken;
        onUserAuthChange(res.user, res.accessToken);
      }

      const existingSpreadsheetId = getStoredSpreadsheetId() || undefined;
      const targetMonth = exportScope === 'month' ? selectedMonth : undefined;

      const result = await syncToGoogleSheets(
        token,
        transactions,
        targetMonth,
        existingSpreadsheetId
      );

      saveStoredSpreadsheetId(result.spreadsheetId);
      setSheetResult({
        url: result.spreadsheetUrl,
        count: result.rowCount,
      });
    } catch (err: any) {
      console.error('Sync to sheets failed:', err);
      if (
        err instanceof UnauthorizedDomainError ||
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('auth/unauthorized-domain') ||
        err?.message?.includes('unauthorized-domain')
      ) {
        const domainCfg = getDomainConfig();
        setUnauthorizedDomain({
          domain: err.domain || domainCfg.currentDomain,
          recommendedWildcard: domainCfg.recommendedWildcard,
          settingsUrl: err.settingsUrl || domainCfg.settingsUrl,
        });
        setErrorMessage('Firebase: โดเมนยังไม่ได้รับอนุญาตใน Firebase Authentication (auth/unauthorized-domain)');
      } else {
        setErrorMessage(err.message || 'ส่งข้อมูลไปยัง Google Sheets ไม่สำเร็จ');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const monthLabel = formatMonthLabel(selectedMonth);

  return (
    <div
      id="export-sync-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="export-sync-modal"
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">ส่งออกข้อมูล (Export)</h2>
              <p className="text-xs text-slate-400">ส่งออกเป็นไฟล์ Excel หรือเชื่อมต่อ Google Sheets</p>
            </div>
          </div>
          <button
            id="btn-close-export-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              เลือกช่วงเวลาที่ต้องการส่งออก
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                id="btn-scope-month"
                onClick={() => setExportScope('month')}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  exportScope === 'month'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                เฉพาะ {monthLabel}
              </button>
              <button
                type="button"
                id="btn-scope-all"
                onClick={() => setExportScope('all')}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  exportScope === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ทั้งหมด ({transactions.length} รายการ)
              </button>
            </div>
          </div>

          {/* Unauthorized Domain Troubleshooting Box */}
          {unauthorizedDomain && (
            <div
              id="box-unauthorized-domain-help"
              className="p-4 bg-amber-50/95 border border-amber-300 rounded-2xl text-xs space-y-3 shadow-xs animate-in fade-in"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-950 text-xs">
                    วิธีแก้ไข: เพิ่มโดเมนใน Firebase Authentication
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Firebase บล็อกการเข้าสู่ระบบไว้เนื่องจากโดเมนของแอปยังไม่ได้ถูกเพิ่มในรายชื่อ <strong>Authorized Domains</strong>
                  </p>
                </div>
              </div>

              {/* Current Domain with Copy button */}
              <div className="p-2.5 bg-white/95 border border-amber-200/90 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  โดเมนที่ต้องนำไปเพิ่ม:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-[11px] font-mono font-semibold text-slate-800 truncate px-2 py-1 bg-slate-100 rounded-lg flex-1 select-all">
                    {unauthorizedDomain.domain || window.location.hostname}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(unauthorizedDomain.domain || window.location.hostname);
                      setCopiedDomain(true);
                      setTimeout(() => setCopiedDomain(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0"
                  >
                    {copiedDomain ? (
                      <>
                        <Check className="w-3 h-3 text-white" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>คัดลอก</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  💡 <em>ทิป:</em> คุณสามารถกรอก <code className="font-mono text-amber-900 font-bold bg-amber-100 px-1 rounded">run.app</code> เพื่ออนุญาตทุก URL พรีวิวบน Cloud Run ได้พร้อมกัน
                </p>
              </div>

              {/* 3 Steps */}
              <div className="text-[11px] text-amber-950 space-y-1 pl-1">
                <p className="font-bold">ขั้นตอนการเพิ่ม (ทำครั้งเดียว):</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-900 text-[11px] leading-relaxed">
                  <li>กดปุ่ม <strong>"เปิดหน้าตั้งค่า Firebase"</strong> ด้านล่าง</li>
                  <li>มองหาหัวข้อ <strong>Authorized domains</strong> แล้วกด <strong>Add domain</strong></li>
                  <li>วางโดเมนที่คัดลอกไว้ (หรือพิมพ์ <code className="font-mono bg-amber-200/70 px-1 rounded font-bold">run.app</code>) แล้วกด <strong>Add</strong></li>
                  <li>กลับมาที่หน้านี้แล้วกดปุ่มเข้าสู่ระบบอีกครั้ง</li>
                </ol>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={unauthorizedDomain.settingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>เปิดหน้าตั้งค่า Firebase Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleGsiSignIn}
                  disabled={isLoggingIn}
                  className="py-2 px-3 bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  title="เข้าสู่ระบบผ่าน Google Identity Services โดยตรง"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>ลองเชื่อมต่อผ่าน Google GIS</span>
                </button>
              </div>
            </div>
          )}

          {errorMessage && !unauthorizedDomain && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Option 1: Direct Excel File (.xlsx) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">ดาวน์โหลดเป็นไฟล์ Excel (.xlsx)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ดาวน์โหลดไฟล์ลงมือถือหรือคอมพิวเตอร์ทันที พร้อมแยกชีตสรุปภาพรวมและรายการอย่างเป็นระเบียบ
                </p>
              </div>
            </div>

            <button
              id="btn-download-excel"
              onClick={handleDownloadExcel}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ดาวน์โหลด Excel ทันที (.xlsx)</span>
            </button>
          </div>

          {/* Option 2: Google Sheets Live Sync */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">ซิงค์ไปยัง Google Sheets ใน Google Drive</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  จัดเก็บไว้ในบัญชี Google ของคุณ เปิดดูและแชร์บนมือถือได้ทุกที่ผ่าน Google Sheets
                </p>
              </div>
            </div>

            {/* Auth status or sign-in button */}
            {!currentUser ? (
              <div className="pt-1">
                <button
                  id="btn-gsi-login"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  )}
                  <span>เข้าสู่ระบบด้วย Google เพื่อซิงค์ข้อมูล</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs px-1 text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="truncate">เข้าสู่ระบบแล้ว: {currentUser.email}</span>
                  </div>
                  <button
                    id="btn-signout"
                    onClick={() => {
                      logout();
                      onUserAuthChange(null, null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                  >
                    ออกจากระบบ
                  </button>
                </div>

                <button
                  id="btn-sync-to-google-sheets"
                  onClick={handleSyncToSheets}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังเขียนข้อมูลลง Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>ส่งออกไปยัง Google Sheets</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Success result link */}
            {sheetResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกข้อมูลเรียบร้อยแล้ว ({sheetResult.count} รายการ)</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  เอกสารสร้างไว้ใน Google Drive ของคุณเรียบร้อยแล้ว
                </p>
                <a
                  id="link-open-google-sheet"
                  href={sheetResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 underline mt-1"
                >
                  <span>คลิกที่นี่เพื่อเปิดดูใน Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
