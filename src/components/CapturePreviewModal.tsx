import { X, Download, Share2, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface CapturePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  filename: string;
}

export const CapturePreviewModal = ({
  isOpen,
  onClose,
  imageUrl,
  filename,
}: CapturePreviewModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy not supported, downloading instead');
      handleDownload();
    }
  };

  return (
    <div
      id="capture-preview-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="capture-preview-modal"
        className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-700/80 text-white rounded-3xl shadow-2xl p-4 sm:p-5 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">บันทึกภาพหน้าจอเรียบร้อย!</h3>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400">รูปภาพความคมชัดสูงสำหรับแชร์หรือเก็บเป็นหลักฐาน</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Preview Container */}
        <div className="my-3 flex-1 overflow-y-auto flex items-center justify-center p-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 max-h-[60vh]">
          <img
            src={imageUrl}
            alt="Captured Screen"
            className="max-h-[52vh] w-auto object-contain rounded-xl shadow-lg border border-slate-700/40"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-blue-400" />
                <span>คัดลอกรูป</span>
              </>
            )}
          </button>

          <button
            id="btn-download-capture-image"
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลด PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
