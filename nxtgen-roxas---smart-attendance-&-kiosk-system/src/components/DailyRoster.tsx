import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileQuestion,
  XCircle,
  Search,
  Filter,
  CheckCheck,
  AlertCircle,
  Edit2,
  Trash2,
  ShieldCheck,
  Building,
  UserCheck,
  Heart,
  Baby,
  Smile,
  Phone,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { LevelId, NXTGEN_LEVELS, getLevelDetails, KidMember } from '../types/attendance';

export const DailyRoster: React.FC = () => {
  const {
    kids,
    volunteers,
    records,
    selectedSunday,
    setSelectedSunday,
    activeService,
    setActiveService,
    sundayServices,
    updateKidStatus,
    batchMarkLevel,
    checkInVolunteer,
  } = useAttendance();

  const [activeLevelTab, setActiveLevelTab] = useState<LevelId | 'all'>('aquarium');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleDateShift = (days: number) => {
    const d = new Date(selectedSunday);
    d.setDate(d.getDate() + days);
    setSelectedSunday(d.toISOString().split('T')[0]);
  };

  // Assigned Teachers / Volunteers for the current active level
  const assignedVolunteersForLevel = volunteers.filter((v) => {
    if (activeLevelTab === 'all') return true;
    return v.assignedLevel === activeLevelTab || v.assignedLevel === 'all';
  });

  // Filter kids
  const filteredKids = kids.filter((k) => {
    const matchesLevel = activeLevelTab === 'all' || k.calculatedLevelId === activeLevelTab;
    const matchesSearch =
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.securityCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.birthYear.toString().includes(searchQuery);

    const rec = records.find(
      (r) => r.kidId === k.id && r.sundayDate === selectedSunday && r.serviceName === activeService
    );
    const kidStatus = rec ? rec.status : 'unmarked';
    const matchesStatus = statusFilter === 'all' || kidStatus === statusFilter;

    return matchesLevel && matchesSearch && matchesStatus && k.status === 'active';
  });

  // Stats for the level
  const totalKidsInLevel = kids.filter(
    (k) => (activeLevelTab === 'all' || k.calculatedLevelId === activeLevelTab) && k.status === 'active'
  ).length;

  const presentCount = kids.filter((k) => {
    if (activeLevelTab !== 'all' && k.calculatedLevelId !== activeLevelTab) return false;
    const rec = records.find(
      (r) => r.kidId === k.id && r.sundayDate === selectedSunday && r.serviceName === activeService
    );
    return rec?.status === 'present';
  }).length;

  const currentLevelDef = activeLevelTab !== 'all' ? getLevelDetails(activeLevelTab) : null;

  return (
    <div className="space-y-6">
      {/* Top Filter and Sunday Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sunday Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateShift(-7)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Previous Sunday (-7 days)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-[#FF6F00]" />
              <input
                type="date"
                value={selectedSunday}
                onChange={(e) => setSelectedSunday(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-black text-sm focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleDateShift(7)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Next Sunday (+7 days)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedSunday(new Date().toISOString().split('T')[0])}
              className="px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[#29C5E8] text-xs font-black hover:bg-cyan-500/25 transition-all"
            >
              Today
            </button>
          </div>

          {/* Service Selector */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Service:
              </span>
              <select
                value={activeService}
                onChange={(e) => setActiveService(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer py-1"
              >
                {sundayServices.map((s) => (
                  <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 5 Levels Filter Tabs - Fluid for Mobile and Tablet */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
          <button
            onClick={() => setActiveLevelTab('all')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeLevelTab === 'all'
                ? 'bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/25'
                : 'bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-black">All Rooms</div>
            <div className="text-[10px] opacity-80 mt-0.5">Whole Kids Church</div>
          </button>

          {NXTGEN_LEVELS.map((lvl) => {
            const isActive = activeLevelTab === lvl.id;
            const count = kids.filter((k) => k.calculatedLevelId === lvl.id && k.status === 'active').length;

            return (
              <button
                key={lvl.id}
                onClick={() => setActiveLevelTab(lvl.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'shadow-md ring-2 ring-offset-1 dark:ring-offset-slate-900'
                    : 'bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                style={
                  isActive
                    ? { borderColor: lvl.color, backgroundColor: `${lvl.color}15`, boxShadow: `0 4px 14px 0 ${lvl.color}30` }
                    : {}
                }
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-black truncate"
                    style={{ color: isActive ? lvl.color : undefined }}
                  >
                    {lvl.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    {count} kids
                  </span>
                </div>
                <div className="text-[11px] font-bold mt-0.5" style={{ color: lvl.color }}>{lvl.ageRange}</div>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Level Info Banner with Assigned Teachers & Volunteers for this Sunday */}
      {currentLevelDef && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">{currentLevelDef.name}</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-black border"
                  style={{
                    backgroundColor: `${currentLevelDef.color}20`,
                    color: currentLevelDef.color,
                    borderColor: `${currentLevelDef.color}50`,
                  }}
                >
                  {currentLevelDef.ageRange}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:inline">
                  • {currentLevelDef.roomName}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{currentLevelDef.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Sunday Ratio Guide</div>
                <div className="text-xs font-black text-[#FF6F00]">
                  {currentLevelDef.ratioGuidelines}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Teachers/Volunteers for this Specific Sunday */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#29C5E8]" />
                Assigned Teachers & Volunteers for this Sunday ({assignedVolunteersForLevel.length}):
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Click checkmark to toggle attendance</span>
            </div>

            {assignedVolunteersForLevel.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                No volunteer currently assigned to this room. You can assign in the Volunteers tab.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignedVolunteersForLevel.map((vol) => (
                  <div
                    key={vol.id}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={vol.avatarUrl}
                        alt={vol.name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white truncate">{vol.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                          {vol.role.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => checkInVolunteer(vol.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                        vol.checkedInForSunday
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {vol.checkedInForSunday ? '✓ Checked In' : '+ Check In'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Roster Controls: Batch Actions & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm dark:shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {activeLevelTab !== 'all' && (
            <button
              onClick={() => batchMarkLevel(activeLevelTab, selectedSunday, activeService, 'present')}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[#29C5E8] font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Room Kids Present</span>
            </button>
          )}

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
            Total in Room: <span className="text-slate-900 dark:text-white font-black">{totalKidsInLevel}</span> • Checked In:{' '}
            <span className="text-[#FF6F00] dark:text-[#FF7A00] font-black">{presentCount}</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search child or parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 sm:py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#29C5E8]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 sm:py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Statuses</option>
            <option value="present" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Present Only</option>
            <option value="unmarked" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Unmarked Only</option>
          </select>
        </div>
      </div>

      {/* Kids Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Child Name</th>
                <th className="py-3.5 px-3">Birth Year & Placement</th>
                <th className="py-3.5 px-3">Parent / Guardian</th>
                <th className="py-3.5 px-3 text-center">Claim Tag</th>
                <th className="py-3.5 px-4 text-center">Sunday Attendance</th>
                <th className="py-3.5 px-3">In / Out Time</th>
                <th className="py-3.5 px-4">Allergies / Care Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredKids.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No matching children found for this level.
                  </td>
                </tr>
              ) : (
                filteredKids.map((kid) => {
                  const rec = records.find(
                    (r) =>
                      r.kidId === kid.id &&
                      r.sundayDate === selectedSunday &&
                      r.serviceName === activeService
                  );
                  const isPresent = rec?.status === 'present';
                  const levelDef = getLevelDetails(kid.calculatedLevelId);

                  return (
                    <tr key={kid.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                      {/* Kid Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={kid.avatarUrl}
                            alt={kid.name}
                            className="w-10 h-10 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 flex-shrink-0"
                          />
                          <div>
                            <div className="font-black text-slate-900 dark:text-white text-sm">{kid.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              ID: {kid.id} {kid.nickname && `• "${kid.nickname}"`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Birth Year & Level */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-[#FF6F00] bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 text-xs">
                            Born {kid.birthYear}
                          </span>
                        </div>
                        <div
                          className="text-[11px] font-black mt-1 px-2 py-0.5 rounded-md inline-block border"
                          style={{
                            backgroundColor: `${levelDef.color}15`,
                            color: levelDef.color,
                            borderColor: `${levelDef.color}35`,
                          }}
                        >
                          {levelDef.name}
                        </div>
                      </td>

                      {/* Parent / Guardian */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{kid.parentName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#29C5E8]" />
                          <span>{kid.parentPhone}</span>
                        </div>
                      </td>

                      {/* Claim Tag */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-black text-[#FF6F00] dark:text-[#FF7A00] bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/25 text-xs inline-block">
                          {kid.securityCode}
                        </span>
                      </td>

                      {/* Quick Status Pill Toggle */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateKidStatus(kid.id, selectedSunday, activeService, 'present')
                            }
                            title="Mark Present"
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              isPresent
                                ? 'bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-slate-950 shadow-md shadow-cyan-500/30'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateKidStatus(kid.id, selectedSunday, activeService, 'absent')
                            }
                            title="Mark Absent"
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              rec?.status === 'absent'
                                ? 'bg-rose-500 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>

                      {/* In / Out Time */}
                      <td className="py-3 px-3 font-mono text-xs">
                        {rec?.checkInTime ? (
                          <div>
                            <span className="text-slate-900 dark:text-white font-bold">{rec.checkInTime}</span>
                            {rec.checkOutTime && (
                              <span className="block text-[10px] text-[#FF6F00]">
                                Out: {rec.checkOutTime}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">--:-- --</span>
                        )}
                      </td>

                      {/* Allergies / Care Notes */}
                      <td className="py-3 px-4">
                        {kid.allergiesNotes ? (
                          <span className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-medium text-[11px] block max-w-xs truncate">
                            {kid.allergiesNotes}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">No allergies reported</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
