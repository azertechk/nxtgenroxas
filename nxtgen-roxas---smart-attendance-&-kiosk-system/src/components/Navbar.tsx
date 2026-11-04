import React, { useState, useEffect } from 'react';
import {
  Scan,
  ClipboardList,
  Users,
  ShieldAlert,
  Settings,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Calendar,
  Sparkles,
  HeartHandshake,
  Sun,
  Moon,
  Cake,
  Info,
  FileSpreadsheet,
  LogIn,
  LogOut,
  User,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  Bell,
  Cloud,
  QrCode,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { getBirthdayList } from './BirthdayNotificationsModal';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab = 'kiosk' | 'roster' | 'volunteers' | 'reports' | 'coordinator' | 'kids' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAboutUs: () => void;
  onOpenBirthdays: () => void;
  onOpenLogin: () => void;
  onOpenEditAccount: () => void;
  onOpenDedicatedScanner?: () => void;
  onOpenBackup?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAboutUs,
  onOpenBirthdays,
  onOpenLogin,
  onOpenEditAccount,
  onOpenDedicatedScanner,
  onOpenBackup,
}) => {
  const {
    settings,
    updateSettings,
    selectedSunday,
    setSelectedSunday,
    kids,
    volunteers,
    unreadNotificationCount,
  } = useAttendance();

  const { currentUser, isAdmin, isVolunteer, logout, canAccess, pendingAccounts } = useAuth();

  const [time, setTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState<boolean>(false);

  const isLight = settings.theme !== 'dark';

  const { todayBirthdays, upcomingThisWeek } = getBirthdayList(kids, volunteers);
  const activeBirthdayCount = todayBirthdays.length + upcomingThisWeek.length;
  const totalAlertCount = unreadNotificationCount + activeBirthdayCount;

  useEffect(() => {
    const updateClock = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  interface NavItem {
    id: NavTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
    available: boolean;
  }

  interface NavGroup {
    groupLabel: string;
    items: NavItem[];
  }

  // Grouped Navigation Structure
  // 1. Sunday Operations (Live Check-in & Attendance 5 Levels)
  // 2. People (Lifeshapers & Kids Directory)
  // 3. Oversight & Reports (Reports & CSV Exports)
  // (Coordinator Hub and Settings moved to Account button for clean UX)
  const navGroups: NavGroup[] = [
    {
      groupLabel: 'Sunday Operations',
      items: [
        {
          id: 'kiosk' as NavTab,
          label: 'Check-In & Pick-Up',
          shortLabel: 'Check-In',
          icon: Scan,
          badge: 'Live',
          available: canAccess('checkin'),
        },
        {
          id: 'roster' as NavTab,
          label: 'Attendance',
          shortLabel: 'Attendance',
          icon: ClipboardList,
          available: canAccess('roster'),
        },
      ],
    },
    {
      groupLabel: 'People & Teams',
      items: [
        {
          id: 'volunteers' as NavTab,
          label: isAdmin ? 'Lifeshapers & Teachers' : 'Lifeshapers (View Only)',
          shortLabel: 'Lifeshapers',
          icon: HeartHandshake,
          badge: isVolunteer ? 'View' : undefined,
          available: canAccess('volunteers_view'),
        },
        {
          id: 'kids' as NavTab,
          label: 'Kids Directory & Badges',
          shortLabel: 'Kids',
          icon: Users,
          adminOnly: true,
          available: canAccess('kids_directory'),
        },
      ],
    },
    {
      groupLabel: 'Reports & Oversight',
      items: [
        {
          id: 'reports' as NavTab,
          label: 'Reports & CSV Exports',
          shortLabel: 'Reports',
          icon: FileSpreadsheet,
          available: canAccess('reports'),
        },
      ],
    },
  ];

  // Flat list of items available to the user
  const visibleNavItems = navGroups.flatMap((g) => g.items.filter((item) => item.available));

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      {/* Top Brand Accent Stripe with NXTGEN Cyan and Orange */}
      <div className="h-1 bg-gradient-to-r from-[#29C5E8] via-[#FF6F00] to-[#29C5E8]"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-18 gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white p-1 border-2 border-[#FF6F00] shadow-xs flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                alt="NXTGEN Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center">
                  <span className="text-[#0284c7] dark:text-[#29C5E8]">NXT</span>
                  <span className="text-[#FF6F00]">GEN</span>
                  <span className="ml-1.5 text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">Roxas</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF6F00]/10 text-[#FF6F00] border border-[#FF6F00]/25">
                  Kids Church
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                Attendance Management System
              </p>
            </div>
          </div>

          {/* Grouped Purposeful Navigation (Desktop & Laptop) */}
          <nav className="hidden xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            {navGroups.map((group, groupIdx) => (
              <div key={group.groupLabel} className="flex items-center gap-1">
                {groupIdx > 0 && (
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
                )}
                {group.items
                  .filter((item) => item.available)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.shortLabel || item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#FF6F00] text-white font-black uppercase">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))}
          </nav>

          {/* Right Controls with Account at Upper Right Corner */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Sunday Date Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#FF6F00]" />
              <input
                type="date"
                value={selectedSunday}
                onChange={(e) => setSelectedSunday(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
              />
            </div>

            {/* Live Clock Pill */}
            <div className="text-right hidden md:block bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold text-[#0284c7] dark:text-cyan-400">
              {time || '--:--:--'}
            </div>

            {/* About Us (Institutional Overview & Guidelines) */}
            <button
              onClick={onOpenAboutUs}
              title="About Us"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-[#29C5E8]" />
              <span className="hidden lg:inline">About Us</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* In-App Offline PWA Install Button */}
            <PWAInstallButton />

            {/* Notification Icon (Live Activity & Birthdays) beside Account */}
            <button
              onClick={onOpenBirthdays}
              title={
                totalAlertCount > 0
                  ? `${totalAlertCount} Notifications & Celebrations (${unreadNotificationCount} unread activity, ${activeBirthdayCount} birthdays)`
                  : 'Notifications & Celebrations'
              }
              className={`p-2 rounded-2xl border relative transition-all cursor-pointer ${
                totalAlertCount > 0
                  ? 'bg-orange-50 dark:bg-orange-500/10 border-[#FF6F00]/50 text-[#FF6F00] hover:bg-orange-100 dark:hover:bg-orange-500/20 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              aria-label="Notifications & Birthdays"
            >
              <Bell className="w-4 h-4" />
              {totalAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FF6F00] text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                  {totalAlertCount}
                </span>
              )}
            </button>

            {/* User Account / Role Badge Pill - Upper Right Corner */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-xs relative"
                >
                  <div className="relative">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                    />
                    {isAdmin && pendingAccounts && pendingAccounts.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#FF6F00] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                        {pendingAccounts.length}
                      </span>
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] font-black tracking-wide flex items-center gap-1">
                      {isAdmin ? (
                        <span className="text-[#0284c7] dark:text-[#29C5E8]">ADMIN</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">TEACHER</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Account Dropdown Menu with Coordinator, Settings, Edit Account, Night Mode, Sound, Switch, and Log Out */}
                {isAccountDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsAccountDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 text-xs space-y-2.5 animate-in fade-in zoom-in-95">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="font-black text-slate-900 dark:text-white text-sm truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </div>
                        <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF6F00]/10 text-[#FF6F00] border border-[#FF6F00]/20">
                          {currentUser.title || (isAdmin ? 'Full Administrator' : 'Sunday Lifeshaper')}
                        </div>
                      </div>

                      <div className="space-y-1">
                        {/* Pending Lifeshaper Account Admissions (Admin only) */}
                        {isAdmin && pendingAccounts && pendingAccounts.length > 0 && (
                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              onSelectTab('volunteers');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl bg-orange-500/15 border border-[#FF6F00]/40 text-[#FF6F00] font-black flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-[#FF6F00]" />
                              <span>Pending Lifeshapers</span>
                            </span>
                            <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-[#FF6F00] text-white animate-pulse">
                              {pendingAccounts.length} Awaiting
                            </span>
                          </button>
                        )}
                        {/* Coordinator Section inside Account Button */}
                        {canAccess('coordinator_hub') && (
                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              onSelectTab('coordinator');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-[#FF6F00]" />
                              <span>Coordinator Safety Hub</span>
                            </span>
                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-orange-500/15 text-[#FF6F00]">
                              Admin
                            </span>
                          </button>
                        )}

                        {/* Settings Section inside Account Button */}
                        {canAccess('settings') && (
                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              onSelectTab('settings');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Settings className="w-4 h-4 text-[#29C5E8]" />
                              <span>System Settings</span>
                            </span>
                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-cyan-500/15 text-[#0284c7] dark:text-[#29C5E8]">
                              Admin
                            </span>
                          </button>
                        )}

                        {/* Edit My Account */}
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            onOpenEditAccount();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                            <span>Edit My Account</span>
                          </span>
                        </button>

                        {/* Dedicated Scanner Kiosk */}
                        {onOpenDedicatedScanner && (
                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              onOpenDedicatedScanner();
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Scan className="w-4 h-4 text-[#29C5E8]" />
                              <span>Dedicated Scanner Screen</span>
                            </span>
                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-cyan-500/15 text-[#0284c7] dark:text-[#29C5E8]">
                              Kiosk
                            </span>
                          </button>
                        )}

                        {/* Database Backup & Google Sync */}
                        {onOpenBackup && (
                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              onOpenBackup();
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Cloud className="w-4 h-4 text-[#FF6F00]" />
                              <span>Backup & Google Sync</span>
                            </span>
                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-orange-500/15 text-[#FF6F00]">
                              Cloud
                            </span>
                          </button>
                        )}

                        <div className="h-px bg-slate-200 dark:bg-slate-800 my-1"></div>

                        {/* Night Mode / Light Mode Toggle inside Account */}
                        <button
                          onClick={() => updateSettings({ theme: isLight ? 'dark' : 'light' })}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            {isLight ? (
                              <Moon className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <Sun className="w-4 h-4 text-amber-400" />
                            )}
                            <span>Display Theme</span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {isLight ? 'Light Mode' : 'Night Mode'}
                          </span>
                        </button>

                        {/* Sound Effects Toggle inside Account */}
                        <button
                          onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            {settings.soundEnabled ? (
                              <Volume2 className="w-4 h-4 text-[#0284c7] dark:text-[#29C5E8]" />
                            ) : (
                              <VolumeX className="w-4 h-4 text-slate-400" />
                            )}
                            <span>Kiosk Audio</span>
                          </span>
                          <span
                            className={`text-[11px] font-bold ${
                              settings.soundEnabled
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {settings.soundEnabled ? 'Enabled' : 'Muted'}
                          </span>
                        </button>

                        {/* Switch Account */}
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            onOpenLogin();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#29C5E8]" />
                            <span>Switch Account</span>
                          </span>
                        </button>

                        {/* Log Out Button */}
                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => {
                              setIsAccountDropdownOpen(false);
                              logout();
                              onOpenLogin();
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <LogOut className="w-4 h-4" />
                              <span>Log Out</span>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Responsive Navigation: Reduced font size so all tabs from Check-in up to Reports fit into whole screen in portrait mode */}
        <div className="grid xl:hidden grid-flow-col auto-cols-fr w-full py-1.5 px-0.5 sm:px-1 gap-1 border-t border-slate-200 dark:border-slate-800">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-0.5 sm:px-1.5 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[11px] font-bold text-center leading-tight transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate max-w-full font-extrabold">{item.shortLabel || item.label}</span>
                {item.badge && (
                  <span className="hidden sm:inline-block px-1 py-0.2 rounded-full text-[8px] bg-[#FF6F00] text-white font-black uppercase">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
