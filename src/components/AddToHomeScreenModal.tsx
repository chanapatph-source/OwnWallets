import { X, Share, PlusSquare, Smartphone, Monitor, Check } from 'lucide-react';

interface AddToHomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddToHomeScreenModal = ({ isOpen, onClose }: AddToHomeScreenModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      id="a2hs-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="a2hs-modal"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">เพิ่มลงในหน้าจอโฮม (Add to Home)</h2>
              <p className="text-[11px] text-slate-500">ใช้งานเหมือนแอปจริง สะดวกรวดเร็วไม่ต้องเปิดเบราว์เซอร์</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto">
          {/* Icon Preview */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white flex items-center gap-4 shadow-lg border border-slate-700/50">
            <div className="relative shrink-0">
              <img
                src="/apple-touch-icon.png"
                alt="กระเป๋าตังสีแดง"
                className="w-16 h-16 rounded-2xl shadow-xl border border-white/20 object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px]">
                ❤️
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                ไอคอนกระเป๋าตังสีแดง (App Icon)
              </span>
              <h3 className="text-base font-bold text-white leading-tight">กระเป๋าตัง</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                เมื่อเพิ่มลงหน้าจอหลัก จะแสดงรูปกระเป๋าตังสีแดงสุดพรีเมียม
              </p>
            </div>
          </div>

          {/* iOS Safari Steps */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>วิธีเพิ่มบน iPhone (Safari)</span>
            </div>
            <ol className="text-xs text-blue-950 space-y-2 list-decimal list-inside pl-1">
              <li className="leading-relaxed">
                เปิดหน้านี้ใน <strong>Safari</strong> แล้วแตะปุ่ม{' '}
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-blue-200 rounded font-semibold text-blue-700">
                  <Share className="w-3 h-3 inline" /> แชร์ (Share)
                </span>{' '}
                ที่แถบด้านล่าง
              </li>
              <li className="leading-relaxed">
                เลื่อนลงมาแล้วเลือก{' '}
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-blue-200 rounded font-semibold text-blue-700">
                  <PlusSquare className="w-3 h-3 inline" /> เพิ่มไปยังหน้าจอโฮม
                </span>{' '}
                (Add to Home Screen)
              </li>
              <li className="leading-relaxed">
                แตะ <strong>"เพิ่ม (Add)"</strong> ที่มุมขวาบน จะมีไอคอนกระเป๋าตังสีแดงปรากฏบนหน้าจอทันที!
              </li>
            </ol>
          </div>

          {/* Android / PC Chrome Steps */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Monitor className="w-3.5 h-3.5 text-slate-600" />
              <span>วิธีติดตั้งบน Android / คอมพิวเตอร์ (Chrome / Edge)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              แตะเมนู <strong>3 จุด (⋮)</strong> ที่มุมขวาบนของเบราว์เซอร์ แล้วเลือก <strong>"ติดตั้งแอป (Install App)"</strong> หรือ <strong>"เพิ่มลงในหน้าจอหลัก"</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Check className="w-4 h-4" />
            <span>เข้าใจแล้ว</span>
          </button>
        </div>
      </div>
    </div>
  );
};
