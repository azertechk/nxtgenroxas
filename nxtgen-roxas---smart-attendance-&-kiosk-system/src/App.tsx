import React, { useState, useEffect } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, NavTab } from './components/Navbar';
import { KioskScanner } from './components/KioskScanner';
import { DailyRoster } from './components/DailyRoster';
import { VolunteersView } from './components/VolunteersView';
import { ReportsExportView } from './components/ReportsExportView';
import { CoordinatorHub } from './components/CoordinatorHub';
import { KidsDirectoryAndBadges } from './components/KidsDirectoryAndBadges';
import { SettingsView } from './components/SettingsView';
import { AboutUsModal } from './components/AboutUsModal';
import { EditAccountModal } from './components/EditAccountModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { LoginModal } from './components/LoginModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DedicatedScannerModal } from './components/DedicatedScannerModal';
import { BackupAndSyncModal } from './components/BackupAndSyncModal';
import { AnimationIntro } from './components/AnimationIntro';
import {
  Cake,
  Lock,
  UserCheck,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('kiosk');
  const [isAboutUsOpen, setIsAboutUsOpen] = useState<boolean>(false);
  const [isBirthdaysOpen, setIsBirthdaysOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState<boolean>(false);
  const [isDedicatedScannerOpen, setIsDedicatedScannerOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(true);

  const { settings, kids, volunteers } = useAttendance();
  const { currentUser, isAdmin, isVolunteer, canAccess, isAuthenticated } = useAuth();

  // Sync theme class to html root
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // If active tab becomes restricted for current user, redirect to kiosk
  useEffect(() => {
    if (currentTab === 'coordinator' && !canAccess('coordinator_hub')) {
      setCurrentTab('kiosk');
    } else if (currentTab === 'settings' && !canAccess('settings')) {
      setCurrentTab('kiosk');
    } else if (currentTab === 'kids' && !canAccess('kids_directory')) {
      setCurrentTab('kiosk');
    }
  }, [currentUser]);

  // Keyboard shortcut for fast navigation between modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === '1' && canAccess('checkin')) setCurrentTab('kiosk');
      else if (e.key === '2' && canAccess('roster')) setCurrentTab('roster');
      else if (e.key === '3' && canAccess('volunteers_view')) setCurrentTab('volunteers');
      else if (e.key === '4' && canAccess('reports')) setCurrentTab('reports');
      else if (e.key === '5' && canAccess('coordinator_hub')) setCurrentTab('coordinator');
      else if (e.key === '6' && canAccess('kids_directory')) setCurrentTab('kids');
      else if (e.key === '7' && canAccess('settings')) setCurrentTab('settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canAccess]);

  // 3-second animated intro using NXTGEN logo before the log-in screen appears
  if (showIntro) {
    return (
      <AnimationIntro
        durationMs={3000}
        onComplete={() => setShowIntro(false)}
      />
    );
  }

  // If not logged in, enforce the mobile-optimized login window immediately
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <LoginModal
          isOpen={true}
          isMandatory={true}
          onClose={() => {
            setCurrentTab('kiosk');
          }}
        />
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200 transition-colors">
      {/* Top Navigation with Grouped Purposeful Tabs and Auth Controls */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAboutUs={() => setIsAboutUsOpen(true)}
        onOpenBirthdays={() => setIsBirthdaysOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenEditAccount={() => setIsEditAccountOpen(true)}
        onOpenDedicatedScanner={() => setIsDedicatedScannerOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Sunday Service Operations */}
        {currentTab === 'kiosk' && <KioskScanner />}
        {currentTab === 'roster' && <DailyRoster />}

        {/* People & Teams */}
        {currentTab === 'volunteers' && <VolunteersView />}
        {currentTab === 'kids' && (
          canAccess('kids_directory') ? (
            <KidsDirectoryAndBadges />
          ) : (
            <AccessRestrictedCard onSwitchAccount={() => setIsLoginModalOpen(true)} />
          )
        )}

        {/* Oversight & Reports */}
        {currentTab === 'reports' && <ReportsExportView />}
        {currentTab === 'coordinator' && (
          canAccess('coordinator_hub') ? (
            <CoordinatorHub />
          ) : (
            <AccessRestrictedCard onSwitchAccount={() => setIsLoginModalOpen(true)} />
          )
        )}
        {currentTab === 'settings' && (
          canAccess('settings') ? (
            <SettingsView />
          ) : (
            <AccessRestrictedCard onSwitchAccount={() => setIsLoginModalOpen(true)} />
          )
        )}

      </main>

      {/* About Us (Mission, Vision, Core Values, Safety Guidelines, Lifeshaper Roles) Modal */}
      <AboutUsModal
        isOpen={isAboutUsOpen}
        onClose={() => setIsAboutUsOpen(false)}
      />

      {/* Live Notification Center & Birthday Celebrations Modal */}
      <NotificationCenterModal
        isOpen={isBirthdaysOpen}
        onClose={() => setIsBirthdaysOpen(false)}
        kids={kids}
        volunteers={volunteers}
      />

      {/* Edit My Account Modal */}
      <EditAccountModal
        isOpen={isEditAccountOpen}
        onClose={() => setIsEditAccountOpen(false)}
      />

      {/* Login & Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || !isAuthenticated}
        onClose={() => {
          setIsLoginModalOpen(false);
          setCurrentTab('kiosk');
        }}
        isMandatory={!isAuthenticated}
      />

      {/* Offline Connectivity Status Notification */}
      <OfflineIndicator />

      {/* Dedicated Distraction-Free Kiosk Scanner Screen */}
      <DedicatedScannerModal
        isOpen={isDedicatedScannerOpen}
        onClose={() => setIsDedicatedScannerOpen(false)}
      />

      {/* Database Backup & Google Workspace Sync Modal */}
      <BackupAndSyncModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Institutional Minimalist Footer */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-5 px-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white p-0.5 flex items-center justify-center border border-[#FF6F00] shadow-xs">
              <img
                src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                alt="NXTGEN"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-black text-slate-800 dark:text-white">{settings.churchName}</span>
            <span>•</span>
            <span className="text-slate-500 dark:text-slate-400">{settings.campusBranch}</span>
            <span>•</span>
            <span className="text-[#FF6F00] font-bold">Kids Church Every Sunday</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-xs">
            <button
              onClick={() => setIsAboutUsOpen(true)}
              className="text-slate-600 dark:text-slate-300 hover:text-[#0284c7] dark:hover:text-[#29C5E8] hover:underline font-bold cursor-pointer flex items-center gap-1.5"
            >
              <span>About Us</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsBirthdaysOpen(true)}
              className="text-amber-500 hover:underline font-bold cursor-pointer flex items-center gap-1"
            >
              <Cake className="w-3.5 h-3.5" /> Celebrations
            </button>
            <span>•</span>
            <button
              onClick={() => setIsEditAccountOpen(true)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#29C5E8]" />
              <span>{currentUser?.name || 'Account'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Access Restricted Card shown when Volunteer tries to open Admin-only feature
const AccessRestrictedCard: React.FC<{ onSwitchAccount: () => void }> = ({ onSwitchAccount }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl text-center max-w-lg mx-auto space-y-4 my-12 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mx-auto flex items-center justify-center">
        <Lock className="w-8 h-8" />
      </div>

      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
          Admin Privileges Required
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
          Administrator Access Only
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          This function is reserved for church leadership and administrators. Teachers and volunteers have access to Check-In & Pick-Up, Classroom Rosters, Volunteers (view only), and Reports/CSV Exports.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onSwitchAccount}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white font-black text-xs shadow-md shadow-cyan-500/25 cursor-pointer hover:opacity-95 transition-all"
        >
          Sign in as Administrator
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <MainAppContent />
      </AttendanceProvider>
    </AuthProvider>
  );
}
