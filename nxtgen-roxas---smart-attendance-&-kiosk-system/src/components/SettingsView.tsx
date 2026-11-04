import React, { useState } from 'react';
import {
  Settings,
  Building,
  Clock,
  Volume2,
  Database,
  Save,
  RotateCcw,
  Upload,
  Download,
  CheckCircle2,
  Calendar,
  Sparkles,
  UserCheck,
  Edit,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { NXTGEN_LEVELS } from '../types/attendance';
import { EditAccountModal } from './EditAccountModal';

export const SettingsView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [isEditAccountOpen, setIsEditAccountOpen] = useState<boolean>(false);
  const {
    settings,
    updateSettings,
    sundayServices,
    resetToDefaults,
    exportJSON,
    importJSON,
  } = useAttendance();

  const [savedAlert, setSavedAlert] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importJSON(content);
        if (ok) {
          alert('NXTGEN attendance data successfully imported!');
        } else {
          alert('Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Settings Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#29C5E8]/20 text-[#29C5E8] border border-cyan-500/30">
              MINISTRY CONFIGURATION
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-[#FF6F00]" />
            NXTGEN Roxas Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Configure Sunday church services, ministry year for birth-year level placement, and data backups.
          </p>
        </div>

        {savedAlert && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Settings Saved
          </span>
        )}
      </div>

      {/* Current User Account & Edit Account Profile Card */}
      {currentUser && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-cyan-500/30 shadow-sm dark:shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#29C5E8] shadow-sm flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {currentUser.name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-[#0284c7]/15 text-[#0284c7] dark:text-[#29C5E8] border border-cyan-500/30'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isAdmin ? 'System Administrator' : 'Sunday Lifeshaper'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentUser.email} • {currentUser.phone || 'No phone set'} • Room: {currentUser.assignedRoom || 'All'}
              </p>
              {currentUser.dgroupLeaderName && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  DGroup Leader: <strong className="text-slate-700 dark:text-slate-200">{currentUser.dgroupLeaderName}</strong> {currentUser.dgroupLeaderPhone ? `(${currentUser.dgroupLeaderPhone})` : ''}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditAccountOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-[#29C5E8] hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-black text-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center"
          >
            <Edit className="w-3.5 h-3.5 text-[#FF6F00]" />
            <span>Edit My Account</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Ministry Information & Ministry Year */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm border-b border-slate-200 dark:border-slate-800 pb-3">
            <Building className="w-4 h-4 text-[#29C5E8]" />
            Kids Church Ministry Identity & Current Academic Year
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Church / Ministry Name</label>
              <input
                type="text"
                value={settings.churchName}
                onChange={(e) => updateSettings({ churchName: e.target.value })}
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Campus Location</label>
              <input
                type="text"
                value={settings.campusBranch}
                onChange={(e) => updateSettings({ campusBranch: e.target.value })}
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white"
              />
            </div>

            {/* Master Ministry Year */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center justify-between">
                <span>Current Ministry Year (Birth-Year Calculator)</span>
                <span className="text-[#FF6F00] font-black text-[11px]">Primary Master</span>
              </label>
              <input
                type="number"
                min={2020}
                max={2035}
                value={settings.currentMinistryYear}
                onChange={(e) =>
                  updateSettings({ currentMinistryYear: parseInt(e.target.value) || 2026 })
                }
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border-2 border-[#FF6F00] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono font-black text-sm"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Birth-year level placement formula: <code>Age = CurrentMinistryYear - BirthYear</code>
              </p>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Security Tag Prefix</label>
              <input
                type="text"
                value={settings.securityTagPrefix}
                onChange={(e) => updateSettings({ securityTagPrefix: e.target.value })}
                className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono uppercase"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Prefix for parent claim tags (e.g. NX)</p>
            </div>
          </div>
        </div>

        {/* 5 Levels & Age Ranges Reference */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm border-b border-slate-200 dark:border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-[#FF6F00]" />
            NXTGEN 5 Levels & Age Reference
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {NXTGEN_LEVELS.map((lvl) => {
              const minYear = settings.currentMinistryYear - lvl.maxAge;
              const maxYear = settings.currentMinistryYear - lvl.minAge;

              return (
                <div key={lvl.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="font-black text-slate-900 dark:text-white">{lvl.name}</div>
                  <div className="font-black text-[#29C5E8] mt-0.5">{lvl.ageRange}</div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Birth Years in {settings.currentMinistryYear}:
                    <div className="font-mono font-black text-[#FF6F00] dark:text-[#FF7A00] mt-0.5">
                      {minYear} - {maxYear}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio Chimes */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm border-b border-slate-200 dark:border-slate-800 pb-3">
            <Volume2 className="w-4 h-4 text-emerald-500" />
            Kiosk Sound Effects
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">Sunday Check-in Chime Sound</div>
              <div className="text-slate-500 dark:text-slate-400">Audible tone confirmation upon kid check-in/out</div>
            </div>

            <button
              type="button"
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              {settings.soundEnabled ? '✓ Sound Enabled' : 'Muted'}
            </button>
          </div>
        </div>

        {/* Data Storage & Backup */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm border-b border-slate-200 dark:border-slate-800 pb-3">
            <Database className="w-4 h-4 text-[#29C5E8]" />
            Data Backup & Restore
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={exportJSON}
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-left flex items-start gap-3 transition-colors cursor-pointer"
            >
              <Download className="w-5 h-5 text-[#29C5E8] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-slate-900 dark:text-white">Download Full Backup</div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Export all kids, volunteers, and Sunday attendance logs
                </div>
              </div>
            </button>

            <label className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-left flex items-start gap-3 transition-colors cursor-pointer">
              <Upload className="w-5 h-5 text-[#FF6F00] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-slate-900 dark:text-white">Restore Backup</div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Upload a JSON file from previous export
                </div>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </div>
            </label>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    'Reset data back to the demo NXTGEN Roxas kids church dataset?'
                  )
                ) {
                  resetToDefaults();
                  alert('Reset complete!');
                }
              }}
              className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-rose-100/70 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-left flex items-start gap-3 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-rose-600 dark:text-rose-300">Reset Demo Data</div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Restore preloaded kids across all 5 levels and Sunday volunteer pool
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 inline mr-1.5" /> Save Configuration
          </button>
        </div>
      </form>

      {/* Edit Account Modal */}
      <EditAccountModal
        isOpen={isEditAccountOpen}
        onClose={() => setIsEditAccountOpen(false)}
      />
    </div>
  );
};
