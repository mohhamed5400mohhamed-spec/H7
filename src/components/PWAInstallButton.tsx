import React, { useState, useEffect } from 'react';
import { Download, Smartphone, WifiOff, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'pill' | 'menu-item';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'pill',
  className = ''
}) => {
  const { canInstall, isInstalled, isIOS, hasNativePrompt, promptInstall } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (isInstalled || !canInstall) return null;

  const handleClick = async () => {
    if (hasNativePrompt) {
      await promptInstall();
    } else if (isIOS) {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      {variant === 'menu-item' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-l from-amber-500/20 to-emerald-500/15 hover:from-amber-500/30 hover:to-emerald-500/25 border border-amber-400/40 text-amber-200 transition-all cursor-pointer ${className}`}
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>تثبيت التطبيق على جهازك</span>
          </span>
          <Download className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={handleClick}
          title="تثبيت التطبيق على الشاشة الرئيسية"
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>تثبيت</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-md hover:brightness-110 transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>تثبيت تطبيق حسان برو</span>
          <Download className="w-3.5 h-3.5" />
        </button>
      )}

      {showIosGuide && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            dir="rtl"
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-amber-500/40 p-5 text-right shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>تثبيت حسان برو على iPhone / iPad</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2.5 text-xs text-slate-200 leading-relaxed">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold flex-shrink-0">1</span>
                <span>اضغط على أيقونة المشاركة</span>
                <Share className="w-4 h-4 text-sky-400 inline flex-shrink-0" />
                <span>في شريط متصفح Safari.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold flex-shrink-0">2</span>
                <span>اختر «إضافة إلى الشاشة الرئيسية»</span>
                <PlusSquare className="w-4 h-4 text-emerald-400 inline flex-shrink-0" />
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold flex-shrink-0">3</span>
                <span>اضغط «إضافة» للاستمتاع بالتطبيق بملء الشاشة.</span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      dir="rtl"
      className="w-full bg-rose-950/95 border-b border-rose-500/50 text-rose-100 px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-2 z-50 shrink-0"
    >
      <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
      <span>انقطع الاتصال بالإنترنت — بانتظار عودة الشبكة لإعادة مزامنة الرسائل تلقائياً...</span>
    </div>
  );
};
