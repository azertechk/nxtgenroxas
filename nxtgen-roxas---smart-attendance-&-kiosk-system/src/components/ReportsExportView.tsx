import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Cake,
  FileText,
  Building,
  HeartHandshake,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { NXTGEN_LEVELS, getLevelDetails, LevelId } from '../types/attendance';
import { getBirthdayList } from './BirthdayNotificationsModal';

export const ReportsExportView: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    kids,
    volunteers,
    records,
    selectedSunday,
    setSelectedSunday,
    activeService,
    setActiveService,
    sundayServices,
  } = useAttendance();

  const [selectedReportLevel, setSelectedReportLevel] = useState<LevelId | 'all'>('all');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [printerNotification, setPrinterNotification] = useState<string | null>(null);

  const todayPresentRecords = records.filter(
    (r) => r.sundayDate === selectedSunday && r.serviceName === activeService && r.status === 'present'
  );

  const checkedInVolunteers = volunteers.filter((v) => v.checkedInForSunday);

  const triggerSuccessAlert = (name: string) => {
    setDownloadSuccess(name);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handlePrint = (reportName: string) => {
    if (typeof window === 'undefined' || typeof window.print !== 'function') {
      alert('Printing is not supported on this device/browser.');
      return;
    }
    document.body.classList.remove('print-portrait', 'print-landscape');
    document.body.classList.add('print-landscape'); // Reports look best in landscape

    setPrinterNotification(`Printer dialog detected for "${reportName}"! Choose your printer or "Save as PDF".`);
    setTimeout(() => setPrinterNotification(null), 5000);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Export Sunday Attendance Records CSV
  const handleExportAttendanceCsv = () => {
    const headers = [
      'Child ID',
      'Child Name',
      'Birth Year',
      'Calculated Level',
      'Age Range',
      'Parent / Guardian',
      'Parent Contact',
      'Security Claim Code',
      'Sunday Date',
      'Service',
      'Attendance Status',
      'Check-In Time',
      'Check-Out Time',
      'Allergy / Medical Care Notes',
    ];

    const targetKids = kids.filter((k) => {
      if (selectedReportLevel === 'all') return true;
      return k.calculatedLevelId === selectedReportLevel;
    });

    const rows = targetKids.map((k) => {
      const lvl = getLevelDetails(k.calculatedLevelId);
      const rec = records.find(
        (r) => r.kidId === k.id && r.sundayDate === selectedSunday && r.serviceName === activeService
      );

      return [
        `"${k.id}"`,
        `"${k.name}"`,
        `"${k.birthYear}"`,
        `"${lvl.name}"`,
        `"${lvl.ageRange}"`,
        `"${k.parentName}"`,
        `"${k.parentPhone}"`,
        `"${k.securityCode}"`,
        `"${selectedSunday}"`,
        `"${activeService}"`,
        `"${rec ? rec.status.toUpperCase() : 'UNMARKED'}"`,
        `"${rec?.checkInTime || '-'}"`,
        `"${rec?.checkOutTime || '-'}"`,
        `"${k.allergiesNotes || 'None'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `NXTGEN-Attendance-${selectedReportLevel}-${selectedSunday}.csv`;
    link.click();
    triggerSuccessAlert('Sunday Attendance CSV');
  };

  // Export Volunteers On-Duty Roster CSV
  const handleExportVolunteersCsv = () => {
    const headers = [
      'Volunteer ID',
      'Name',
      'Role',
      'Assigned Level / Room',
      'Phone',
      'Email',
      'Sunday Checked In',
      'Arrival Time',
    ];

    const rows = volunteers.map((v) => {
      const assignedName =
        v.assignedLevel === 'all'
          ? 'All Rooms / Service Wide'
          : v.assignedLevel === 'unassigned'
          ? 'Unassigned'
          : getLevelDetails(v.assignedLevel as LevelId).name;

      return [
        `"${v.id}"`,
        `"${v.name}"`,
        `"${v.role}"`,
        `"${assignedName}"`,
        `"${v.phone}"`,
        `"${v.email}"`,
        `"${v.checkedInForSunday ? 'YES' : 'NO'}"`,
        `"${v.checkInTime || '-'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `NXTGEN-Volunteers-Duty-${selectedSunday}.csv`;
    link.click();
    triggerSuccessAlert('Volunteers Duty Roster CSV');
  };

  // Export Birthdays List CSV
  const handleExportBirthdaysCsv = () => {
    const headers = ['Type', 'Name', 'Birth Date', 'Birth Year', 'Level / Role', 'Parent Contact'];

    const kidsRows = kids.map((k) => {
      const lvl = getLevelDetails(k.calculatedLevelId);
      return [
        '"Kid"',
        `"${k.name}"`,
        `"${k.birthDate}"`,
        `"${k.birthYear}"`,
        `"${lvl.name}"`,
        `"${k.parentPhone}"`,
      ].join(',');
    });

    const volRows = volunteers.map((v) => {
      return [
        '"Volunteer"',
        `"${v.name}"`,
        `"${v.birthDate || 'N/A'}"`,
        '"-"',
        `"${v.role}"`,
        `"${v.phone}"`,
      ].join(',');
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...kidsRows, ...volRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `NXTGEN-Birthdays-Directory-${new Date().getFullYear()}.csv`;
    link.click();
    triggerSuccessAlert('Birthdays Directory CSV');
  };

  const { todayBirthdays, upcomingThisWeek } = getBirthdayList(kids, volunteers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FF6F00]/20 text-[#FF6F00] dark:text-[#FF7A00] border border-[#FF6F00]/30">
              REPORTS & DATA EXPORTS
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              Available to Teachers & Administrators
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-[#29C5E8]" />
            Sunday Reports & CSV Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Generate and export attendance rosters, duty reports, and printable sheets for kids church records.
          </p>
        </div>

        {downloadSuccess && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Downloaded {downloadSuccess}
          </span>
        )}
      </div>

      {/* Printer Detection Notification */}
      {printerNotification && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{printerNotification}</span>
        </div>
      )}

      {/* Date & Service Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs w-full sm:w-auto min-w-0">
            <Calendar className="w-4 h-4 text-[#FF6F00] shrink-0" />
            <input
              type="date"
              value={selectedSunday}
              onChange={(e) => setSelectedSunday(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-black focus:outline-none cursor-pointer flex-1 min-w-0 w-full"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 w-full sm:w-auto min-w-0">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase shrink-0">
              Service:
            </span>
            <select
              value={activeService}
              onChange={(e) => setActiveService(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer py-1 flex-1 min-w-0"
            >
              {sundayServices.map((s) => (
                <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 w-full sm:w-auto min-w-0">
            <span className="text-[10px] font-black text-[#FF6F00] uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Users className="w-3 h-3" />
              Age Group:
            </span>
            <select
              value={selectedReportLevel}
              onChange={(e) => setSelectedReportLevel(e.target.value as LevelId | 'all')}
              className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer py-1 flex-1 min-w-0"
            >
              <option value="all" className="bg-white dark:bg-slate-900 font-bold">All Age Groups (All 5 Levels)</option>
              {NXTGEN_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id} className="bg-white dark:bg-slate-900">
                  {lvl.name} ({lvl.ageRange})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => handlePrint('Sunday Attendance & KPI Report')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto shrink-0"
          >
            <Printer className="w-3.5 h-3.5 text-[#29C5E8] shrink-0" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Kids Present
          </span>
          <span className="text-3xl font-black text-[#29C5E8] mt-1 block">
            {todayPresentRecords.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
            Across 5 Sunday Levels
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Teachers on Duty
          </span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {checkedInVolunteers.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
            Assigned to Sunday Rooms
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md">
          <span className="text-xs font-bold text-[#FF6F00] uppercase tracking-wider block">
            Total Enrolled Children
          </span>
          <span className="text-3xl font-black text-[#FF6F00] dark:text-[#FF7A00] mt-1 block">
            {kids.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
            In church master registry
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">
            Birthdays This Week
          </span>
          <span className="text-3xl font-black text-amber-500 mt-1 block">
            {todayBirthdays.length + upcomingThisWeek.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
            Children & Volunteers
          </span>
        </div>
      </div>

      {/* Main Export Action Cards */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-xl mx-auto'} gap-5`}>
        {/* Attendance Export Card - Available to Everyone */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-[#0284c7] dark:text-[#29C5E8] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Sunday Attendance Records (CSV)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download the complete attendance log for {selectedSunday} ({activeService}). Includes child name, birth year, level, check-in/out timestamps, parent details, and security claim codes.
            </p>
          </div>

          <button
            onClick={handleExportAttendanceCsv}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#29C5E8] to-[#0284c7] text-white font-black text-xs shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Attendance CSV</span>
          </button>
        </div>

        {/* Volunteer Duty Card - Admin Only */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Admin Exclusive
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Volunteer Duty & Roster (CSV)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Download the worker schedule for this Sunday. Shows all volunteers, their assigned classroom levels, duty attendance status, check-in time, and contact phone numbers.
              </p>
            </div>

            <button
              onClick={handleExportVolunteersCsv}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Volunteer Duty CSV</span>
            </button>
          </div>
        )}

        {/* Birthday Directory Card - Admin Only */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-[#FF6F00] flex items-center justify-center">
                  <Cake className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/15 text-[#FF6F00] border border-orange-500/30">
                  Admin Exclusive
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Birthdays Directory (CSV)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Export the complete birthday list for both children and church volunteers to coordinate celebrations, birthday gifts, and Sunday announcements.
              </p>
            </div>

            <button
              onClick={handleExportBirthdaysCsv}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6F00] to-[#ea580c] text-white font-black text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Birthdays CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Printable Classroom Roster Sheet (For Sunday Teacher Clipboards) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#29C5E8]" />
              Printable Sunday Classroom Attendance Sheet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formatted ready for physical clipboard printouts in each classroom.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handlePrint('Classroom Roster Sheet')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black text-xs flex items-center gap-2 self-start cursor-pointer hover:opacity-90 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Classroom Sheet</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Room / Level</th>
                <th className="py-3 px-3">Birth Year Range</th>
                <th className="py-3 px-3">Enrolled Kids</th>
                <th className="py-3 px-3">Checked-in Today</th>
                <th className="py-3 px-3">Assigned Teachers</th>
                <th className="py-3 px-4 text-right">Quick Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {NXTGEN_LEVELS.map((lvl) => {
                const roomKids = kids.filter((k) => k.calculatedLevelId === lvl.id && k.status === 'active');
                const roomPresent = roomKids.filter((k) => {
                  const r = records.find(
                    (rec) => rec.kidId === k.id && rec.sundayDate === selectedSunday && rec.serviceName === activeService
                  );
                  return r?.status === 'present';
                }).length;

                const roomVolunteers = volunteers.filter(
                  (v) => (v.assignedLevel === lvl.id || v.assignedLevel === 'all') && v.checkedInForSunday
                );

                return (
                  <tr key={lvl.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                          style={{ backgroundColor: lvl.color }}
                        />
                        <span className="font-black text-slate-900 dark:text-white">{lvl.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-4.5">{lvl.roomName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="font-mono text-xs font-black px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: `${lvl.color}15`,
                          color: lvl.color,
                          borderColor: `${lvl.color}40`,
                        }}
                      >
                        {lvl.ageRange}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {roomKids.length} kids
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-black text-[#FF6F00] dark:text-[#FF7A00]">
                        {roomPresent} present
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                      {roomVolunteers.length} on duty
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedReportLevel(lvl.id);
                          handleExportAttendanceCsv();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-[#0284c7] dark:text-[#29C5E8] hover:border-cyan-500 transition-colors cursor-pointer"
                      >
                        Export CSV
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
