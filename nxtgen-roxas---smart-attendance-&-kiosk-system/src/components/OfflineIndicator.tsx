import React, { useState } from 'react';
import { WifiOff, CheckCircle2, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 border border-cyan-500/40 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#FF6F00] flex items-center justify-center shrink-0 border border-orange-500/30">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black flex items-center gap-1.5 text-white">
              <span>Offline Mode Ready</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              No internet needed. Check-ins, QR badges & records work 100% locally.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 cursor-pointer"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
