import React, { useState, useEffect, useRef } from 'react';
import {
  HeartHandshake,
  UserPlus,
  UserCheck,
  CheckCircle2,
  Clock,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  Edit,
  Trash2,
  Plus,
  Search,
  Sparkles,
  Calendar,
  X,
  QrCode,
  Printer,
  Copy,
  Users,
  Camera,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { resizeImageFile, backupPhotoToDriveIfConnected } from '../utils/imageUpload';
import {
  Volunteer,
  VolunteerRole,
  LevelId,
  NXTGEN_LEVELS,
  getLevelDetails,
  LifeshaperCategory,
  VOLUNTEER_ROLES,
  getRoleLabel,
} from '../types/attendance';
import { generateQrDataUrl } from '../utils/qr';
import { sound } from '../utils/audio';

export const getTeacherDisplay = (fullName: string) => {
  const cleaned = fullName.replace(/^teacher\s+/i, '').trim();
  const firstName = cleaned.split(/\s+/)[0] || cleaned;
  return {
    teacherName: `Teacher ${firstName}`,
    fullName: cleaned,
  };
};

export const VolunteersView: React.FC = () => {
  const { isAdmin, pendingAccounts, approveAccount, rejectAccount } = useAuth();
  const {
    volunteers,
    selectedSunday,
    activeService,
    checkInVolunteer,
    assignVolunteer,
    addVolunteer,
    updateVolunteer,
    deleteVolunteer,
  } = useAttendance();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'lifeshaper' | 'junior_lifeshaper'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);

  // Badge Printing Modals & Orientation
  const [individualBadge, setIndividualBadge] = useState<Volunteer | null>(null);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState<boolean>(false);
  const [badgeOrientation, setBadgeOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printerNotification, setPrinterNotification] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Volunteer>>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'small_group_teacher',
    category: 'lifeshaper',
    dgroupLeaderName: '',
    dgroupLeaderPhone: '',
    assignedLevel: 'level_1',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
  });

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoError(null);
      const compressed = await resizeImageFile(file, 360, 360, 0.85);
      setFormData((prev) => ({ ...prev, avatarUrl: compressed }));
      backupPhotoToDriveIfConnected(compressed, `lifeshaper-${formData.id || Date.now()}.jpg`);
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Could not process photo.');
    }
  };

  // Printer Detection & Print Dispatcher
  const handlePrintBadges = (orientation: 'portrait' | 'landscape' = badgeOrientation) => {
    if (typeof window === 'undefined' || typeof window.print !== 'function') {
      alert('Printing is not supported on this browser.');
      return;
    }
    document.body.classList.remove('print-portrait', 'print-landscape');
    document.body.classList.add(`print-${orientation}`);

    setPrinterNotification('Printer dialog detected & ready! (Choose your printer or "Save as PDF")');
    setTimeout(() => setPrinterNotification(null), 4000);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Pre-generate QR codes for volunteers
  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const map: Record<string, string> = {};
      for (const v of volunteers) {
        map[v.id] = await generateQrDataUrl(v.id);
      }
      if (isMounted) setQrCodes(map);
    };
    generateAll();
    return () => {
      isMounted = false;
    };
  }, [volunteers]);

  const checkedInCount = volunteers.filter((v) => v.checkedInForSunday).length;
  const coordinator = volunteers.find((v) => v.isMinistryCoordinator || v.role === 'large_group_host' || v.role === 'coordinator');

  // Search by first name or last name + category + role
  const filteredVolunteers = volunteers.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    const nameParts = v.name.toLowerCase().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';

    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      firstName.includes(q) ||
      lastName.includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.phone.includes(q) ||
      (v.dgroupLeaderName && v.dgroupLeaderName.toLowerCase().includes(q));

    const matchesRole = roleFilter === 'all' || v.role === roleFilter;
    const matchesCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'junior_lifeshaper'
        ? v.category === 'junior_lifeshaper'
        : v.category !== 'junior_lifeshaper');

    return matchesSearch && matchesRole && matchesCategory;
  });

  const handleOpenAdd = () => {
    const nextNum = Math.floor(10 + Math.random() * 90);
    setFormData({
      id: `LS-${nextNum}`,
      name: '',
      email: '',
      phone: '+63 917 000 0000',
      role: 'small_group_teacher',
      category: 'lifeshaper',
      dgroupLeaderName: '',
      dgroupLeaderPhone: '',
      assignedLevel: 'aquarium',
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + nextNum}?w=150&auto=format&fit=crop&q=80`,
      status: 'active',
      checkedInForSunday: false,
    });
    setEditingVolunteer(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (v: Volunteer) => {
    setEditingVolunteer(v);
    setFormData(v);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingVolunteer) {
      updateVolunteer(formData as Volunteer);
    } else {
      addVolunteer(formData as Volunteer);
    }
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this Lifeshaper from the pool?')) {
      deleteVolunteer(id);
    }
  };

  const [admissionFeedback, setAdmissionFeedback] = useState<string | null>(null);

  const handleAdmitLifeshaper = (account: typeof pendingAccounts[0]) => {
    const res = approveAccount(account.id);
    if (res.success) {
      sound.playLifeshaperCheckIn();
      setAdmissionFeedback(`✓ Admitted ${account.name}! Account is now approved and active.`);
      setTimeout(() => setAdmissionFeedback(null), 4500);

      const alreadyInPool = volunteers.some(
        (v) =>
          v.name.toLowerCase() === account.name.toLowerCase() ||
          v.email.toLowerCase() === account.email.toLowerCase()
      );
      if (!alreadyInPool) {
        const nextNum = Math.floor(10 + Math.random() * 90);
        const isLevelMatch = (lvlStr?: string): LevelId | 'all' => {
          if (!lvlStr) return 'level_1';
          if (lvlStr.includes('Aquarium')) return 'aquarium';
          if (lvlStr.includes('1')) return 'level_1';
          if (lvlStr.includes('2')) return 'level_2';
          if (lvlStr.includes('3')) return 'level_3';
          if (lvlStr.includes('4')) return 'level_4';
          return 'all';
        };

        const newVol: Volunteer = {
          id: `LS-${nextNum}`,
          name: account.name,
          email: account.email,
          phone: account.phone || '+63 917 000 0000',
          role: 'small_group_teacher',
          category: 'lifeshaper',
          assignedLevel: isLevelMatch(account.assignedRoom),
          avatarUrl: account.avatarUrl,
          status: 'active',
          checkedInForSunday: false,
        };
        addVolunteer(newVol);
      }
    }
  };

  const handleDeclineLifeshaper = (account: typeof pendingAccounts[0]) => {
    if (window.confirm(`Decline account request for ${account.name}?`)) {
      rejectAccount(account.id);
      setAdmissionFeedback(`Declined registration for ${account.name}.`);
      setTimeout(() => setAdmissionFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FF6F00]/20 text-[#FF6F00] dark:text-[#FF7A00] border border-[#FF6F00]/40 uppercase tracking-wider">
              NXTGEN LIFESHAPERS & LEADERS
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              {selectedSunday} • {activeService}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <HeartHandshake className="w-7 h-7 text-[#29C5E8]" />
            Lifeshapers & Teachers Pool
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Adult Lifeshapers (18+) and Junior Lifeshapers (13-17) serving every Sunday across all 5 age group classrooms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {/* Print Lifeshaper Badges */}
          <button
            onClick={() => setIsBatchPrintOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-2 hover:bg-[#29C5E8] hover:text-slate-950 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#29C5E8]" />
            <span>Print Lifeshaper Badges</span>
          </button>

          {isAdmin ? (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white font-black text-xs flex items-center gap-2 shadow-md shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Lifeshaper to Pool</span>
            </button>
          ) : (
            <div className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>View-Only (Lifeshaper Mode)</span>
            </div>
          )}
        </div>
      </div>

      {/* Admission Feedback Notification */}
      {admissionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{admissionFeedback}</span>
        </div>
      )}

      {/* Admin Admission Panel for Pending Lifeshaper Account Registrations */}
      {isAdmin && pendingAccounts && pendingAccounts.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-cyan-500/10 border-2 border-[#FF6F00] rounded-3xl p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#FF6F00] animate-ping"></span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#FF6F00]" />
                  Pending Lifeshaper Account Admissions ({pendingAccounts.length} Awaiting Approval)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Only the admin can admit new Lifeshapers. Once admitted, their account is activated and they can sign in to manage Sunday attendance.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FF6F00] text-white self-start sm:self-auto shadow-xs">
              Admin Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={account.avatarUrl}
                    alt={account.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 dark:text-white text-sm truncate">
                      {account.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {account.email}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-50 dark:bg-cyan-950/60 text-[#0284c7] dark:text-[#29C5E8] border border-cyan-200 dark:border-cyan-800">
                        {account.assignedRoom || 'Level 1'}
                      </span>
                      {account.phone && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {account.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => handleAdmitLifeshaper(account)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    title="Admit and activate this Lifeshaper account"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Admit Account</span>
                  </button>
                  <button
                    onClick={() => handleDeclineLifeshaper(account)}
                    className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition-all cursor-pointer"
                    title="Decline this registration"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ministry Coordinator Card & Sunday Duty Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coordinator Feature Card (5 Cols) */}
        {coordinator && (
          <div className="lg:col-span-5 bg-gradient-to-br from-white via-slate-50 to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/40 rounded-3xl p-5 border-2 border-cyan-500/40 shadow-sm dark:shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#29C5E8]/20 text-[#0284c7] dark:text-[#29C5E8] border border-cyan-500/30 flex items-center gap-1.5 uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Ministry Coordinator
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {coordinator.checkedInForSunday ? '✓ On Duty Today' : 'Scheduled'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={coordinator.avatarUrl}
                  alt={coordinator.name}
                  className="w-18 h-18 rounded-2xl object-cover border-2 border-cyan-400 shadow-md flex-shrink-0"
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {coordinator.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Kids Church Coordinator & Administrative Lead
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#29C5E8]" />
                      {coordinator.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#FF6F00]" />
                      {coordinator.email}
                    </span>
                  </div>
                  {coordinator.dgroupLeaderName && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      DGroup Leader: <strong className="text-slate-700 dark:text-slate-200">{coordinator.dgroupLeaderName}</strong> ({coordinator.dgroupLeaderPhone})
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                Sunday Status:
              </span>
              <button
                onClick={() => checkInVolunteer(coordinator.id)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  coordinator.checkedInForSunday
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                    : 'bg-[#FF6F00] text-white hover:opacity-90'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {coordinator.checkedInForSunday ? 'Checked In' : 'Check In Coordinator'}
              </button>
            </div>
          </div>
        )}

        {/* Quick Duty Metrics (7 Cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Lifeshapers
            </span>
            <div className="my-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {volunteers.length}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">in pool</span>
            </div>
            <div className="text-[11px] font-bold text-[#0284c7] dark:text-[#29C5E8]">
              {volunteers.filter((v) => v.category !== 'junior_lifeshaper').length} Adults • {volunteers.filter((v) => v.category === 'junior_lifeshaper').length} Juniors
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Checked In Today
            </span>
            <div className="my-2">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {checkedInCount}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">on duty</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round((checkedInCount / (volunteers.length || 1)) * 100)}% attendance rate
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fast QR Badges
            </span>
            <div className="my-2">
              <span className="text-3xl font-black text-[#FF6F00]">
                {volunteers.length}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">badges</span>
            </div>
            <button
              onClick={() => setIsBatchPrintOpen(true)}
              className="text-[11px] font-black text-[#FF6F00] hover:underline text-left cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3 h-3" /> Batch Print All
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-3">
        {/* Search by First Name or Last Name */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Find a Lifeshaper by typing their firstname or lastname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#29C5E8]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-[10px] sm:text-xs font-bold w-full sm:w-auto text-center">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer truncate ${
                  categoryFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setCategoryFilter('lifeshaper')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer truncate ${
                  categoryFilter === 'lifeshaper'
                    ? 'bg-white dark:bg-slate-800 text-[#0284c7] dark:text-[#29C5E8] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Adult (18+)
              </button>
              <button
                onClick={() => setCategoryFilter('junior_lifeshaper')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer truncate ${
                  categoryFilter === 'junior_lifeshaper'
                    ? 'bg-white dark:bg-slate-800 text-[#FF6F00] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Junior (13-17)
              </button>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Roles</option>
              {VOLUNTEER_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span>
            Showing <strong>{filteredVolunteers.length}</strong> of {volunteers.length} Lifeshapers
          </span>
          {searchQuery && (
            <span>
              Filtering by name: <em>"{searchQuery}"</em>
            </span>
          )}
        </div>
      </div>

      {/* Lifeshaper Cards Grid - Fluid Flexbox on Mobile, Multi-Column on Tablets & Desktop */}
      <div className="w-full flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVolunteers.map((vol) => {
          const isJunior = vol.category === 'junior_lifeshaper';
          const assignedDef =
            vol.assignedLevel !== 'all' && vol.assignedLevel !== 'unassigned'
              ? getLevelDetails(vol.assignedLevel as LevelId)
              : null;
          const qr = qrCodes[vol.id];

          return (
            <div
              key={vol.id}
              className={`w-full bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                vol.checkedInForSunday
                  ? 'border-emerald-500/40 dark:border-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Card Top Category & Duty Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isJunior
                        ? 'bg-orange-500/15 text-[#ea580c] dark:text-[#FF7A00] border-orange-500/30'
                        : 'bg-cyan-500/15 text-[#0284c7] dark:text-[#29C5E8] border-cyan-500/30'
                    }`}
                  >
                    {isJunior ? 'Junior Lifeshaper (13-17)' : 'Lifeshaper (18+)'}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      vol.checkedInForSunday
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {vol.checkedInForSunday ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Present {vol.checkInTime ? `(${vol.checkInTime})` : ''}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Scheduled</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Profile row */}
                <div className="flex items-center gap-3">
                  <img
                    src={vol.avatarUrl}
                    alt={vol.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {vol.name}
                    </h3>
                    <div className="text-[11px] font-bold text-[#FF6F00] uppercase mt-0.5">
                      {getRoleLabel(vol.role)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {assignedDef ? `${assignedDef.name} (${assignedDef.ageRange})` : 'All Rooms'}
                    </div>
                  </div>
                </div>

                {/* DGroup Leader & Contacts */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Contact:</span>
                    <span className="font-mono text-[11px]">{vol.phone}</span>
                  </div>

                  {vol.dgroupLeaderName && (
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">DGroup Leader:</span>
                      <span className="text-[11px] font-bold truncate max-w-[170px]">
                        {vol.dgroupLeaderName} {vol.dgroupLeaderPhone ? `• ${vol.dgroupLeaderPhone}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Check In, Badge Print, and Admin edit */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => checkInVolunteer(vol.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    vol.checkedInForSunday
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{vol.checkedInForSunday ? 'Checked In' : 'Check In'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {/* Badge Print Modal Trigger */}
                  <button
                    onClick={() => setIndividualBadge(vol)}
                    title="Print Lifeshaper Badge with QR Code"
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#29C5E8] hover:text-slate-950 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(vol)}
                        title="Edit Lifeshaper Details"
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(vol.id)}
                        title="Remove Lifeshaper"
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Lifeshaper Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-[#29C5E8]" />
                {editingVolunteer ? 'Edit Lifeshaper' : 'Add New Lifeshaper'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {/* Photo Upload for Lifeshaper */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-700 dark:text-slate-300">
                    Lifeshaper Profile Photo / Badge Picture
                  </label>
                  <span className="text-[10px] text-[#0284c7] dark:text-[#29C5E8] font-bold">Standard 85.6mm ID Badge</span>
                </div>

                {/* Hidden File Inputs: Gallery Upload vs Camera Selfie */}
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="user"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={formData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt="Lifeshaper Preview"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#29C5E8] shadow-sm"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-col sm:flex-row items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="w-full sm:flex-1 py-2 px-2.5 rounded-xl bg-[#29C5E8]/10 hover:bg-[#29C5E8]/20 border border-[#29C5E8]/40 text-[#0284c7] dark:text-[#29C5E8] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full sm:flex-1 py-2 px-2.5 rounded-xl bg-[#FF6F00]/10 hover:bg-[#FF6F00]/20 border border-[#FF6F00]/40 text-[#ea580c] dark:text-[#FF7A00] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Selfie</span>
                      </button>
                    </div>

                    {formData.avatarUrl?.startsWith('data:') && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }))}
                        className="text-[10px] text-rose-500 hover:underline block text-center w-full cursor-pointer"
                      >
                        Reset to Default Placeholder
                      </button>
                    )}
                  </div>
                </div>

                {photoError && (
                  <div className="text-[11px] font-bold text-rose-500">
                    {photoError}
                  </div>
                )}
              </div>

              {/* Category selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lifeshaper Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'lifeshaper' })}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      formData.category !== 'junior_lifeshaper'
                        ? 'bg-cyan-500/15 border-[#29C5E8] text-[#0284c7] dark:text-[#29C5E8] font-black'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="text-xs">Lifeshaper</div>
                    <div className="text-[10px] opacity-80">Adult (18 years old & above)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'junior_lifeshaper' })}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      formData.category === 'junior_lifeshaper'
                        ? 'bg-orange-500/15 border-[#FF6F00] text-[#ea580c] dark:text-[#FF7A00] font-black'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="text-xs">Junior Lifeshaper</div>
                    <div className="text-[10px] opacity-80">13–17 years old (Graduate)</div>
                  </button>
                </div>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                    placeholder="e.g. Teacher Kyle"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sunday Role
                  </label>
                  <select
                    value={formData.role || 'small_group_teacher'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as VolunteerRole })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                  >
                    {VOLUNTEER_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="name@nxtgen.church"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="+63 917 123 4567"
                  />
                </div>
              </div>

              {/* DGroup Leader Details (Explicit requirement) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Discipleship Group (DGroup) Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Name of DGroup Leader:
                    </label>
                    <input
                      type="text"
                      value={formData.dgroupLeaderName || ''}
                      onChange={(e) => setFormData({ ...formData, dgroupLeaderName: e.target.value })}
                      className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                      placeholder="e.g. Pastor Joel / Sis. Karen"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Number of DGroup Leader:
                    </label>
                    <input
                      type="tel"
                      value={formData.dgroupLeaderPhone || ''}
                      onChange={(e) => setFormData({ ...formData, dgroupLeaderPhone: e.target.value })}
                      className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                      placeholder="e.g. +63 917 888 1234"
                    />
                  </div>
                </div>
              </div>

              {/* Assigned Room */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Age Group / Room
                </label>
                <select
                  value={formData.assignedLevel || 'all'}
                  onChange={(e) => setFormData({ ...formData, assignedLevel: e.target.value as LevelId | 'all' })}
                  className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                >
                  <option value="all">All Rooms / Service Wide</option>
                  {NXTGEN_LEVELS.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name} ({lvl.ageRange})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white font-black hover:opacity-90 shadow-sm cursor-pointer text-center"
                >
                  {editingVolunteer ? 'Save Changes' : 'Add to Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Lifeshaper Badge Print Modal */}
      {individualBadge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#29C5E8]" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Lifeshaper Identification Badge
                </h3>
              </div>
              <button
                onClick={() => setIndividualBadge(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printer notification */}
            {printerNotification && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{printerNotification}</span>
              </div>
            )}

            {/* Orientation Toggle */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Badge Orientation:
              </span>
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBadgeOrientation('portrait')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    badgeOrientation === 'portrait'
                      ? 'bg-white dark:bg-slate-900 text-[#FF6F00] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Portrait (Vertical)
                </button>
                <button
                  type="button"
                  onClick={() => setBadgeOrientation('landscape')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    badgeOrientation === 'landscape'
                      ? 'bg-white dark:bg-slate-900 text-[#FF6F00] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Landscape (Horizontal)
                </button>
              </div>
            </div>

            {/* Printable Badge Preview: Standard CR80 85.6 mm × 54 mm */}
            {(() => {
              const { teacherName, fullName } = getTeacherDisplay(individualBadge.name);

              return (
                <div className="flex justify-center p-2 bg-slate-100 dark:bg-slate-950/60 rounded-2xl overflow-auto">
                  {badgeOrientation === 'portrait' ? (
                    /* CR80 PORTRAIT: 54 mm × 85.6 mm */
                    <div
                      className="badge-card badge-cr80-portrait bg-white text-slate-900 rounded-2xl overflow-hidden border-2 border-[#FF6F00] shadow-xl flex flex-col justify-between"
                      style={{
                        width: '54mm',
                        height: '85.6mm',
                      }}
                    >
                      {/* Lanyard punch hole indicator & Header */}
                      <div className="bg-gradient-to-r from-[#FF6F00] to-[#ea580c] px-2 pt-1 pb-1.5 text-white text-center shrink-0">
                        <div className="w-7 h-1 bg-white/40 rounded-full mx-auto mb-1" />
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-4 h-4 rounded bg-white p-0.5 flex items-center justify-center shrink-0">
                            <img
                              src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                              alt="NXTGEN"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-[9.5px] font-black uppercase tracking-wider leading-none">
                            NXTGEN ROXAS
                          </span>
                        </div>
                        <div className="text-[7.5px] font-bold text-white/95 uppercase tracking-widest mt-0.5">
                          Lifeshaper Badge
                        </div>
                      </div>

                      {/* Photo & Teacher Identity */}
                      <div className="p-2 flex-1 flex flex-col items-center justify-center text-center">
                        <div className="relative">
                          <img
                            src={individualBadge.avatarUrl}
                            alt={individualBadge.name}
                            className="w-13 h-13 rounded-xl object-cover border-2 border-[#FF6F00] shadow-xs shrink-0"
                          />
                          <span
                            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[7px] font-black uppercase whitespace-nowrap shadow-xs ${
                              individualBadge.category === 'junior_lifeshaper'
                                ? 'bg-[#FF6F00] text-white'
                                : 'bg-[#29C5E8] text-slate-950'
                            }`}
                          >
                            {individualBadge.category === 'junior_lifeshaper' ? 'Junior' : 'Adult'}
                          </span>
                        </div>

                        {/* Teacher First Name Prominent, Full Name Below */}
                        <div className="mt-2 max-w-full">
                          <h4 className="text-base font-black text-slate-900 leading-tight truncate px-1">
                            {teacherName}
                          </h4>
                          <div className="text-[9px] font-bold text-slate-500 truncate max-w-full px-1">
                            {fullName}
                          </div>
                        </div>

                        <div className="mt-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[#ea580c] font-black text-[8px] uppercase tracking-wide">
                          {getRoleLabel(individualBadge.role)}
                        </div>

                        {/* QR Code + ID directly underneath */}
                        {qrCodes[individualBadge.id] && (
                          <div className="mt-1 flex flex-col items-center">
                            <img
                              src={qrCodes[individualBadge.id]}
                              alt="QR"
                              className="w-14 h-14 object-contain"
                            />
                            <span className="font-mono text-[10px] font-black text-slate-900 leading-none mt-0.5">
                              {individualBadge.id}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer */}
                      <div className="py-0.5 px-2 bg-slate-100 border-t border-slate-200 text-center text-[7px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                        CCF Roxas • Lifeshaper
                      </div>
                    </div>
                  ) : (
                    /* CR80 LANDSCAPE: 85.6 mm × 54 mm */
                    <div
                      className="badge-card badge-cr80-landscape bg-white text-slate-900 rounded-2xl overflow-hidden border-2 border-[#FF6F00] shadow-xl flex flex-col justify-between"
                      style={{
                        width: '85.6mm',
                        height: '54mm',
                      }}
                    >
                      {/* Top Bar */}
                      <div className="bg-gradient-to-r from-[#FF6F00] to-[#ea580c] px-2.5 py-1 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
                            <img
                              src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                              alt="NXTGEN"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            NXTGEN ROXAS • LIFESHAPER
                          </span>
                        </div>
                        <span className="font-mono text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded">
                          {individualBadge.id}
                        </span>
                      </div>

                      {/* Horizontal Body */}
                      <div className="p-2 flex-1 flex items-center justify-between gap-2">
                        {/* Avatar */}
                        <div className="flex flex-col items-center shrink-0">
                          <img
                            src={individualBadge.avatarUrl}
                            alt={individualBadge.name}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-[#FF6F00] shadow-xs"
                          />
                          <span
                            className={`mt-1 px-1.5 py-0.2 rounded-full text-[7px] font-black uppercase text-center ${
                              individualBadge.category === 'junior_lifeshaper'
                                ? 'bg-[#FF6F00] text-white'
                                : 'bg-[#29C5E8] text-slate-950'
                            }`}
                          >
                            {individualBadge.category === 'junior_lifeshaper' ? 'Junior' : 'Adult'}
                          </span>
                        </div>

                        {/* Name Info: Teacher Arjay prominent, full name below */}
                        <div className="min-w-0 flex-1 pl-1">
                          <h4 className="text-base font-black text-slate-900 leading-none truncate">
                            {teacherName}
                          </h4>
                          <div className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                            {fullName}
                          </div>
                          <div className="mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[#ea580c] font-black text-[8px] uppercase tracking-wide inline-block">
                              {getRoleLabel(individualBadge.role)}
                            </span>
                          </div>
                        </div>

                        {/* QR Code + ID underneath */}
                        <div className="flex flex-col items-center shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          {qrCodes[individualBadge.id] && (
                            <img
                              src={qrCodes[individualBadge.id]}
                              alt="QR"
                              className="w-13 h-13 object-contain"
                            />
                          )}
                          <span className="font-mono text-[10px] font-black text-slate-900 leading-none mt-0.5">
                            {individualBadge.id}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Strip */}
                      <div className="py-0.5 px-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[7px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                        <span>CCF Roxas • Lifeshaper Pool</span>
                        <span className="font-mono">{individualBadge.id}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIndividualBadge(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handlePrintBadges(badgeOrientation)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Badge ({badgeOrientation})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Print All Lifeshaper Badges Modal */}
      {isBatchPrintOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#FF6F00]" />
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Batch Print Lifeshaper Badges ({filteredVolunteers.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Print all badges in {badgeOrientation} layout for Sunday check-in.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Orientation Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBadgeOrientation('portrait')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      badgeOrientation === 'portrait'
                        ? 'bg-white dark:bg-slate-900 text-[#FF6F00] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadgeOrientation('landscape')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      badgeOrientation === 'landscape'
                        ? 'bg-white dark:bg-slate-900 text-[#FF6F00] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Landscape
                  </button>
                </div>

                <button
                  onClick={() => handlePrintBadges(badgeOrientation)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print All Badges</span>
                </button>
                <button
                  onClick={() => setIsBatchPrintOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printer feedback notification */}
            {printerNotification && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{printerNotification}</span>
              </div>
            )}

            {/* Grid of Printable Badges */}
            <div
              className={`flex-1 overflow-y-auto p-1 gap-4 grid ${
                badgeOrientation === 'portrait'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2'
              }`}
            >
              {filteredVolunteers.map((vol) => {
                const { teacherName, fullName } = getTeacherDisplay(vol.name);

                return (
                  <div
                    key={`batch-lifeshaper-${vol.id}`}
                    className="flex justify-center"
                  >
                    {badgeOrientation === 'portrait' ? (
                      /* CR80 PORTRAIT BATCH CARD: 54 mm × 85.6 mm */
                      <div
                        className="badge-card badge-cr80-portrait bg-white text-slate-900 rounded-2xl overflow-hidden border-2 border-[#FF6F00] shadow-sm flex flex-col justify-between mx-auto"
                        style={{
                          width: '54mm',
                          height: '85.6mm',
                        }}
                      >
                        {/* Top Bar */}
                        <div className="bg-gradient-to-r from-[#FF6F00] to-[#ea580c] px-2 pt-1 pb-1.5 text-white text-center shrink-0">
                          <div className="w-7 h-1 bg-white/40 rounded-full mx-auto mb-1" />
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-4 h-4 rounded bg-white p-0.5 flex items-center justify-center shrink-0">
                              <img
                                src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                                alt="NXTGEN"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="text-[9.5px] font-black uppercase tracking-wider leading-none">
                              NXTGEN ROXAS
                            </span>
                          </div>
                          <div className="text-[7.5px] font-bold text-white/95 uppercase tracking-widest mt-0.5">
                            Lifeshaper Badge
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-2 flex-1 flex flex-col items-center justify-center text-center">
                          <div className="relative">
                            <img
                              src={vol.avatarUrl}
                              alt={vol.name}
                              className="w-13 h-13 rounded-xl object-cover border-2 border-[#FF6F00] shadow-xs"
                            />
                            <span
                              className={`mt-1 px-1.5 py-0.2 rounded-full text-[7px] font-black uppercase ${
                                vol.category === 'junior_lifeshaper'
                                  ? 'bg-[#FF6F00] text-white'
                                  : 'bg-[#29C5E8] text-slate-950'
                              }`}
                            >
                              {vol.category === 'junior_lifeshaper' ? 'Junior' : 'Adult'}
                            </span>
                          </div>

                          <div className="mt-1.5 max-w-full">
                            <h4 className="text-base font-black text-slate-900 leading-tight truncate px-1">
                              {teacherName}
                            </h4>
                            <div className="text-[9px] font-bold text-slate-500 truncate max-w-full px-1">
                              {fullName}
                            </div>
                          </div>

                          <div className="mt-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[#ea580c] font-black text-[8px] uppercase tracking-wide">
                            {getRoleLabel(vol.role)}
                          </div>

                          {qrCodes[vol.id] && (
                            <div className="mt-1 flex flex-col items-center">
                              <img
                                src={qrCodes[vol.id]}
                                alt="QR"
                                className="w-14 h-14 object-contain"
                              />
                              <span className="font-mono text-[10px] font-black text-slate-900 leading-none mt-0.5">
                                {vol.id}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Strip */}
                        <div className="py-0.5 px-2 bg-slate-100 border-t border-slate-200 text-center text-[7px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                          CCF Roxas • Lifeshaper
                        </div>
                      </div>
                    ) : (
                      /* CR80 LANDSCAPE BATCH CARD: 85.6 mm × 54 mm */
                      <div
                        className="badge-card badge-cr80-landscape bg-white text-slate-900 rounded-2xl overflow-hidden border-2 border-[#FF6F00] shadow-sm flex flex-col justify-between mx-auto"
                        style={{
                          width: '85.6mm',
                          height: '54mm',
                        }}
                      >
                        <div className="bg-gradient-to-r from-[#FF6F00] to-[#ea580c] px-2.5 py-1 text-white flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded bg-white p-0.5 flex items-center justify-center shrink-0">
                              <img
                                src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                                alt="NXTGEN"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              NXTGEN ROXAS • LIFESHAPER
                            </span>
                          </div>
                          <span className="font-mono text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded">
                            {vol.id}
                          </span>
                        </div>

                        <div className="p-2 flex-1 flex items-center justify-between gap-2">
                          <div className="flex flex-col items-center shrink-0">
                            <img
                              src={vol.avatarUrl}
                              alt={vol.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <span
                              className={`mt-1 px-1.5 py-0.2 rounded-full text-[7px] font-black uppercase ${
                                vol.category === 'junior_lifeshaper'
                                  ? 'bg-[#FF6F00] text-white'
                                  : 'bg-[#29C5E8] text-slate-950'
                              }`}
                            >
                              {vol.category === 'junior_lifeshaper' ? 'Junior' : 'Adult'}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1 pl-1">
                            <h4 className="text-base font-black text-slate-900 leading-none truncate">
                              {teacherName}
                            </h4>
                            <div className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                              {fullName}
                            </div>
                            <div className="mt-1">
                              <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[#ea580c] font-black text-[8px] uppercase tracking-wide inline-block">
                                {getRoleLabel(vol.role)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200">
                            {qrCodes[vol.id] && (
                              <img
                                src={qrCodes[vol.id]}
                                alt="QR"
                                className="w-13 h-13 object-contain"
                              />
                            )}
                            <span className="font-mono text-[10px] font-black text-slate-900 leading-none mt-0.5">
                              {vol.id}
                            </span>
                          </div>
                        </div>

                        <div className="py-0.5 px-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[7px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                          <span>CCF Roxas • Lifeshaper Pool</span>
                          <span className="font-mono">{vol.id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
