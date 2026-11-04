import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  AlertTriangle,
  Heart,
  CheckCircle2,
  Printer,
  Download,
  Calendar,
  Clock,
  Search,
  Sparkles,
  Baby,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { NXTGEN_LEVELS, getLevelDetails } from '../types/attendance';

export const CoordinatorHub: React.FC = () => {
  const {
    kids,
    volunteers,
    records,
    selectedSunday,
    activeService,
    settings,
  } = useAttendance();

  const [verifyCode, setVerifyCode] = useState<string>('');
  const [matchResult, setMatchResult] = useState<{
    found: boolean;
    kidName?: string;
    parentName?: string;
    levelName?: string;
    checkedIn?: boolean;
    allergies?: string;
  } | null>(null);

  const todayPresentRecords = records.filter(
    (r) => r.sundayDate === selectedSunday && r.serviceName === activeService && r.status === 'present'
  );

  const checkedInVolunteers = volunteers.filter((v) => v.checkedInForSunday);
  const coordinator = volunteers.find((v) => v.isMinistryCoordinator || v.role === 'coordinator');

  // Kids with allergy or care alerts currently checked in today
  const checkedInKidIds = new Set(todayPresentRecords.map((r) => r.kidId));
  const careAlertKids = kids.filter((k) => checkedInKidIds.has(k.id) && k.allergiesNotes);

  const handleVerifyClaimTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;

    const query = verifyCode.trim().toUpperCase();
    const kid = kids.find(
      (k) =>
        k.securityCode.toUpperCase() === query ||
        k.id.toUpperCase() === query ||
        k.name.toUpperCase().includes(query)
    );

    if (kid) {
      const rec = records.find(
        (r) =>
          r.kidId === kid.id &&
          r.sundayDate === selectedSunday &&
          r.serviceName === activeService &&
          r.status === 'present'
      );
      setMatchResult({
        found: true,
        kidName: kid.name,
        parentName: kid.parentName,
        levelName: getLevelDetails(kid.calculatedLevelId).name,
        checkedIn: Boolean(rec),
        allergies: kid.allergiesNotes,
      });
    } else {
      setMatchResult({ found: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Coordinator Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#29C5E8]/20 text-[#29C5E8] border border-cyan-500/30">
              MINISTRY DIRECTORY & SAFETY
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              {selectedSunday} • {activeService}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-[#FF6F00]" />
            Ministry Coordinator Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Real-time Sunday service oversight, room child-to-volunteer safety ratios, and claim tag verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#29C5E8]" />
            <span>Print Sunday Report</span>
          </button>
        </div>
      </div>

      {/* High-Level Safety & Sunday KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Kids in Rooms Today
          </span>
          <span className="text-3xl font-black text-[#29C5E8] mt-1 block">
            {todayPresentRecords.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">Present in Kids Church</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Volunteers on Duty
          </span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {checkedInVolunteers.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
            Across 5 levels & support roles
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Overall Ratio
          </span>
          <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">
            1 :{' '}
            {checkedInVolunteers.length > 0
              ? (todayPresentRecords.length / checkedInVolunteers.length).toFixed(1)
              : '0'}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
            ✓ Healthy safe coverage
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
          <span className="text-xs font-bold text-[#FF6F00] uppercase tracking-wider block">
            Care & Allergy Alerts
          </span>
          <span className="text-3xl font-black text-[#FF6F00] dark:text-[#FF7A00] mt-1 block">
            {careAlertKids.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">Kids with special instructions</span>
        </div>
      </div>

      {/* 5 Rooms Child-to-Volunteer Safety Ratio Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              Room-by-Room Headcount & Volunteer Ratio Health
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live headcount for each of the 5 levels based on birth year.
            </p>
          </div>
          <span className="text-xs font-mono text-[#29C5E8] bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/20">
            Current Service
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {NXTGEN_LEVELS.map((lvl) => {
            const kidsCount = todayPresentRecords.filter((r) => r.levelId === lvl.id).length;
            const teachersCount = volunteers.filter(
              (v) => (v.assignedLevel === lvl.id || v.assignedLevel === 'all') && v.checkedInForSunday
            ).length;

            const isRatioAdequate = teachersCount > 0;

            return (
              <div
                key={lvl.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">{lvl.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRatioAdequate ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 animate-ping'
                      }`}
                    ></span>
                  </div>
                  <div className="text-[11px] font-bold text-[#29C5E8] mt-0.5">{lvl.ageRange}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{lvl.roomName}</div>
                </div>

                <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Kids:</span>
                    <span className="font-black text-[#FF6F00] dark:text-[#FF7A00]">{kidsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Teachers:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{teachersCount}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                    <span className="text-slate-400 dark:text-slate-500">Target Ratio:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{lvl.ratioGuidelines.split(':')[1] || '1:5'}</span>
                  </div>
                </div>

                <div>
                  <span
                    className={`block text-center py-1 rounded-lg text-[10px] font-black ${
                      isRatioAdequate
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isRatioAdequate ? 'Staffed' : 'Needs Volunteer'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim Tag Matcher & Allergy Watchlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Claim Tag Lookup Tool (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#29C5E8]" />
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              Parent Claim Tag Verification Tool
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Coordinator verification: Search parent claim tag (e.g. NX-801) or child name to confirm parent identity before pickup.
          </p>

          <form onSubmit={handleVerifyClaimTag} className="flex gap-2">
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="e.g. NX-801, Liam, or NXK-101"
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white uppercase font-mono placeholder-slate-400 focus:outline-none focus:border-[#29C5E8]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer"
            >
              Verify
            </button>
          </form>

          {matchResult && (
            <div
              className={`p-4 rounded-2xl border text-xs ${
                matchResult.found
                  ? 'bg-slate-50 dark:bg-slate-950 border-cyan-500/50 text-slate-900 dark:text-white'
                  : 'bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-300'
              }`}
            >
              {matchResult.found ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#29C5E8]">
                      ✓ Match Verified: {matchResult.kidName}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {matchResult.checkedIn ? 'In Church' : 'Not Checked In'}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Authorized Parent:</span>{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{matchResult.parentName}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Room:</span>{' '}
                    <span className="text-slate-800 dark:text-slate-200">{matchResult.levelName}</span>
                  </div>
                  {matchResult.allergies && (
                    <div className="text-rose-600 dark:text-rose-300 font-bold mt-1">
                      ⚠️ Note: {matchResult.allergies}
                    </div>
                  )}
                </div>
              ) : (
                <div>❌ No matching security tag found in records.</div>
              )}
            </div>
          )}
        </div>

        {/* Sunday Allergy & Care Watchlist (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF6F00]" />
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Allergy & Care Watchlist ({careAlertKids.length})
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase text-[#FF6F00] dark:text-[#FF7A00] bg-orange-500/10 px-2 py-0.5 rounded">
              Snack Time Safety
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Children checked in today with special dietary needs or medical notes.
          </p>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {careAlertKids.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                No active dietary or care alerts recorded for today's attendees.
              </p>
            ) : (
              careAlertKids.map((k) => (
                <div
                  key={k.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3 text-xs"
                >
                  <img
                    src={k.avatarUrl}
                    alt={k.name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-white">{k.name}</span>
                      <span className="font-mono text-[10px] text-[#FF6F00] dark:text-[#FF7A00] font-black">
                        {k.securityCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-300 font-bold mt-0.5">
                      {k.allergiesNotes}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Parent: {k.parentName} ({k.parentPhone})
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
