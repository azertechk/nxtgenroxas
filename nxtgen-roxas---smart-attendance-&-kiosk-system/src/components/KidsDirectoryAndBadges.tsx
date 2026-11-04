import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  QrCode,
  Printer,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Phone,
  Sparkles,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  KidMember,
  NXTGEN_LEVELS,
  getLevelDetails,
  getLevelByBirthYear,
} from '../types/attendance';
import { generateQrDataUrl } from '../utils/qr';
import { resizeImageFile, backupPhotoToDriveIfConnected } from '../utils/imageUpload';

export const KidsDirectoryAndBadges: React.FC = () => {
  const { isAdmin } = useAuth();
  const { kids, addKid, updateKid, deleteKid, settings } = useAttendance();

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingKid, setEditingKid] = useState<KidMember | null>(null);
  const [viewingKid, setViewingKid] = useState<KidMember | null>(null);

  // Individual Badge Print Modal
  const [individualBadge, setIndividualBadge] = useState<KidMember | null>(null);

  // Batch Print Modal
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState<boolean>(false);

  // Badge Print Orientation (Portrait vs Landscape)
  const [badgeOrientation, setBadgeOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [printerNotification, setPrinterNotification] = useState<string | null>(null);

  // Kid Form State
  const [formData, setFormData] = useState<Partial<KidMember>>({
    id: '',
    name: '',
    nickname: '',
    gender: 'boy',
    birthDate: '2022-01-01',
    birthYear: 2022,
    calculatedLevelId: 'level_1',
    parentName: '',
    parentPhone: '',
    parentDGroupLeader: '',
    parentDGroupLeaderContact: '',
    allergiesNotes: '',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    securityCode: '',
    status: 'active',
  });

  // QR Code Cache
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
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
      backupPhotoToDriveIfConnected(compressed, `student-${formData.id || Date.now()}.jpg`);
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Could not process photo.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const map: Record<string, string> = {};
      for (const k of kids) {
        map[k.id] = await generateQrDataUrl(k.securityCode || k.id);
      }
      if (isMounted) {
        setQrCodes(map);
      }
    };
    generateAll();
    return () => {
      isMounted = false;
    };
  }, [kids]);

  // Dynamically compute preview level when birth year changes in form
  const previewLevelId = getLevelByBirthYear(
    formData.birthYear || 2022,
    settings.currentMinistryYear
  );
  const previewLevelDef = getLevelDetails(previewLevelId);

  // Filtered Kids
  const filteredKids = kids.filter((k) => {
    const matchesSearch =
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.securityCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.birthYear.toString().includes(searchQuery);

    const matchesLevel = levelFilter === 'all' || k.calculatedLevelId === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleOpenAdd = () => {
    const randomId = Math.floor(100 + Math.random() * 900);
    const defaultYear = 2022;
    setFormData({
      id: `NXK-${randomId}`,
      name: '',
      nickname: '',
      gender: 'boy',
      birthDate: `${defaultYear}-06-15`,
      birthYear: defaultYear,
      calculatedLevelId: getLevelByBirthYear(defaultYear, settings.currentMinistryYear),
      parentName: '',
      parentPhone: '+63 917 ',
      parentDGroupLeader: '',
      parentDGroupLeaderContact: '',
      allergiesNotes: '',
      avatarUrl: `https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80`,
      securityCode: `NXT-${Math.floor(800 + Math.random() * 99)}`,
      status: 'active',
    });
    setEditingKid(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (k: KidMember) => {
    setEditingKid(k);
    setFormData(k);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const bYear = Number(formData.birthYear) || 2022;
    const computedLevel = getLevelByBirthYear(bYear, settings.currentMinistryYear);

    if (editingKid) {
      updateKid({
        ...(formData as KidMember),
        birthYear: bYear,
        calculatedLevelId: computedLevel,
        parentDGroupLeader: formData.parentDGroupLeader || '',
        parentDGroupLeaderContact: formData.parentDGroupLeaderContact || '',
      });
    } else {
      addKid({
        ...(formData as Omit<KidMember, 'calculatedLevelId' | 'securityCode'>),
        birthYear: bYear,
        calculatedLevelId: computedLevel,
        parentDGroupLeader: formData.parentDGroupLeader || '',
        parentDGroupLeaderContact: formData.parentDGroupLeaderContact || '',
        securityCode: formData.securityCode || `NXT-${Math.floor(800 + Math.random() * 99)}`,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this child from the directory?')) {
      deleteKid(id);
    }
  };

  const handlePrintBadges = (orientation: 'portrait' | 'landscape' = badgeOrientation) => {
    if (typeof window === 'undefined' || typeof window.print !== 'function') {
      alert('Printing is not supported on this browser.');
      return;
    }
    document.body.classList.remove('print-portrait', 'print-landscape');
    document.body.classList.add(`print-${orientation}`);

    setPrinterNotification('Printer dialog detected & opened! (Select your printer or "Save as PDF")');
    setTimeout(() => setPrinterNotification(null), 4000);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#29C5E8]/20 text-[#0284c7] dark:text-[#29C5E8] border border-cyan-500/30 uppercase tracking-wider">
              NXTGEN ROXAS DIRECTORY & QR BADGES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#FF6F00]" />
            Kids Directory & Name Tag Badges
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Generate and print individual or batch scannable QR code badges & parent claim tags for registered children to expedite Sunday check-in.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Print All Badges Button */}
          <button
            onClick={() => setIsBatchPrintOpen(true)}
            className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#29C5E8]" />
            <span>Batch Print Kids Badges ({filteredKids.length})</span>
          </button>

          {/* Admin: Enroll New Kid */}
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF6F00] to-[#ea580c] text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll New Kid</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs transition-colors">
        <div className="w-full sm:flex-1 relative min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by child name, nickname, parent, or security code (e.g. NXT-801)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#29C5E8]"
          />
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#29C5E8]"
          >
            <option value="all">All 5 Levels</option>
            {NXTGEN_LEVELS.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.name} ({lvl.ageRange})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Children Directory & Badges Grid - Fluid Flexbox on Mobile, Multi-Column on Tablets & Desktop */}
      <div className="w-full flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredKids.map((kid) => {
          const levelDef = getLevelDetails(kid.calculatedLevelId);

          return (
            <div
              key={kid.id}
              className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 hover:border-cyan-500/50 transition-all flex flex-col justify-between group shadow-sm dark:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <img
                    src={kid.avatarUrl}
                    alt={kid.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                  <div className="text-right">
                    <span className="font-mono text-xs font-black text-[#FF6F00] dark:text-[#FF7A00] bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 block">
                      {kid.securityCode}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      Born {kid.birthYear}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${levelDef.badgeBg}`}
                    >
                      {levelDef.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                      ({levelDef.ageRange})
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 dark:text-white text-base mt-1 truncate group-hover:text-[#29C5E8] transition-colors">
                    {kid.name}
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                    Parent: {kid.parentName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {kid.parentPhone}
                  </div>

                  {kid.allergiesNotes && (
                    <div className="mt-2 p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-700 dark:text-rose-300 font-bold truncate">
                      ⚠️ {kid.allergiesNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions: PRINT QR BADGE is prominent */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => setIndividualBadge(kid)}
                  className="flex-1 py-1.5 px-2 bg-gradient-to-r from-cyan-500/10 to-sky-500/10 hover:from-cyan-500/20 hover:to-sky-500/20 text-[#0284c7] dark:text-[#29C5E8] border border-cyan-500/30 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Generate & Print Individual QR Code Badge"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#29C5E8]" />
                  <span>Print QR Badge</span>
                </button>

                <button
                  onClick={() => setViewingKid(kid)}
                  className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                  title="View Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(kid)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                      title="Edit Child"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(kid.id)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-rose-100 dark:hover:bg-rose-950/80 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                      title="Delete Child"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual QR Badge Modal */}
      {individualBadge && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 relative transition-colors">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#29C5E8]" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Child QR Badge & Parent Claim Tag
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* 2 Badge Orientations: Portrait vs Landscape */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBadgeOrientation('portrait')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      badgeOrientation === 'portrait'
                        ? 'bg-[#FF6F00] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadgeOrientation('landscape')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      badgeOrientation === 'landscape'
                        ? 'bg-[#FF6F00] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Landscape
                  </button>
                </div>

                <button
                  onClick={() => setIndividualBadge(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {printerNotification && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{printerNotification}</span>
              </div>
            )}

            {/* Print Card: Standard CR80 85.6 mm × 54 mm */}
            {(() => {
              const level = getLevelDetails(individualBadge.calculatedLevelId);
              const nickname = individualBadge.nickname || individualBadge.name.split(' ')[0];

              return (
                <div className="flex justify-center p-2 bg-slate-100 dark:bg-slate-950/60 rounded-2xl overflow-auto">
                  {badgeOrientation === 'portrait' ? (
                    /* CR80 PORTRAIT: 54 mm × 85.6 mm */
                    <div
                      className="badge-card badge-cr80-portrait bg-white text-slate-900 rounded-2xl border-2 shadow-xl overflow-hidden flex flex-col justify-between"
                      style={{
                        width: '54mm',
                        height: '85.6mm',
                        borderColor: level.color,
                      }}
                    >
                      {/* Top Lanyard Slot & Header */}
                      <div
                        className={`bg-gradient-to-r ${level.headerGradient} px-2 pt-1.5 pb-2 text-white text-center shrink-0`}
                      >
                        <div className="w-8 h-1 bg-white/40 rounded-full mx-auto mb-1" />
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
                            <img
                              src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                              alt="NXTGEN"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                            NXTGEN ROXAS
                          </span>
                        </div>
                        <div className="text-[8px] font-bold text-white/95 uppercase tracking-widest mt-0.5">
                          {level.name} ({level.ageRange})
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-2 flex-1 flex flex-col items-center justify-center text-center">
                        <img
                          src={individualBadge.avatarUrl}
                          alt={individualBadge.name}
                          className="w-13 h-13 rounded-xl object-cover border-2 shadow-xs shrink-0"
                          style={{ borderColor: level.color }}
                        />

                        {/* Nickname BIGGER than full name */}
                        <div className="mt-1 max-w-full">
                          <h2 className="text-base font-black text-slate-900 leading-tight uppercase tracking-tight truncate px-1">
                            {nickname}
                          </h2>
                          <div className="text-[9px] font-bold text-slate-500 truncate max-w-full px-1">
                            {individualBadge.name}
                          </div>
                        </div>

                        {/* Age Group Tag */}
                        <span
                          className={`mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${level.badgeBg}`}
                        >
                          {level.name} • {level.ageRange}
                        </span>

                        {/* QR Code with Security Code directly underneath */}
                        <div className="mt-1 flex flex-col items-center">
                          {qrCodes[individualBadge.id] ? (
                            <img
                              src={qrCodes[individualBadge.id]}
                              alt="QR Code"
                              className="w-14 h-14 object-contain"
                            />
                          ) : (
                            <div className="w-14 h-14 flex items-center justify-center text-[8px] text-slate-400">
                              QR
                            </div>
                          )}
                          <span className="font-mono text-[11px] font-black text-slate-900 leading-none mt-0.5">
                            {individualBadge.securityCode}
                          </span>
                        </div>
                      </div>

                      {/* Subtle Bottom Strip */}
                      <div className="py-1 px-2 bg-slate-100 border-t border-slate-200 text-center text-[7px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                        Nurturing Christlikeness
                      </div>
                    </div>
                  ) : (
                    /* CR80 LANDSCAPE: 85.6 mm × 54 mm */
                    <div
                      className="badge-card badge-cr80-landscape bg-white text-slate-900 rounded-2xl border-2 shadow-xl overflow-hidden flex flex-col justify-between"
                      style={{
                        width: '85.6mm',
                        height: '54mm',
                        borderColor: level.color,
                      }}
                    >
                      {/* Top Bar with Age Group Gradient */}
                      <div
                        className={`bg-gradient-to-r ${level.headerGradient} px-2.5 py-1 text-white flex items-center justify-between shrink-0`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
                            <img
                              src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                              alt="NXTGEN"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            NXTGEN ROXAS
                          </span>
                        </div>
                        <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {level.name} • {level.ageRange}
                        </span>
                      </div>

                      {/* Horizontal Card Body */}
                      <div className="p-2 flex-1 flex items-center justify-between gap-2">
                        {/* Child Photo */}
                        <img
                          src={individualBadge.avatarUrl}
                          alt={individualBadge.name}
                          className="w-14 h-14 rounded-xl object-cover border-2 shadow-xs shrink-0"
                          style={{ borderColor: level.color }}
                        />

                        {/* Center: Nickname BIGGER than full name */}
                        <div className="min-w-0 flex-1 pl-1">
                          <h2 className="text-lg font-black text-slate-900 uppercase leading-none tracking-tight truncate">
                            {nickname}
                          </h2>
                          <div className="text-[10px] font-bold text-slate-600 truncate mt-0.5">
                            {individualBadge.name}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${level.badgeBg}`}
                            >
                              {level.name} ({level.ageRange})
                            </span>
                          </div>
                        </div>

                        {/* Right: QR Code + Security Code Underneath */}
                        <div className="flex flex-col items-center shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          {qrCodes[individualBadge.id] && (
                            <img
                              src={qrCodes[individualBadge.id]}
                              alt="QR Code"
                              className="w-13 h-13 object-contain"
                            />
                          )}
                          <span className="font-mono text-[10px] font-black text-slate-900 leading-none mt-0.5">
                            {individualBadge.securityCode}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Footer */}
                      <div className="py-0.5 px-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[7px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                        <span>CCF Roxas • Kids Church</span>
                        <span className="font-mono">{individualBadge.id}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Print & Close */}
            <div className="flex items-center justify-between gap-3 pt-2 no-print">
              <div className="text-xs text-slate-500">
                Standard CR80 ID Card (85.6 mm × 54 mm) • Ready for badge/thermal printer.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIndividualBadge(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintBadges(badgeOrientation)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] hover:from-[#22b7d9] hover:to-[#0369a1] text-white font-black text-xs flex items-center gap-2 shadow-md shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Badge ({badgeOrientation === 'portrait' ? 'Portrait' : 'Landscape'})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Print Modal */}
      {isBatchPrintOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-4 sm:p-8">
          <div className="no-print max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 p-4 rounded-3xl border border-slate-800 mb-6 shadow-xl gap-4">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#29C5E8]" />
                Batch Printable Sheets ({filteredKids.length} Children Badges)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official NXTGEN branding, photos, parent claim ticket, and high-contrast scannable QR codes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Orientation Switcher for Batch Print */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700">
                <button
                  type="button"
                  onClick={() => setBadgeOrientation('portrait')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    badgeOrientation === 'portrait'
                      ? 'bg-[#FF6F00] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setBadgeOrientation('landscape')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    badgeOrientation === 'landscape'
                      ? 'bg-[#FF6F00] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Landscape
                </button>
              </div>

              <button
                onClick={() => handlePrintBadges(badgeOrientation)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#29C5E8] to-[#0284c7] hover:opacity-95 text-white font-black text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Entire Sheet ({badgeOrientation === 'portrait' ? 'Portrait' : 'Landscape'})</span>
              </button>
              <button
                onClick={() => setIsBatchPrintOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {printerNotification && (
            <div className="max-w-5xl mx-auto mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-2 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{printerNotification}</span>
            </div>
          )}

          <div className={`max-w-5xl mx-auto grid gap-6 ${
            badgeOrientation === 'portrait'
              ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2 print:gap-4'
              : 'grid-cols-1 md:grid-cols-2 print:grid-cols-2 print:gap-4'
          }`}>
            {filteredKids.map((kid) => {
              const level = getLevelDetails(kid.calculatedLevelId);
              const qr = qrCodes[kid.id];
              const nickname = kid.nickname || kid.name.split(' ')[0];

              return badgeOrientation === 'portrait' ? (
                /* CR80 PORTRAIT BATCH CARD: 54 mm × 85.6 mm */
                <div
                  key={`batch-kid-portrait-${kid.id}`}
                  className="badge-card badge-cr80-portrait bg-white text-slate-900 rounded-2xl overflow-hidden border-2 shadow-md flex flex-col justify-between mx-auto"
                  style={{
                    width: '54mm',
                    height: '85.6mm',
                    borderColor: level.color,
                  }}
                >
                  {/* Top Bar with Age Group Gradient */}
                  <div
                    className={`bg-gradient-to-r ${level.headerGradient} px-2 pt-1 pb-1.5 text-white text-center shrink-0`}
                  >
                    <div className="w-7 h-1 bg-white/40 rounded-full mx-auto mb-1" />
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-4 h-4 rounded bg-white p-0.5 flex items-center justify-center shrink-0">
                        <img
                          src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                          alt="NXTGEN"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider leading-none">
                        NXTGEN ROXAS
                      </span>
                    </div>
                    <div className="text-[7.5px] font-bold text-white/95 uppercase tracking-widest mt-0.5">
                      {level.name} ({level.ageRange})
                    </div>
                  </div>

                  {/* Body: Photo, Large Nickname, Full Name, QR with Security Code */}
                  <div className="p-2 flex-1 flex flex-col items-center justify-center text-center">
                    <img
                      src={kid.avatarUrl}
                      alt={kid.name}
                      className="w-13 h-13 rounded-xl object-cover border-2 shadow-xs shrink-0"
                      style={{ borderColor: level.color }}
                    />

                    {/* Nickname BIGGER than full name */}
                    <div className="mt-1 max-w-full">
                      <h3 className="text-base font-black text-slate-900 leading-tight uppercase tracking-tight truncate px-1">
                        {nickname}
                      </h3>
                      <div className="text-[9px] font-bold text-slate-500 truncate max-w-full px-1">
                        {kid.name}
                      </div>
                    </div>

                    <span
                      className={`mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${level.badgeBg}`}
                    >
                      {level.name} • {level.ageRange}
                    </span>

                    {/* QR Code + Security Code Underneath */}
                    <div className="mt-1 flex flex-col items-center">
                      {qr && (
                        <img src={qr} alt="QR" className="w-14 h-14 object-contain" />
                      )}
                      <span className="font-mono text-[11px] font-black text-slate-900 leading-none mt-0.5">
                        {kid.securityCode}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="py-0.5 px-2 bg-slate-100 border-t border-slate-200 text-center text-[7px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                    Nurturing Christlikeness
                  </div>
                </div>
              ) : (
                /* CR80 LANDSCAPE BATCH CARD: 85.6 mm × 54 mm */
                <div
                  key={`batch-kid-landscape-${kid.id}`}
                  className="badge-card badge-cr80-landscape bg-white text-slate-900 rounded-2xl overflow-hidden border-2 shadow-md flex flex-col justify-between mx-auto"
                  style={{
                    width: '85.6mm',
                    height: '54mm',
                    borderColor: level.color,
                  }}
                >
                  <div
                    className={`bg-gradient-to-r ${level.headerGradient} px-2.5 py-1 text-white flex items-center justify-between shrink-0`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
                        <img
                          src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
                          alt="NXTGEN"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        NXTGEN ROXAS
                      </span>
                    </div>
                    <span className="text-[8.5px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {level.name} • {level.ageRange}
                    </span>
                  </div>

                  <div className="p-2 flex-1 flex items-center justify-between gap-2">
                    <img
                      src={kid.avatarUrl}
                      alt={kid.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 shrink-0 shadow-xs"
                      style={{ borderColor: level.color }}
                    />
                    <div className="min-w-0 flex-1 pl-1">
                      {/* Nickname BIGGER than full name */}
                      <h4 className="text-lg font-black text-slate-900 uppercase leading-none tracking-tight truncate">
                        {nickname}
                      </h4>
                      <div className="text-[10px] font-bold text-slate-600 truncate mt-0.5">
                        {kid.name}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${level.badgeBg}`}
                        >
                          {level.name} ({level.ageRange})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200">
                      {qr && <img src={qr} alt="QR" className="w-13 h-13 object-contain" />}
                      <span className="font-mono text-[10px] font-black text-slate-900 leading-none mt-0.5">
                        {kid.securityCode}
                      </span>
                    </div>
                  </div>

                  <div className="py-0.5 px-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[7px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                    <span>CCF Roxas • Kids Church</span>
                    <span className="font-mono">{kid.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enroll / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#FF6F00]" />
                {editingKid ? 'Edit Child Details' : 'Enroll New Child'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {/* Photo Upload for Student */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-700 dark:text-slate-300">
                    Child Profile Photo / Badge Picture
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
                      src={formData.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'}
                      alt="Child Preview"
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
                        <span>Take Photo</span>
                      </button>
                    </div>

                    {formData.avatarUrl?.startsWith('data:') && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }))}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Child Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                    placeholder="e.g. Liam Gabriel"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nickname (for Name Tag)
                  </label>
                  <input
                    type="text"
                    value={formData.nickname || ''}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                    placeholder="e.g. Liam"
                  />
                </div>
              </div>

              {/* Birth Year & Placement */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-700 dark:text-slate-200 mb-1">
                      Birth Year * (Determines Level)
                    </label>
                    <input
                      type="number"
                      min={2013}
                      max={2026}
                      required
                      value={formData.birthYear || 2022}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFormData({ ...formData, birthYear: isNaN(val) ? 2022 : val });
                      }}
                      className="w-full min-w-0 bg-white dark:bg-slate-900 border border-cyan-400 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-black text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 dark:text-slate-200 mb-1">
                      Exact Birthdate (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate || ''}
                      onChange={(e) => {
                        const bDate = e.target.value;
                        const year = bDate ? new Date(bDate).getFullYear() : formData.birthYear;
                        setFormData({ ...formData, birthDate: bDate, birthYear: year });
                      }}
                      className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1">
                  <span>Assigned Room Placement:</span>
                  <span className="font-black text-[#0284c7] dark:text-[#29C5E8]">
                    {previewLevelDef.name} ({previewLevelDef.ageRange})
                  </span>
                </div>
              </div>

              {/* Parent Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent / Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.parentName || ''}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                    placeholder="e.g. Maria Roxas"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.parentPhone || ''}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="+63 917 123 4567"
                  />
                </div>
              </div>

              {/* DGroup Leader of Parent & Contact Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Name of DGroup Leader of Parent
                  </label>
                  <input
                    type="text"
                    value={formData.parentDGroupLeader || ''}
                    onChange={(e) => setFormData({ ...formData, parentDGroupLeader: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                    placeholder="e.g. Pastor Joel / Sis. Karen Yap"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Number of DGroup Leader
                  </label>
                  <input
                    type="tel"
                    value={formData.parentDGroupLeaderContact || ''}
                    onChange={(e) => setFormData({ ...formData, parentDGroupLeaderContact: e.target.value })}
                    className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="+63 917 888 1234"
                  />
                </div>
              </div>

              {/* Allergies / Special Care Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Allergies / Special Medical or Care Notes
                </label>
                <input
                  type="text"
                  value={formData.allergiesNotes || ''}
                  onChange={(e) => setFormData({ ...formData, allergiesNotes: e.target.value })}
                  className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  placeholder="e.g. Peanut allergy, Asthma inhaler in bag, etc."
                />
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
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6F00] to-[#ea580c] text-white font-black hover:opacity-90 shadow-sm cursor-pointer text-center"
                >
                  {editingKid ? 'Save Changes' : 'Enroll Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Child Details Modal */}
      {viewingKid && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white">Child Profile</h3>
              <button
                onClick={() => setViewingKid(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <img
                src={viewingKid.avatarUrl}
                alt={viewingKid.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#29C5E8] mx-auto shadow-sm"
              />
              <h4 className="font-black text-lg text-slate-900 dark:text-white">{viewingKid.name}</h4>
              <div className="text-xs text-[#FF6F00] font-black">{viewingKid.securityCode}</div>
              <div className="text-xs text-slate-500">
                {getLevelDetails(viewingKid.calculatedLevelId).name} • Born {viewingKid.birthYear}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="text-slate-500">Parent: <strong className="text-slate-900 dark:text-white">{viewingKid.parentName}</strong></div>
              <div className="text-slate-500">Contact: <strong className="text-slate-900 dark:text-white font-mono">{viewingKid.parentPhone}</strong></div>
              {viewingKid.parentDGroupLeader && (
                <div className="text-slate-500">
                  Parent DGroup Leader: <strong className="text-[#FF6F00]">{viewingKid.parentDGroupLeader}</strong>
                  {viewingKid.parentDGroupLeaderContact && ` (${viewingKid.parentDGroupLeaderContact})`}
                </div>
              )}
              {viewingKid.allergiesNotes && (
                <div className="text-rose-600 dark:text-rose-400 pt-1 font-bold">
                  ⚠️ Alert: {viewingKid.allergiesNotes}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingKid(null)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
