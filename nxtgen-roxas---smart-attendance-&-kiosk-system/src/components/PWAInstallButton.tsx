import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, do not show install button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
        title="Install NXTGEN Roxas as an Offline App on this device"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install Offline App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#29C5E8]" />
          <span className="hidden sm:inline">Install on iOS</span>
          <span className="sm:hidden">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#29C5E8]" />
                  <h3 className="text-base font-black">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Add <strong>NXTGEN Roxas</strong> directly to your home screen for fast 1-tap offline launching without opening the browser:
              </p>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/15 text-[#0284c7] dark:text-[#29C5E8] flex items-center justify-center font-black shrink-0">
                    1
                  </div>
                  <div>
                    Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-cyan-500" /> at the bottom or top of Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/15 text-[#FF6F00] flex items-center justify-center font-black shrink-0">
                    2
                  </div>
                  <div>
                    Scroll down and select <strong>"Add to Home Screen"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black shrink-0">
                    3
                  </div>
                  <div>
                    Tap <strong>Add</strong> in the top-right corner. It will open and run even with no internet!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black text-xs hover:opacity-90 cursor-pointer shadow-xs"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
