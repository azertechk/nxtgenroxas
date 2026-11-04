import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  Download,
  Upload,
  FileSpreadsheet,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  X,
  Database,
  Lock,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  googleSignIn,
  googleLogout,
  getAccessToken,
  initAuth,
  uploadBackupToDrive,
  syncDatabaseToGoogleSheet,
} from '../services/googleWorkspace';
import { User } from 'firebase/auth';

interface BackupAndSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupAndSyncModal: React.FC<BackupAndSyncModalProps> = ({ isOpen, onClose }) => {
  const { allAccounts } = useAuth();
  const {
    kids,
    volunteers,
    records,
    settings,
    sundayServices,
    selectedSunday,
    activeService,
    exportJSON,
    importJSON,
  } = useAttendance();

  const isOnline = useOnlineStatus();

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('nxtgen_last_google_sync');
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('nxtgen_sheet_url');
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('nxtgen_auto_sync_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Init Firebase Auth state
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsub();
  }, []);

  // Save auto-sync preference
  const toggleAutoSync = () => {
    const newVal = !autoSyncEnabled;
    setAutoSyncEnabled(newVal);
    localStorage.setItem('nxtgen_auto_sync_enabled', String(newVal));
  };

  // Google Sign In
  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      setErrorMessage(null);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setSyncStatusMessage('Connected to Google Account successfully!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Google Connection failed: ${msg}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setGoogleToken(null);
    setSyncStatusMessage('Google Account disconnected.');
  };

  // Run full sync to Google Drive and Google Sheets
  const runFullSync = async (isAuto = false) => {
    if (!isOnline) {
      if (!isAuto) setErrorMessage('Cannot sync while offline. Please connect to internet or wifi.');
      return;
    }

    let token = googleToken;
    if (!token) {
      token = await getAccessToken();
    }

    if (!token) {
      if (!isAuto) {
        setErrorMessage('Please connect your Google Account first to sync to Drive & Sheets.');
      }
      return;
    }

    try {
      setIsSyncing(true);
      setErrorMessage(null);
      setSyncStatusMessage('Syncing data to Google Drive & Google Sheets...');

      // 1. Prepare complete backup payload
      const backupPayload = {
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        churchName: settings.churchName,
        kids,
        volunteers,
        records,
        accounts: allAccounts,
        settings,
        sundayServices,
      };

      // 2. Upload snapshot to Google Drive
      const driveRes = await uploadBackupToDrive(token, backupPayload);

      // 3. Sync tables to Google Sheets
      const sheetRes = await syncDatabaseToGoogleSheet(
        token,
        kids,
        volunteers,
        records,
        selectedSunday,
        activeService,
        allAccounts
      );

      const nowStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSyncTime(nowStr);
      localStorage.setItem('nxtgen_last_google_sync', nowStr);

      if (sheetRes.spreadsheetUrl) {
        setSpreadsheetUrl(sheetRes.spreadsheetUrl);
        localStorage.setItem('nxtgen_sheet_url', sheetRes.spreadsheetUrl);
      }

      setSyncStatusMessage(
        `✓ Sync Complete! Database snapshot saved to Drive and ${sheetRes.rowCount} entries synced to Google Sheets.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Sync failed: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Automatic sync whenever connection changes to online
  useEffect(() => {
    const handleOnline = () => {
      if (autoSyncEnabled && googleToken) {
        runFullSync(true);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [autoSyncEnabled, googleToken, kids, volunteers, records]);

  // Handle Restore JSON File
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const confirmRestore = window.confirm(
        'Are you sure you want to restore this database backup? This will update local kids, lifeshapers, and attendance records.'
      );
      if (!confirmRestore) return;

      const success = importJSON(content);
      if (success) {
        setSyncStatusMessage('✓ Local database restored successfully!');
      } else {
        setErrorMessage('Failed to restore backup file. Format invalid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-6 my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-[#0284c7] dark:text-[#29C5E8] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight">Database Backup & Google Cloud Sync</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatic cloud synchronization for Google Drive & Google Sheets when online.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Network & Auto-Sync Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <span>Network Status:</span>
                <span className={isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
                  {isOnline ? 'Online (Connected)' : 'Offline (No Internet/WiFi)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isOnline
                  ? 'Cloud sync is active. Updates push to Google Drive & Sheets.'
                  : 'App works 100% offline. Changes queue locally until connected.'}
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSyncEnabled}
              onChange={toggleAutoSync}
              className="w-4 h-4 rounded text-[#29C5E8] focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Auto-Sync when Online
            </span>
          </label>
        </div>

        {/* Status Alerts */}
        {syncStatusMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{syncStatusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Workspace Connection Card */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black">Google Drive & Google Sheets Link</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {googleUser
                    ? `Connected as ${googleUser.displayName || googleUser.email}`
                    : 'Sign in to enable automatic cloud backup and spreadsheet synchronization'}
                </p>
              </div>
            </div>

            {googleUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => runFullSync(false)}
                  disabled={isSyncing || !isOnline}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] hover:opacity-95 text-white font-black text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:text-rose-500 cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningIn || !isOnline}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-40"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>

          {/* Quick Links to Synced Google Files */}
          {spreadsheetUrl && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Last Google Cloud Sync: <strong>{lastSyncTime || 'Just now'}</strong>
              </span>
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0284c7] dark:text-[#29C5E8] hover:underline flex items-center gap-1 font-bold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Open Google Sheet Attendance Log</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Local Backup & Restore Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Download JSON Backup */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#FF6F00] flex items-center justify-center mb-2">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black">Export Local Backup (JSON)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Save a full backup of all {kids.length} children, {volunteers.length} lifeshapers, and attendance records directly to your device storage.
              </p>
            </div>

            <button
              type="button"
              onClick={exportJSON}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black text-xs flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup File</span>
            </button>
          </div>

          {/* Restore JSON Backup */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black">Restore Database</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload a previously saved JSON backup file to restore records or migrate from another device.
              </p>
            </div>

            <label className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
              <Upload className="w-4 h-4 text-[#29C5E8]" />
              <span>Select File to Restore</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileRestore}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
